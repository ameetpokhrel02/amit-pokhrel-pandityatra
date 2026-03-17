import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import apiClient from "@/lib/api-client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import VideoTile from "./VideoTile"
import { Loader2, Mic, MicOff, Video, VideoOff, PhoneOff, Send } from "lucide-react"

type SignalPayload = {
  type: string
  user_id?: number
  username?: string
  target_user_id?: number
  sdp?: RTCSessionDescriptionInit
  candidate?: RTCIceCandidateInit
  message?: string
  sender?: 'user' | 'pandit' | 'ai'
  chat_id?: number
  messages?: Array<{
    chat_id: number
    message: string
    user_id?: number
    username?: string
    sender?: 'user' | 'pandit' | 'ai'
    timestamp?: string
  }>
  timestamp?: string
}

type RoomChatMessage = {
  id: number
  message: string
  userId?: number
  username?: string
  sender?: 'user' | 'pandit' | 'ai'
  timestamp?: string
}

function getErrorMessage(err: unknown, fallback: string) {
  if (typeof err === 'object' && err !== null) {
    const maybeResponse = err as { response?: { data?: { error?: string; reason?: string } } }
    const responseMessage = maybeResponse.response?.data?.error
    if (responseMessage) return responseMessage

    const responseReason = maybeResponse.response?.data?.reason
    if (responseReason) return responseReason

    const maybeError = err as { message?: string }
    if (maybeError.message) return maybeError.message
  }
  return fallback
}

