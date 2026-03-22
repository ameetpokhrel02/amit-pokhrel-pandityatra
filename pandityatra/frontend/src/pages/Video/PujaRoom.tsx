import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import apiClient from "@/lib/api-client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { WS_BASE_URL } from "@/lib/helper"
import { useAuth } from "@/hooks/useAuth"
import VideoTile from "./VideoTile"
import { Loader2, Mic, MicOff, Video, VideoOff, PhoneOff, Send, FileText, Maximize2, Minimize2 } from "lucide-react"

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

type ConnectionQuality = 'good' | 'fair' | 'poor' | 'unknown'

type MediaDeviceOption = {
  deviceId: string
  kind: MediaDeviceKind
  label: string
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

function isPaymentValidationError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false
  const maybeResponse = err as { response?: { data?: { error?: string; reason?: string } } }
  const reason = (maybeResponse.response?.data?.reason || maybeResponse.response?.data?.error || '').toLowerCase()
  return reason.includes('payment') && reason.includes('not completed')
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
  const [participantNames, setParticipantNames] = useState<Record<string, string>>({})
  const [callStartedAt, setCallStartedAt] = useState<number | null>(null)
  const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null)
  const [nowTs, setNowTs] = useState<number>(Date.now())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [reconnectCountdown, setReconnectCountdown] = useState<number>(0)
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>('unknown')
  const [devices, setDevices] = useState<MediaDeviceOption[]>([])
  const [selectedVideoInput, setSelectedVideoInput] = useState<string>('')
  const [selectedAudioInput, setSelectedAudioInput] = useState<string>('')
  const [wakeLockActive, setWakeLockActive] = useState(false)
  const [needsMediaPermission, setNeedsMediaPermission] = useState(false)
  const [resolvedContext, setResolvedContext] = useState<{ roomId: string; bookingId: string | null } | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const peersRef = useRef<Map<number, RTCPeerConnection>>(new Map())
  const myUserIdRef = useRef<number | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const chatBottomRef = useRef<HTMLDivElement | null>(null)
  const videoStageRef = useRef<HTMLDivElement | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<number | null>(null)
  const reconnectCountdownIntervalRef = useRef<number | null>(null)
  const shouldReconnectRef = useRef(true)
  const heartbeatIntervalRef = useRef<number | null>(null)
  const heartbeatTimeoutRef = useRef<number | null>(null)
  const statsIntervalRef = useRef<number | null>(null)
  const wakeLockRef = useRef<any>(null)
  const roomIdRef = useRef<string | null>(null)
  const tokenRef = useRef<string | null>(token || null)

  const wsBaseUrlRaw = WS_BASE_URL;
  const wsBaseUrl = wsBaseUrlRaw.replace(/\/+$/, '')
  const remoteCount = Object.keys(remoteStreams).length
  const totalParticipants = remoteCount + (localStream ? 1 : 0)
  const callDurationLabel = useMemo(() => {
    if (!callStartedAt) return '00:00'
    const diff = Math.max(0, Math.floor((nowTs - callStartedAt) / 1000))
    const mins = String(Math.floor(diff / 60)).padStart(2, '0')
    const secs = String(diff % 60).padStart(2, '0')
    return `${mins}:${secs}`
  }, [callStartedAt, nowTs])

  const recordingDurationLabel = useMemo(() => {
    if (!recordingStartedAt) return '00:00'
    const diff = Math.max(0, Math.floor((nowTs - recordingStartedAt) / 1000))
    const mins = String(Math.floor(diff / 60)).padStart(2, '0')
    const secs = String(diff % 60).padStart(2, '0')
    return `${mins}:${secs}`
  }, [nowTs, recordingStartedAt])

  useEffect(() => {
    if (!((isConnected && callStartedAt) || isRecording)) return
    const interval = window.setInterval(() => {
      setNowTs(Date.now())
    }, 1000)

    return () => window.clearInterval(interval)
  }, [callStartedAt, isConnected, isRecording])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const parseFallbackIceServers = useCallback(() => {
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

  const [iceServers, setIceServers] = useState<RTCIceServer[]>(() => parseFallbackIceServers())

  // We remove the old token overriding effect as we explicitly set it on connection
  // useEffect(() => {
  //   tokenRef.current = token || null
  // }, [token])

  const fetchIceServers = useCallback(async () => {
    try {
      const response = await apiClient.get('/video/ice-servers/')
      const servers = response.data?.ice_servers
      if (Array.isArray(servers) && servers.length > 0) {
        setIceServers(servers)
        return
      }
    } catch {
      // fallback to env/local STUN config
    }
    setIceServers(parseFallbackIceServers())
  }, [parseFallbackIceServers])

  const clearHeartbeatTimers = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      window.clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }
    if (heartbeatTimeoutRef.current) {
      window.clearTimeout(heartbeatTimeoutRef.current)
      heartbeatTimeoutRef.current = null
    }
  }, [])

  const clearStatsTimer = useCallback(() => {
    if (statsIntervalRef.current) {
      window.clearInterval(statsIntervalRef.current)
      statsIntervalRef.current = null
    }
  }, [])

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release()
      } catch {
        // ignore
      }
      wakeLockRef.current = null
      setWakeLockActive(false)
    }
  }, [])

  const requestWakeLock = useCallback(async () => {
    const navAny = navigator as any
    if (!navAny?.wakeLock || document.visibilityState !== 'visible') return

    try {
      const sentinel = await navAny.wakeLock.request('screen')
      wakeLockRef.current = sentinel
      setWakeLockActive(true)
      sentinel.addEventListener('release', () => {
        setWakeLockActive(false)
      })
    } catch {
      setWakeLockActive(false)
    }
  }, [])

  const enumerateDevices = useCallback(async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices()
      const formatted: MediaDeviceOption[] = list
        .filter((d) => d.kind === 'audioinput' || d.kind === 'videoinput')
        .map((d) => ({
          deviceId: d.deviceId,
          kind: d.kind,
          label: d.label || `${d.kind} (${d.deviceId.slice(0, 6)})`,
        }))

      setDevices(formatted)

      const firstVideo = formatted.find((d) => d.kind === 'videoinput')
      const firstAudio = formatted.find((d) => d.kind === 'audioinput')

      if (!selectedVideoInput && firstVideo) setSelectedVideoInput(firstVideo.deviceId)
      if (!selectedAudioInput && firstAudio) setSelectedAudioInput(firstAudio.deviceId)
    } catch {
      // ignore device listing errors
    }
  }, [selectedAudioInput, selectedVideoInput])

  useEffect(() => {
    const mediaDevices = navigator.mediaDevices
    if (!mediaDevices?.addEventListener) return

    const onDeviceChange = () => {
      void enumerateDevices()
    }

    mediaDevices.addEventListener('devicechange', onDeviceChange)
    return () => mediaDevices.removeEventListener('devicechange', onDeviceChange)
  }, [enumerateDevices])

  const adaptOutgoingQuality = useCallback((quality: ConnectionQuality) => {
    const maxBitrate = quality === 'poor' ? 300_000 : quality === 'fair' ? 700_000 : 1_500_000

    peersRef.current.forEach((pc) => {
      pc.getSenders().forEach(async (sender) => {
        if (!sender.track || sender.track.kind !== 'video') return
        const params = sender.getParameters()
        params.encodings = params.encodings && params.encodings.length > 0 ? params.encodings : [{}]
        params.encodings[0].maxBitrate = maxBitrate
        try {
          await sender.setParameters(params)
        } catch {
          // browser might reject unsupported params
        }
      })
    })
  }, [])

  const startConnectionMonitoring = useCallback(() => {
    clearStatsTimer()
    statsIntervalRef.current = window.setInterval(async () => {
      const firstPeer = peersRef.current.values().next().value as RTCPeerConnection | undefined
      if (!firstPeer) {
        setConnectionQuality('unknown')
        return
      }

      try {
        const stats = await firstPeer.getStats()
        let rttMs = 0
        let packetsLost = 0
        let packetsReceived = 0

        stats.forEach((report) => {
          if (report.type === 'candidate-pair' && (report as any).state === 'succeeded' && (report as any).currentRoundTripTime) {
            rttMs = ((report as any).currentRoundTripTime as number) * 1000
          }

          if (report.type === 'inbound-rtp' && (report as any).kind === 'video') {
            packetsLost += ((report as any).packetsLost as number) || 0
            packetsReceived += ((report as any).packetsReceived as number) || 0
          }
        })

        const totalPackets = packetsLost + packetsReceived
        const lossPct = totalPackets > 0 ? (packetsLost / totalPackets) * 100 : 0

        let quality: ConnectionQuality = 'good'
        if (rttMs > 350 || lossPct > 8) quality = 'poor'
        else if (rttMs > 180 || lossPct > 3) quality = 'fair'

        setConnectionQuality(quality)
        adaptOutgoingQuality(quality)
      } catch {
        setConnectionQuality('unknown')
      }
    }, 5000)
  }, [adaptOutgoingQuality, clearStatsTimer])

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

  const replaceTrackAcrossPeers = useCallback(async (kind: 'audio' | 'video', nextTrack: MediaStreamTrack) => {
    for (const pc of peersRef.current.values()) {
      const sender = pc.getSenders().find((s) => s.track?.kind === kind)
      if (sender) {
        try {
          await sender.replaceTrack(nextTrack)
        } catch {
          // ignore individual sender replacement failures
        }
      }
    }
  }, [])

  const switchVideoInput = useCallback(async (deviceId: string) => {
    if (!deviceId) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: false,
      })
      const nextVideoTrack = stream.getVideoTracks()[0]
      if (!nextVideoTrack) return

      const current = localStreamRef.current
      if (!current) return

      current.getVideoTracks().forEach((t) => {
        t.stop()
        current.removeTrack(t)
      })
      current.addTrack(nextVideoTrack)

      await replaceTrackAcrossPeers('video', nextVideoTrack)

      localStreamRef.current = current
      setLocalStream(new MediaStream(current.getTracks()))
      setSelectedVideoInput(deviceId)
      setIsVideoOn(nextVideoTrack.enabled)
    } catch {
      setError('Failed to switch camera')
    }
  }, [replaceTrackAcrossPeers])

  const switchAudioInput = useCallback(async (deviceId: string) => {
    if (!deviceId) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: { deviceId: { exact: deviceId } },
      })
      const nextAudioTrack = stream.getAudioTracks()[0]
      if (!nextAudioTrack) return

      const current = localStreamRef.current
      if (!current) return

      current.getAudioTracks().forEach((t) => {
        t.stop()
        current.removeTrack(t)
      })
      current.addTrack(nextAudioTrack)

      await replaceTrackAcrossPeers('audio', nextAudioTrack)

      localStreamRef.current = current
      setLocalStream(new MediaStream(current.getTracks()))
      setSelectedAudioInput(deviceId)
      setIsMicOn(nextAudioTrack.enabled)
    } catch {
      setError('Failed to switch microphone')
    }
  }, [replaceTrackAcrossPeers])

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
      if (data.user_id && data.username) {
        setParticipantNames((prev) => ({ ...prev, [String(data.user_id)]: data.username || `Participant ${data.user_id}` }))
      }
      sendSignal({ type: 'join' })
      return
    }

    if (data.type === 'heartbeat-ack') {
      if (heartbeatTimeoutRef.current) {
        window.clearTimeout(heartbeatTimeoutRef.current)
        heartbeatTimeoutRef.current = null
      }
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

    if (data.username) {
      setParticipantNames((prev) => ({ ...prev, [String(remoteUserId)]: data.username || `Participant ${remoteUserId}` }))
    }

    if (data.type === 'participant-left') {
      cleanupPeer(remoteUserId)
      setParticipantNames((prev) => {
        const next = { ...prev }
        delete next[String(remoteUserId)]
        return next
      })
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

    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (reconnectCountdownIntervalRef.current) {
      window.clearInterval(reconnectCountdownIntervalRef.current)
      reconnectCountdownIntervalRef.current = null
    }

    clearHeartbeatTimers()
    clearStatsTimer()

    peersRef.current.forEach((pc) => pc.close())
    peersRef.current.clear()

    setRemoteStreams({})
    setParticipantNames({})
    setIsConnected(false)
    setIsReconnecting(false)
    setReconnectCountdown(0)
    setConnectionQuality('unknown')
    setCallStartedAt(null)
    setRecordingStartedAt(null)
    void releaseWakeLock()
  }, [clearHeartbeatTimers, clearStatsTimer, releaseWakeLock])

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
      const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      const chunkSize = 1024 * 1024 // 1 MB
      const totalChunks = Math.ceil(blob.size / chunkSize)

      for (let i = 0; i < totalChunks; i += 1) {
        const start = i * chunkSize
        const end = Math.min(start + chunkSize, blob.size)
        const chunkBlob = blob.slice(start, end, blob.type || 'video/webm')
        const chunkFile = new File([chunkBlob], `chunk-${i}.${ext}`, { type: chunkBlob.type || blob.type || 'video/webm' })

        const fd = new FormData()
        fd.append('upload_id', uploadId)
        fd.append('chunk_index', String(i))
        fd.append('total_chunks', String(totalChunks))
        fd.append('chunk', chunkFile)

        await apiClient.post(`/video/rooms/${encodeURIComponent(roomId)}/upload-recording-chunk/`, fd)
      }

      await apiClient.post(`/video/rooms/${encodeURIComponent(roomId)}/finalize-recording/`, {
        upload_id: uploadId,
        total_chunks: totalChunks,
        extension: ext,
      })
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
      setRecordingStartedAt(Date.now())
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
    setRecordingStartedAt(null)

    if (blob) {
      await uploadRecordingBlob(blob)
    }
  }, [uploadRecordingBlob])

  const leaveCall = useCallback(async () => {
    shouldReconnectRef.current = false
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
    const activeStream = localStreamRef.current || localStream
    if (!activeStream) return
    const enabled = !isMicOn
    activeStream.getAudioTracks().forEach((track) => {
      track.enabled = enabled
    })
    setIsMicOn(enabled)
  }, [isMicOn, localStream])

  const toggleVideo = useCallback(() => {
    const activeStream = localStreamRef.current || localStream
    if (!activeStream) return
    const enabled = !isVideoOn
    activeStream.getVideoTracks().forEach((track) => {
      track.enabled = enabled
    })
    setIsVideoOn(enabled)
  }, [isVideoOn, localStream])

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else if (videoStageRef.current?.requestFullscreen) {
        await videoStageRef.current.requestFullscreen()
      }
    } catch (err) {
      console.error('Fullscreen toggle failed', err)
    }
  }, [])

  const isPermissionDeniedError = useCallback((err: unknown): boolean => {
    if (!err || typeof err !== 'object') return false

    const maybeName = (err as { name?: string }).name
    if (maybeName === 'NotAllowedError' || maybeName === 'PermissionDeniedError') {
      return true
    }

    const message = ((err as { message?: string }).message || '').toLowerCase()
    return message.includes('permission denied') || message.includes('notallowederror')
  }, [])

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

  const validateRoomAccess = useCallback(async (resolvedRoomId: string, resolvedBookingId?: string | null) => {
    try {
      await apiClient.get(`/video/${encodeURIComponent(resolvedRoomId)}/validate/`)
      return
    } catch (err: unknown) {
      // Fallback for stale booking.payment_status values on some environments:
      // if payment API confirms completion for the booking owner, allow proceeding.
      if (!resolvedBookingId || !/^\d+$/.test(resolvedBookingId) || !isPaymentValidationError(err)) {
        throw err
      }

      try {
        const statusResponse = await apiClient.get(`/payments/check-status/${resolvedBookingId}/`)
        const paymentState = String(statusResponse.data?.payment_status || '').toUpperCase()
        const bookingPaid = Boolean(statusResponse.data?.booking_paid)
        const isCompleted = paymentState === 'COMPLETED' || bookingPaid

        if (!isCompleted) {
          throw err
        }
      } catch {
        throw err
      }
    }
  }, [])

  const scheduleReconnect = useCallback(() => {
    if (!shouldReconnectRef.current || !roomIdRef.current || !tokenRef.current) return
    if (reconnectTimeoutRef.current) return

    const attempt = reconnectAttemptsRef.current + 1
    reconnectAttemptsRef.current = attempt
    const capped = Math.min(30, Math.pow(2, Math.min(attempt, 5)))

    setIsReconnecting(true)
    setReconnectCountdown(capped)

    if (reconnectCountdownIntervalRef.current) {
      window.clearInterval(reconnectCountdownIntervalRef.current)
      reconnectCountdownIntervalRef.current = null
    }

    reconnectCountdownIntervalRef.current = window.setInterval(() => {
      setReconnectCountdown((prev) => {
        if (prev <= 1) {
          if (reconnectCountdownIntervalRef.current) {
            window.clearInterval(reconnectCountdownIntervalRef.current)
            reconnectCountdownIntervalRef.current = null
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    reconnectTimeoutRef.current = window.setTimeout(() => {
      reconnectTimeoutRef.current = null
      setIsReconnecting(false)
      const rid = roomIdRef.current
      const tkn = tokenRef.current
      if (!rid || !tkn) return
      const wsUrl = `${wsBaseUrl}/ws/video/${encodeURIComponent(rid)}/?token=${encodeURIComponent(tkn)}`
      const socket = new WebSocket(wsUrl)
      wsRef.current = socket

      socket.onopen = () => {
        reconnectAttemptsRef.current = 0
        setIsConnected(true)
        setError(null)
        setIsReconnecting(false)
        setReconnectCountdown(0)
        if (reconnectCountdownIntervalRef.current) {
          window.clearInterval(reconnectCountdownIntervalRef.current)
          reconnectCountdownIntervalRef.current = null
        }
        startConnectionMonitoring()
        void requestWakeLock()

        clearHeartbeatTimers()
        heartbeatIntervalRef.current = window.setInterval(() => {
          if (wsRef.current?.readyState !== WebSocket.OPEN) return
          wsRef.current.send(JSON.stringify({ type: 'heartbeat' }))
          if (heartbeatTimeoutRef.current) window.clearTimeout(heartbeatTimeoutRef.current)
          heartbeatTimeoutRef.current = window.setTimeout(() => {
            wsRef.current?.close()
          }, 12000)
        }, 15000)
      }

      socket.onmessage = async (event) => {
        try {
          const data: SignalPayload = JSON.parse(event.data)
          await handleSignalMessage(data)
        } catch (e) {
          console.error('Failed to handle signaling message', e)
        }
      }

      socket.onerror = () => {
        setError('WebSocket signaling connection failed')
        setIsConnected(false)
      }

      socket.onclose = () => {
        if (wsRef.current === socket) wsRef.current = null
        setIsConnected(false)
        clearHeartbeatTimers()
        clearStatsTimer()
        scheduleReconnect()
      }
    }, capped * 1000)
  }, [clearHeartbeatTimers, clearStatsTimer, handleSignalMessage, requestWakeLock, startConnectionMonitoring, wsBaseUrl])

  const connectSignaling = useCallback((resolvedRoomId: string, currentToken: string) => {
    const activeToken = localStorage.getItem('token') || currentToken
    const wsUrl = `${wsBaseUrl}/ws/video/${encodeURIComponent(resolvedRoomId)}/?token=${encodeURIComponent(activeToken)}`
    console.info('[PujaRoom] Connecting websocket', {
      wsUrl,
      roomId: resolvedRoomId,
      hasToken: Boolean(activeToken),
      tokenLength: activeToken?.length || 0,
    })
    const socket = new WebSocket(wsUrl)
    wsRef.current = socket

    socket.onopen = () => {
      reconnectAttemptsRef.current = 0
      setIsConnected(true)
      setError(null)
      setIsReconnecting(false)
      setReconnectCountdown(0)
      if (reconnectCountdownIntervalRef.current) {
        window.clearInterval(reconnectCountdownIntervalRef.current)
        reconnectCountdownIntervalRef.current = null
      }
      setCallStartedAt((prev) => prev || Date.now())
      startConnectionMonitoring()
      void requestWakeLock()

      clearHeartbeatTimers()
      heartbeatIntervalRef.current = window.setInterval(() => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) return
        wsRef.current.send(JSON.stringify({ type: 'heartbeat' }))
        if (heartbeatTimeoutRef.current) window.clearTimeout(heartbeatTimeoutRef.current)
        heartbeatTimeoutRef.current = window.setTimeout(() => {
          wsRef.current?.close()
        }, 12000)
      }, 15000)
    }

    socket.onmessage = async (event) => {
      try {
        const data: SignalPayload = JSON.parse(event.data)
        await handleSignalMessage(data)
      } catch (e) {
        console.error('Failed to handle signaling message', e)
      }
    }

    socket.onerror = () => {
      console.error('[PujaRoom] WebSocket error', { wsUrl, roomId: resolvedRoomId })
      setError('WebSocket signaling connection failed')
      setIsConnected(false)
    }

    socket.onclose = () => {
      console.warn('[PujaRoom] WebSocket closed', {
        wsUrl,
        roomId: resolvedRoomId,
        shouldReconnect: shouldReconnectRef.current,
      })
      if (wsRef.current === socket) {
        wsRef.current = null
      }
      setIsConnected(false)
      clearHeartbeatTimers()
      clearStatsTimer()
      if (shouldReconnectRef.current) {
        scheduleReconnect()
      }
    }
  }, [clearHeartbeatTimers, clearStatsTimer, handleSignalMessage, requestWakeLock, scheduleReconnect, startConnectionMonitoring, wsBaseUrl])

  const startMediaAndConnect = useCallback(
    async (resolvedRoomId: string, resolvedBookingId: string | null, currentToken: string) => {
      const media = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      localStreamRef.current = media
      setLocalStream(media)
      const activeToken = localStorage.getItem('token') || currentToken
      setRoomId(resolvedRoomId)
      setBookingId(resolvedBookingId)
      roomIdRef.current = resolvedRoomId
      tokenRef.current = activeToken
      setNeedsMediaPermission(false)

      await enumerateDevices()
      void requestWakeLock()
      connectSignaling(resolvedRoomId, currentToken)
    },
    [connectSignaling, enumerateDevices, requestWakeLock]
  )

  const retryMediaPermission = useCallback(async () => {
    if (!token || !resolvedContext) return

    setLoading(true)
    setError(null)
    try {
      await startMediaAndConnect(resolvedContext.roomId, resolvedContext.bookingId, token)
    } catch (err: unknown) {
      if (isPermissionDeniedError(err)) {
        setNeedsMediaPermission(true)
        setError('Camera/Microphone permission is required to join the call. Please allow access and try again.')
      } else {
        setError(getErrorMessage(err, 'Unable to start media devices'))
      }
    } finally {
      setLoading(false)
    }
  }, [isPermissionDeniedError, resolvedContext, startMediaAndConnect, token])

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      setLoading(true)
      setError(null)
      shouldReconnectRef.current = true

      if (!token) {
        setError('Authentication required for video call')
        setLoading(false)
        return
      }

      try {
        await fetchIceServers()
        const { resolvedRoomId, resolvedBookingId } = await resolveRoomContext()
        console.info('[PujaRoom] Resolved room context', {
          routeParamId: id,
          resolvedRoomId,
          resolvedBookingId,
          hasToken: Boolean(token),
        })
        await validateRoomAccess(resolvedRoomId, resolvedBookingId)
        setResolvedContext({ roomId: resolvedRoomId, bookingId: resolvedBookingId })

        await startMediaAndConnect(resolvedRoomId, resolvedBookingId, token)
      } catch (err: unknown) {
        console.error(err)
        if (isPermissionDeniedError(err)) {
          setNeedsMediaPermission(true)
          setError('Camera/Microphone permission is required to join the call. Click "Enable Camera & Mic" and allow access.')
        } else {
          setError(getErrorMessage(err, 'Unable to start WebRTC call'))
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    init()

    return () => {
      isMounted = false
      shouldReconnectRef.current = false
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      closeAll()
      stopLocalMedia()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token])

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void requestWakeLock()
        const hasSocket = wsRef.current && wsRef.current.readyState === WebSocket.OPEN
        if (!hasSocket && shouldReconnectRef.current && roomIdRef.current && tokenRef.current) {
          scheduleReconnect()
        }
      } else {
        void releaseWakeLock()
      }
    }

    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [releaseWakeLock, requestWakeLock, scheduleReconnect])

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
            {needsMediaPermission && (
              <Button onClick={() => void retryMediaPermission()}>Enable Camera & Mic</Button>
            )}
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
      <div ref={videoStageRef} className="w-full lg:w-[68%] aspect-video lg:h-full p-3 sm:p-4 bg-black">
        <Card className="h-full bg-slate-900 overflow-hidden relative border-none">
          <div className="relative w-full h-full bg-slate-900 flex items-center justify-center">
            {remoteCount > 0 ? (
              <div className={`w-full h-full grid gap-2 p-2 ${remoteCount > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                {Object.entries(remoteStreams).map(([remoteUserId, stream]) => (
                  <VideoTile
                    key={remoteUserId}
                    stream={stream}
                    label={participantNames[remoteUserId] || `Participant ${remoteUserId}`}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-400">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-orange-500" />
                <p className="text-sm sm:text-base">Waiting for another participant to join...</p>
              </div>
            )}

            {localStream && (
              <VideoTile
                stream={localStream}
                isLocal
                label="You"
                className="h-24 w-36 sm:h-28 sm:w-44 md:h-32 md:w-48 absolute bottom-4 right-4 z-10 border-2 border-orange-500 shadow-lg"
              />
            )}

            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-black/50 text-white text-[11px] sm:text-xs px-3 py-2 rounded-lg border border-white/20 flex items-center gap-2">
              <span className={`inline-block h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
              <span className="opacity-70">•</span>
              <span>{callDurationLabel}</span>
              <span className="opacity-70">•</span>
              <span>{totalParticipants} in call</span>
              <span className="opacity-70">•</span>
              <span>
                Quality:{' '}
                {connectionQuality === 'good' && <span className="text-emerald-300">Good</span>}
                {connectionQuality === 'fair' && <span className="text-amber-300">Fair</span>}
                {connectionQuality === 'poor' && <span className="text-red-300">Poor</span>}
                {connectionQuality === 'unknown' && <span className="text-slate-300">Unknown</span>}
              </span>
            </div>

            {(isUploadingRecording || recordingError) && (
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-black/60 text-white text-[11px] sm:text-xs px-3 py-2 rounded-lg border border-white/20 max-w-[80%] text-right">
                {isUploadingRecording ? 'Uploading recording...' : recordingError}
              </div>
            )}

            {isReconnecting && (
              <div className="absolute top-14 right-3 sm:right-4 bg-amber-500/90 text-black text-[11px] sm:text-xs px-3 py-1.5 rounded-full border border-amber-200/60 shadow-md">
                Reconnecting in {reconnectCountdown}s...
              </div>
            )}

            {isRecording && (
              <div className="absolute top-14 left-3 sm:left-4 bg-red-600/90 text-white text-[11px] sm:text-xs px-3 py-1.5 rounded-full border border-red-300/40 shadow-md flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-white animate-pulse" />
                <span className="font-semibold">REC {recordingDurationLabel}</span>
              </div>
            )}

            {/* Controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-3 bg-black/35 backdrop-blur-md p-2 rounded-full border border-white/10 shadow-lg">
              <Button
                variant={isMicOn ? "secondary" : "destructive"}
                size="icon"
                className="rounded-full"
                onClick={toggleAudio}
                title={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
              >
                {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
              <Button
                variant={isVideoOn ? "secondary" : "destructive"}
                size="icon"
                className="rounded-full"
                onClick={toggleVideo}
                title={isVideoOn ? 'Turn camera off' : 'Turn camera on'}
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
                title="Leave call"
              >
                <PhoneOff className="h-4 w-4" />
              </Button>
              <Button
                variant={isRecording ? "destructive" : "secondary"}
                className="rounded-full px-3 sm:px-4 text-xs sm:text-sm"
                onClick={() => {
                  if (isRecording) {
                    void stopRecordingAndUpload()
                  } else {
                    startRecording()
                  }
                }}
                disabled={!localStream || isUploadingRecording}
              >
                {isRecording ? `Stop ${recordingDurationLabel}` : 'Record'}
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full"
                onClick={() => {
                  void toggleFullscreen()
                }}
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Info + Chat Area */}
      <div className="w-full lg:w-[32%] h-[560px] lg:h-full p-3 sm:p-4 flex flex-col gap-3 border-l">
        <Card className="p-4 flex flex-col border-none shadow-none h-full">
          <h2 className="text-lg sm:text-xl font-bold text-[#3E2723] mb-3">Live Puja Portal</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 mb-3">
            <div className="bg-white dark:bg-gray-900 p-3 rounded-lg shadow-sm border-l-4 border-orange-500">
              <p className="text-[11px] font-bold text-orange-800 uppercase">Current Room</p>
              <p className="text-sm font-medium truncate">{roomId || 'Preparing...'}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-3 rounded-lg shadow-sm border-l-4 border-emerald-500">
              <p className="text-[11px] font-bold text-emerald-800 uppercase">Booking</p>
              <p className="text-sm font-medium truncate">{bookingId || 'Pending lookup...'}</p>
            </div>
          </div>

          <div className="mb-3 grid grid-cols-1 gap-2">
            <div className="text-[11px] text-muted-foreground px-1 flex items-center justify-between">
              <span>Connection tools</span>
              <span className={wakeLockActive ? 'text-emerald-600' : 'text-amber-600'}>
                {wakeLockActive ? 'Wake lock active' : 'Wake lock unavailable'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
              <select
                value={selectedVideoInput}
                onChange={(e) => {
                  void switchVideoInput(e.target.value)
                }}
                className="h-9 rounded-md border dark:border-gray-700 bg-white dark:bg-gray-900 px-2 text-xs"
              >
                <option value="">Select camera</option>
                {devices.filter((d) => d.kind === 'videoinput').map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
                ))}
              </select>

              <select
                value={selectedAudioInput}
                onChange={(e) => {
                  void switchAudioInput(e.target.value)
                }}
                className="h-9 rounded-md border dark:border-gray-700 bg-white dark:bg-gray-900 px-2 text-xs"
              >
                <option value="">Select microphone</option>
                {devices.filter((d) => d.kind === 'audioinput').map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs mb-2 px-1">
            <span className="text-muted-foreground">In-room chat</span>
            <span className={`font-medium ${isConnected ? 'text-emerald-600' : 'text-amber-600'}`}>
              {isConnected ? 'Live' : 'Reconnecting...'}
            </span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto bg-white/70 dark:bg-gray-900/70 rounded-lg border dark:border-gray-700 p-3 space-y-2">
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
            <div ref={chatBottomRef} />
          </div>

          <div className="mt-2 flex items-center gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') sendChatMessage()
              }}
              placeholder="Send a message in-room..."
              className="flex-1 h-9 px-3 rounded-md border dark:border-gray-700 bg-white dark:bg-gray-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <Button size="icon" onClick={sendChatMessage} disabled={!chatInput.trim() || !isConnected} title="Send message">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => window.print()} className="border-[#3E2723] hover:bg-orange-50 dark:hover:bg-gray-800 rounded-xl font-semibold">
            <FileText className="h-4 w-4 mr-2" />
            Notes
          </Button>
          <Button
            variant="destructive"
            className="rounded-xl font-semibold shadow-sm"
            onClick={() => {
              void leaveCall()
            }}
          >
            <PhoneOff className="h-4 w-4 mr-2" />
            Leave Room
          </Button>
        </div>
      </div>
    </motion.div>
  )
}