export default function PujaRoom() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token, user } = useAuth()

  const [bookingId, setBookingId] = useState<string | null>(null)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)

  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({})
  const [isMicOn, setIsMicOn] = useState(true)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [isUploadingRecording, setIsUploadingRecording] = useState(false)
  const [recordingError, setRecordingError] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<RoomChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')

  const wsRef = useRef<WebSocket | null>(null)
  const peersRef = useRef<Map<number, RTCPeerConnection>>(new Map())
  const myUserIdRef = useRef<number | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])

  const wsBaseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'
  const iceServers = useMemo(() => {
    const raw = import.meta.env.VITE_ICE_SERVERS_JSON
    if (!raw) {
      return [{ urls: 'stun:stun.l.google.com:19302' }]
    }

    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    } catch {
      // fallback to default STUN below
    }

    return [{ urls: 'stun:stun.l.google.com:19302' }]
  }, [])

  const sendSignal = useCallback((payload: SignalPayload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload))
    }
  }, [])

  const cleanupPeer = useCallback((remoteUserId: number) => {
    const pc = peersRef.current.get(remoteUserId)
    if (pc) {
      pc.onicecandidate = null
      pc.ontrack = null
      pc.onconnectionstatechange = null
      pc.close()
      peersRef.current.delete(remoteUserId)
    }

    setRemoteStreams((prev) => {
      const next = { ...prev }
      delete next[String(remoteUserId)]
      return next
    })
  }, [])

  const createOrGetPeer = useCallback((remoteUserId: number): RTCPeerConnection => {
    const existing = peersRef.current.get(remoteUserId)
    if (existing) return existing

    const pc = new RTCPeerConnection({ iceServers })

    const currentLocalStream = localStreamRef.current
    if (currentLocalStream) {
      currentLocalStream.getTracks().forEach((track) => pc.addTrack(track, currentLocalStream))
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({
          type: 'ice-candidate',
          candidate: event.candidate.toJSON(),
          target_user_id: remoteUserId,
        })
      }
    }

    pc.ontrack = (event) => {
      const [stream] = event.streams
      if (stream) {
        setRemoteStreams((prev) => ({ ...prev, [String(remoteUserId)]: stream }))
      }
    }

    pc.onconnectionstatechange = () => {
      if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) {
        cleanupPeer(remoteUserId)
      }
    }

    peersRef.current.set(remoteUserId, pc)
    return pc
  }, [cleanupPeer, iceServers, sendSignal])

  const createOfferFor = useCallback(async (remoteUserId: number) => {
    const pc = createOrGetPeer(remoteUserId)
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    sendSignal({ type: 'offer', sdp: offer, target_user_id: remoteUserId })
  }, [createOrGetPeer, sendSignal])

  const handleSignalMessage = useCallback(async (data: SignalPayload) => {
    const myUserId = myUserIdRef.current

    if (data.type === 'chat-history') {
      const history = (data.messages || []).map((m) => ({
        id: m.chat_id,
        message: m.message,
        userId: m.user_id,
        username: m.username,
        sender: m.sender,
        timestamp: m.timestamp,
      }))
      setChatMessages(history)
      return
    }

    if (data.type === 'chat') {
      setChatMessages((prev) => {
        const next: RoomChatMessage = {
          id: data.chat_id || Date.now(),
          message: data.message || '',
          userId: data.user_id,
          username: data.username,
          sender: data.sender,
          timestamp: data.timestamp,
        }
        if (!next.message) return prev
        return [...prev, next]
      })
      return
    }

    if (data.type === 'connected') {
      myUserIdRef.current = data.user_id || user?.id || null
      sendSignal({ type: 'join' })
      return
    }

    if (data.type === 'error') {
      setError(data.message || 'Signaling error')
      return
    }

    if (!data.user_id || (myUserId && data.user_id === myUserId)) {
      return
    }

    if (data.target_user_id && myUserId && data.target_user_id !== myUserId) {
      return
    }

    const remoteUserId = data.user_id

    if (data.type === 'participant-left') {
      cleanupPeer(remoteUserId)
      return
    }

    if (data.type === 'participant-joined' || data.type === 'join') {
      if (!myUserId) return
      if (myUserId < remoteUserId) {
        await createOfferFor(remoteUserId)
      }
      return
    }

    if (data.type === 'offer' && data.sdp) {
      const pc = createOrGetPeer(remoteUserId)
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      sendSignal({ type: 'answer', sdp: answer, target_user_id: remoteUserId })
      return
    }

    if (data.type === 'answer' && data.sdp) {
      const pc = createOrGetPeer(remoteUserId)
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
      return
    }

    if (data.type === 'ice-candidate' && data.candidate) {
      const pc = createOrGetPeer(remoteUserId)
      await pc.addIceCandidate(new RTCIceCandidate(data.candidate))
    }
  }, [cleanupPeer, createOfferFor, createOrGetPeer, sendSignal, user?.id])

  const closeAll = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    peersRef.current.forEach((pc) => pc.close())
    peersRef.current.clear()

    setRemoteStreams({})
    setIsConnected(false)
  }, [])

  const stopLocalMedia = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop())
    localStreamRef.current = null
    setLocalStream(null)
  }, [])

  const uploadRecordingBlob = useCallback(async (blob: Blob) => {
    if (!roomId || !blob.size) return

    setIsUploadingRecording(true)
    setRecordingError(null)

    try {
      const ext = blob.type.includes('mp4') ? 'mp4' : 'webm'
      const file = new File([blob], `puja-recording-${roomId}-${Date.now()}.${ext}`, {
        type: blob.type || 'video/webm',
      })

      const formData = new FormData()
      formData.append('recording', file)

      await apiClient.post(`/video/rooms/${encodeURIComponent(roomId)}/upload-recording/`, formData)
    } catch (err: unknown) {
      console.error('Recording upload failed', err)
      setRecordingError(getErrorMessage(err, 'Recording upload failed'))
    } finally {
      setIsUploadingRecording(false)
    }
  }, [roomId])

  const buildRecordingStream = useCallback(() => {
    const stream = new MediaStream()

    if (localStream) {
      localStream.getTracks().forEach((track) => stream.addTrack(track))
    }

    Object.values(remoteStreams).forEach((remoteStream) => {
      remoteStream.getAudioTracks().forEach((track) => stream.addTrack(track))
      remoteStream.getVideoTracks().forEach((track) => stream.addTrack(track))
    })

    return stream
  }, [localStream, remoteStreams])

  const startRecording = useCallback(() => {
    if (isRecording) return
    if (!localStream) {
      setRecordingError('Local media stream is not ready for recording')
      return
    }

    if (typeof MediaRecorder === 'undefined') {
      setRecordingError('MediaRecorder is not supported in this browser')
      return
    }

    try {
      const composedStream = buildRecordingStream()
      if (!composedStream.getTracks().length) {
        setRecordingError('No active media tracks available for recording')
        return
      }

      const preferredTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ]
      const selectedType = preferredTypes.find((t) => {
        try {
          return MediaRecorder.isTypeSupported(t)
        } catch {
          return false
        }
      })

      const recorder = selectedType
        ? new MediaRecorder(composedStream, { mimeType: selectedType })
        : new MediaRecorder(composedStream)

      recordedChunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      recorder.start(1000)
      mediaRecorderRef.current = recorder
      setRecordingError(null)
      setIsRecording(true)
    } catch (err) {
      console.error('Failed to start recording', err)
      setRecordingError('Unable to start recording')
    }
  }, [buildRecordingStream, isRecording, localStream])

  const stopRecordingAndUpload = useCallback(async () => {
    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state === 'inactive') {
      setIsRecording(false)
      return
    }

    const blob = await new Promise<Blob | null>((resolve) => {
      const onStop = () => {
        const chunks = recordedChunksRef.current
        recordedChunksRef.current = []
        if (!chunks.length) {
          resolve(null)
          return
        }
        resolve(new Blob(chunks, { type: recorder.mimeType || 'video/webm' }))
      }

      const onError = () => resolve(null)
      recorder.addEventListener('stop', onStop, { once: true })
      recorder.addEventListener('error', onError, { once: true })
      recorder.stop()
    })

    mediaRecorderRef.current = null
    setIsRecording(false)

    if (blob) {
      await uploadRecordingBlob(blob)
    }
  }, [uploadRecordingBlob])

  const leaveCall = useCallback(async () => {
    if (isRecording) {
      await stopRecordingAndUpload()
    }
    sendSignal({ type: 'leave' })
    closeAll()
    stopLocalMedia()
    navigate('/my-bookings')
  }, [closeAll, isRecording, navigate, sendSignal, stopLocalMedia, stopRecordingAndUpload])

  const sendChatMessage = useCallback(() => {
    const content = chatInput.trim()
    if (!content) return
    sendSignal({ type: 'chat', message: content })
    setChatInput('')
  }, [chatInput, sendSignal])

  const toggleAudio = useCallback(() => {
    if (!localStream) return
    const enabled = !isMicOn
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = enabled
    })
    setIsMicOn(enabled)
  }, [isMicOn, localStream])

  const toggleVideo = useCallback(() => {
    if (!localStream) return
    const enabled = !isVideoOn
    localStream.getVideoTracks().forEach((track) => {
      track.enabled = enabled
    })
    setIsVideoOn(enabled)
  }, [isVideoOn, localStream])

  const resolveRoomContext = useCallback(async () => {
    if (!id) throw new Error('Missing video room ID')

    const isNumeric = /^\d+$/.test(id)

    if (isNumeric) {
      const response = await apiClient.get(`/video/room/${id}/`)
      const data = response.data
      if (!data?.room_name) {
        throw new Error('Unable to resolve room from booking')
      }

      return {
        resolvedRoomId: String(data.room_name),
        resolvedBookingId: String(id),
      }
    }

    const response = await apiClient.get(`/video/rooms/${id}/`)
    const data = response.data
    return {
      resolvedRoomId: String(data.room_id || id),
      resolvedBookingId: String(data.booking_id),
    }
  }, [id])

  const validateRoomAccess = useCallback(async (resolvedRoomId: string) => {
    await apiClient.get(`/video/${encodeURIComponent(resolvedRoomId)}/validate/`)
  }, [])

  useEffect(() => {
    let isMounted = true
    let activeSocket: WebSocket | null = null

    const init = async () => {
      setLoading(true)
      setError(null)

      if (!token) {
        setError('Authentication required for video call')
        setLoading(false)
        return
      }

      try {
        const { resolvedRoomId, resolvedBookingId } = await resolveRoomContext()
        await validateRoomAccess(resolvedRoomId)

        const media = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })

        if (!isMounted) {
          media.getTracks().forEach((t) => t.stop())
          return
        }

        localStreamRef.current = media
        setLocalStream(media)
        setRoomId(resolvedRoomId)
        setBookingId(resolvedBookingId)

        const wsUrl = `${wsBaseUrl}/ws/video/${encodeURIComponent(resolvedRoomId)}/?token=${encodeURIComponent(token)}`
        activeSocket = new WebSocket(wsUrl)
        wsRef.current = activeSocket

        activeSocket.onopen = () => {
          setIsConnected(true)
          setError(null)
        }

        activeSocket.onmessage = async (event) => {
          try {
            const data: SignalPayload = JSON.parse(event.data)
            await handleSignalMessage(data)
          } catch (e) {
            console.error('Failed to handle signaling message', e)
          }
        }

        activeSocket.onerror = () => {
          setError('WebSocket signaling connection failed')
          setIsConnected(false)
        }

        activeSocket.onclose = () => {
          if (wsRef.current === activeSocket) {
            wsRef.current = null
          }
          setIsConnected(false)
        }
      } catch (err: unknown) {
        console.error(err)
        setError(getErrorMessage(err, 'Unable to start WebRTC call'))
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    init()

    return () => {
      isMounted = false
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      activeSocket?.close()
      closeAll()
      stopLocalMedia()
    }
  }, [closeAll, handleSignalMessage, resolveRoomContext, stopLocalMedia, token, validateRoomAccess, wsBaseUrl])

  if (loading) {
    return <div className="p-10 flex items-center justify-center h-screen text-orange-600 font-bold gap-2"><Loader2 className="animate-spin" /> Connecting to Sacred Space...</div>
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-orange-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg flex flex-col items-center gap-4 border border-orange-200 dark:border-gray-700">
          <span className="text-6xl">🙏</span>
          <h2 className="text-2xl font-bold text-orange-700">Video Service Unavailable</h2>
          <p className="text-gray-700 dark:text-gray-300 text-center max-w-md">{error}</p>
          <div className="flex gap-3 mt-2">
            <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
            <Button variant="destructive" onClick={() => navigate('/my-bookings')}>Return to My Bookings</Button>
            <a href="/contact" className="text-primary underline text-sm flex items-center">Contact Support</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="min-h-screen flex flex-col lg:flex-row bg-background overflow-y-auto lg:overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Video Area */}
      <div className="w-full lg:w-[70%] aspect-video lg:h-full p-4 bg-black">
        <Card className="h-full bg-slate-900 overflow-hidden relative border-none">
          <div className="relative w-full h-full bg-slate-900 flex items-center justify-center">
            {Object.keys(remoteStreams).length > 0 ? (
              <div className="w-full h-full grid grid-cols-1 gap-2 p-2">
                {Object.entries(remoteStreams).map(([remoteUserId, stream]) => (
                  <VideoTile
                    key={remoteUserId}
                    stream={stream}
                    label={`Participant ${remoteUserId}`}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-400">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-orange-500" />
                <p>Waiting for another participant to join...</p>
              </div>
            )}

            {localStream && (
              <VideoTile
                stream={localStream}
                isLocal
                label="You"
                className="h-32 w-48 absolute bottom-4 right-4 z-10 border-2 border-orange-500 shadow-lg"
              />
            )}

            <div className="absolute top-4 left-4 bg-black/40 text-white text-xs px-3 py-2 rounded-lg border border-white/20">
              {isConnected ? 'Signaling Connected' : 'Connecting signaling...'}
              {roomId ? ` • Room ${roomId}` : ''}
            </div>

            {(isUploadingRecording || recordingError) && (
              <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-3 py-2 rounded-lg border border-white/20">
                {isUploadingRecording ? 'Uploading recording...' : recordingError}
              </div>
            )}

            {/* Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 bg-black/20 backdrop-blur-md p-2 rounded-full border border-white/10">
              <Button
                variant={isMicOn ? "secondary" : "destructive"}
                size="icon"
                className="rounded-full"
                onClick={toggleAudio}
              >
                {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
              <Button
                variant={isVideoOn ? "secondary" : "destructive"}
                size="icon"
                className="rounded-full"
                onClick={toggleVideo}
              >
                {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </Button>
              <Button
                variant="destructive"
                size="icon"
                className="rounded-full"
                onClick={() => {
                  void leaveCall()
                }}
              >
                <PhoneOff className="h-4 w-4" />
              </Button>
              <Button
                variant={isRecording ? "destructive" : "secondary"}
                className="rounded-full px-4"
                onClick={() => {
                  if (isRecording) {
                    void stopRecordingAndUpload()
                  } else {
                    startRecording()
                  }
                }}
                disabled={!localStream || isUploadingRecording}
              >
                {isRecording ? 'Stop Rec' : 'Record'}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Info + Chat Area */}
      <div className="w-full lg:w-[30%] h-[500px] lg:h-full p-4 flex flex-col gap-4 border-l">
        <Card className="flex-1 p-4 relative flex flex-col border-none shadow-none">
          <h2 className="text-xl font-bold text-[#3E2723] mb-2">Live Puja Portal</h2>
          <div className="flex-1 rounded-lg bg-orange-50/30 dark:bg-gray-800/30 border border-orange-100 dark:border-gray-700 p-4 relative">
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-900 p-3 rounded-lg shadow-sm border-l-4 border-orange-500">
                <p className="text-xs font-bold text-orange-800 uppercase">Current Room</p>
                <p className="text-sm font-medium">{roomId || 'Preparing...'}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-3 rounded-lg shadow-sm border-l-4 border-emerald-500">
                <p className="text-xs font-bold text-emerald-800 uppercase">Booking</p>
                <p className="text-sm font-medium">{bookingId || 'Pending lookup...'}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-3 rounded-lg shadow-sm border-l-4 border-blue-500">
                <p className="text-xs font-bold text-blue-800 uppercase">Location Info</p>
                <p className="text-sm font-medium">Remote (Nepal Time: UTC+5:45)</p>
              </div>
            </div>

            <div className="absolute inset-0 top-[120px] flex flex-col">
              <div className="flex-1 overflow-y-auto bg-white/70 dark:bg-gray-900/70 rounded-lg border dark:border-gray-700 p-3 space-y-2">
                {chatMessages.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-6">No in-room messages yet</p>
                ) : (
                  chatMessages.map((msg) => {
                    const mine = msg.userId === user?.id
                    return (
                      <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs ${mine ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-800 border'}`}>
                          <div className="font-semibold text-[10px] opacity-80 mb-1">
                            {mine ? 'You' : (msg.username || 'Participant')}
                          </div>
                          <div className="whitespace-pre-wrap">{msg.message}</div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="mt-2 flex items-center gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') sendChatMessage()
                  }}
                  placeholder="Send a message in-room..."
                  className="flex-1 h-9 px-3 rounded-md border dark:border-gray-700 bg-white dark:bg-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <Button size="icon" onClick={sendChatMessage} disabled={!chatInput.trim() || !isConnected}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => window.print()} className="border-[#3E2723]">
            Notes
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              void leaveCall()
            }}
          >
            Leave Room
          </Button>
        </div>
      </div>
    </motion.div>
  )
}