import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import apiClient from "@/lib/api-client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { WS_BASE_URL } from "@/lib/helper"
import { useAuth } from "@/hooks/useAuth"
import VideoTile from "./VideoTile"
import { Loader2, Mic, MicOff, Video, VideoOff, PhoneOff, Send, FileText, Maximize2, Minimize2, MonitorUp } from "lucide-react"

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

function getErrorInfo(err: unknown) {
  if (typeof err === 'object' && err !== null) {
    const maybeResponse = err as { response?: { data?: { error?: string; reason?: string; code?: string } } }
    const data = maybeResponse.response?.data
    return {
      message: data?.error || data?.reason || (err as any).message || 'Service encountered an issue',
      code: data?.code || null
    }
  }
  return { message: String(err), code: null }
}

function isSessionExpired(bookingDate: string, bookingTime: string): boolean {
  try {
    const pujaDateTime = new Date(`${bookingDate}T${bookingTime}`)
    const joinEnd = addMinutes(pujaDateTime, 120)
    return isAfter(new Date(), joinEnd)
  } catch {
    return false
  }
}

function isPaymentValidationError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false
  const maybeResponse = err as { response?: { data?: { error?: string; reason?: string } } }
  const reason = (maybeResponse.response?.data?.reason || maybeResponse.response?.data?.error || '').toLowerCase()
  return reason.includes('payment') && reason.includes('not completed')
}

import { addMinutes, isAfter, isBefore } from "date-fns"

export default function PujaRoom() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token, user } = useAuth()

  const [bookingId, setBookingId] = useState<string | null>(null)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)
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
  const [bookingDetails, setBookingDetails] = useState<any>(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'info'>('chat')
  const [unreadCount, setUnreadCount] = useState(0)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [requestedQuality, setRequestedQuality] = useState<ConnectionQuality>('good')
  const screenStreamRef = useRef<MediaStream | null>(null)

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
      const isHistorical = (data as any).is_historical;
      setChatMessages((prev) => {
        const next: RoomChatMessage = {
          id: data.chat_id || Date.now(),
          message: data.message || '',
          userId: data.user_id,
          username: data.username,
          sender: data.sender as any,
          timestamp: data.timestamp,
        }
        if (!next.message) return prev
        // Avoid duplicates if we already fetched history
        if (prev.some(m => m.id === next.id)) return prev
        if (!showSidebar && !isHistorical) setUnreadCount(c => c + 1)
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
        window.clearTimeout(heartbeatTimeoutRef.current as number)
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

    const remoteUserId = data.user_id!

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
      if (myUserId! < remoteUserId) {
        await createOfferFor(remoteUserId)
      }
      return
    }

    if (data.type === 'offer' && data.sdp) {
      console.log('WebRTC: Received Offer from', remoteUserId)
      const pc = createOrGetPeer(remoteUserId)
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp!))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      sendSignal({ type: 'answer', sdp: answer, target_user_id: remoteUserId })
      return
    }

    if (data.type === 'answer' && data.sdp) {
      console.log('WebRTC: Received Answer from', remoteUserId)
      const pc = createOrGetPeer(remoteUserId)
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp!))
      return
    }

    if (data.type === 'ice-candidate' && data.candidate) {
      console.log('WebRTC: Received ICE Candidate from', remoteUserId)
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
      const { message } = getErrorInfo(err)
      setRecordingError(message)
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

  const sendChatMessage = useCallback(async () => {
    const content = chatInput.trim()
    if (!content) return
    
    // 1. Send via signaling for real-time appearance in video sidebar
    sendSignal({ type: 'chat', message: content })
    setChatInput('')

    // 2. Persist to backend chat room if linked
    const roomId = bookingDetails?.chat_room_id
    if (roomId) {
      try {
        await apiClient.post(`/chat/rooms/${roomId}/messages/`, {
          content: content,
          message_type: 'TEXT'
        })
      } catch (err) {
        console.error('Failed to persist call message to inquiry chat', err)
      }
    }
  }, [chatInput, sendSignal, bookingDetails?.chat_room_id])

  const toggleAudio = useCallback(async () => {
    if (isMicOn) {
      // Turn OFF: Stop track and release hardware
      const tracks = localStreamRef.current?.getAudioTracks() || []
      tracks.forEach(t => {
        t.enabled = false
        t.stop()
      })
      setIsMicOn(false)
    } else {
      // Turn ON: Re-acquire hardware
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: selectedAudioInput ? { deviceId: { exact: selectedAudioInput } } : true,
          video: false
        })
        const newTrack = stream.getAudioTracks()[0]
        if (newTrack) {
          if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(t => {
              t.stop()
              localStreamRef.current?.removeTrack(t)
            })
            localStreamRef.current.addTrack(newTrack)
            await replaceTrackAcrossPeers('audio', newTrack)
            setLocalStream(new MediaStream(localStreamRef.current.getTracks()))
          }
          setIsMicOn(true)
        }
      } catch (err) {
        console.error("Failed to re-acquire audio hardware", err)
        setError("Unable to access microphone. Please check permissions.")
      }
    }
  }, [isMicOn, selectedAudioInput, replaceTrackAcrossPeers])

  const toggleVideo = useCallback(async () => {
    if (isVideoOn) {
      // Turn OFF: Stop track and release hardware (camera light goes off)
      const tracks = localStreamRef.current?.getVideoTracks() || []
      tracks.forEach(t => {
        t.enabled = false
        t.stop()
      })
      setIsVideoOn(false)
    } else {
      // Turn ON: Re-acquire hardware
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: selectedVideoInput ? { deviceId: { exact: selectedVideoInput } } : true,
          audio: false
        })
        const newTrack = stream.getVideoTracks()[0]
        if (newTrack) {
          if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach(t => {
              t.stop()
              localStreamRef.current?.removeTrack(t)
            })
            localStreamRef.current.addTrack(newTrack)
            await replaceTrackAcrossPeers('video', newTrack)
            setLocalStream(new MediaStream(localStreamRef.current.getTracks()))
          }
          setIsVideoOn(true)
        }
      } catch (err) {
        console.error("Failed to re-acquire camera hardware", err)
        setError("Unable to access camera. Please check permissions.")
      }
    }
  }, [isVideoOn, selectedVideoInput, replaceTrackAcrossPeers])

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
    
    // Safety check for production: If session has expired, don't allow joining
    if (data.booking_date && data.booking_time && isSessionExpired(data.booking_date, data.booking_time)) {
       throw new Error('This video session has expired. The 2-hour window for this puja has passed.')
    }

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
        } catch {
          // Silent catch
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
      } catch {
        // Silent catch
      }
    }

    socket.onerror = () => {
      setError('Connection interrupted. Please check your internet.')
      setIsConnected(false)
    }

    socket.onclose = () => {
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
    setErrorCode(null)
    try {
      await startMediaAndConnect(resolvedContext.roomId, resolvedContext.bookingId, token)
    } catch (err: unknown) {
      const { message, code } = getErrorInfo(err)
      if (isPermissionDeniedError(err)) {
        setNeedsMediaPermission(true)
        setError('Camera/Microphone permission is required to join the call. Please allow access and try again.')
      } else {
        setError(message)
        setErrorCode(code)
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
        await validateRoomAccess(resolvedRoomId, resolvedBookingId)
        setResolvedContext({ roomId: resolvedRoomId, bookingId: resolvedBookingId })

        if (resolvedBookingId) {
          try {
            const bResp = await apiClient.get(`/bookings/${resolvedBookingId}/`)
            setBookingDetails(bResp.data)
            
            // If we have a chat room, fetch history
            if (bResp.data?.chat_room_id) {
               const cResp = await apiClient.get(`/chat/rooms/${bResp.data.chat_room_id}/messages/`)
               const history: RoomChatMessage[] = (cResp.data || []).map((m: any) => ({
                 id: m.id,
                 message: m.content,
                 userId: m.sender_obj?.id,
                 username: m.sender_name,
                 sender: m.sender, // Already 'user' or 'pandit'
                 timestamp: m.timestamp
               }))
               setChatMessages(history)
            }
          } catch (err) {
            console.error('Failed to load booking/chat context', err)
          }
        }

        await startMediaAndConnect(resolvedRoomId, resolvedBookingId, token)
      } catch (err: unknown) {
        console.error(err)
        const { message, code } = getErrorInfo(err)
        if (isPermissionDeniedError(err)) {
          setNeedsMediaPermission(true)
          setError('Camera/Microphone permission is required to join the call. Click "Enable Camera & Mic" and allow access.')
        } else {
          setError(message)
          setErrorCode(code)
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


  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Stop sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      // Restore camera
      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) await replaceTrackAcrossPeers('video', videoTrack);
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      const screenTrack = stream.getVideoTracks()[0];
      if (!screenTrack) return;

      screenTrack.onended = () => {
        void toggleScreenShare();
      };

      await replaceTrackAcrossPeers('video', screenTrack);
      screenStreamRef.current = stream;
      setIsScreenSharing(true);
    } catch (err) {
      console.error("Screen sharing failed", err);
    }
  }, [isScreenSharing, replaceTrackAcrossPeers]);

  useEffect(() => {
    if (isConnected) {
      adaptOutgoingQuality(requestedQuality);
    }
  }, [isConnected, requestedQuality, adaptOutgoingQuality]);

  if (loading) {
    return <div className="p-10 flex items-center justify-center h-screen text-orange-600 font-bold gap-2"><Loader2 className="animate-spin" /> Connecting to Sacred Space...</div>
  }

  if (error) {
    const isExpired = errorCode === 'expired'
    const isCancelled = errorCode === 'cancelled'
    const isMissed = isExpired || (error.toLowerCase().includes('expire') || error.toLowerCase().includes('passed'))

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FFF9F5] dark:bg-gray-900 p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl w-full bg-white dark:bg-gray-800 rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-orange-100 dark:border-gray-700"
        >
          <div className="aspect-[16/10] bg-orange-50 relative overflow-hidden flex items-center justify-center p-8">
             <img 
               src="https://res.cloudinary.com/dm0vvpzs9/image/upload/v1775122347/errro_p4ej8m.png" 
               alt="Sad Pandit" 
               className="h-full object-contain mix-blend-multiply opacity-90"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-gray-800 to-transparent h-1/3 bottom-0 mt-auto" />
          </div>

          <div className="p-8 text-center space-y-4">
            <h2 className="text-3xl font-black text-[#4A2C2A] dark:text-white tracking-tight">
               {isMissed ? 'Aww, call missed! 🙏' : 'Room Access Error'}
            </h2>
            
            <div className="bg-orange-50 dark:bg-orange-900/20 py-3 px-6 rounded-2xl inline-block">
               <p className="text-orange-800 dark:text-orange-300 font-bold text-lg">
                 {isMissed ? 'Session Expired' : isCancelled ? 'Booking Cancelled' : 'Connection Failed'}
               </p>
            </div>

            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
              {error || 'We couldn\'t load the video portal at this time. Please check your booking details or contact support.'}
            </p>

            <div className="pt-6 flex flex-col sm:flex-row gap-3">
              {needsMediaPermission ? (
                <Button 
                  onClick={() => void retryMediaPermission()}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl h-14 font-bold text-lg"
                >
                  Enable Camera & Mic
                </Button>
              ) : (
                <Button 
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl h-14 font-bold text-lg shadow-lg hover:shadow-orange-500/20"
                >
                  Try Again
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => navigate('/my-bookings')}
                className="flex-1 border-gray-200 dark:border-gray-700 rounded-2xl h-14 font-bold text-lg hover:bg-gray-50"
              >
                My Bookings
              </Button>
            </div>
            
            <div className="pt-4">
               <a href="/contact" className="text-sm font-semibold text-orange-600 hover:underline">Contact Support Team</a>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div ref={videoStageRef} className="h-screen w-full bg-[#111] overflow-hidden relative flex flex-col font-sans select-none">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-black to-slate-900 pointer-events-none opacity-40" />

      {/* Main Video Stage */}
      <main className="flex-1 relative flex items-center justify-center p-4 transition-all duration-500 ease-in-out" 
            style={{ marginRight: showSidebar ? '360px' : '0' }}>
        
        {/* Top Floating Status Overlay */}
        <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-2xl">
             <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="text-white/90 text-sm font-bold tracking-tight">{callDurationLabel}</span>
             </div>
             <div className="w-px h-4 bg-white/10" />
             <div className="flex items-center gap-2 text-white/60 text-xs font-medium">
                <span>{participantNames[id || ''] || 'Live Puja'}</span>
                {roomId && <span className="uppercase text-[10px] bg-white/5 px-1.5 py-0.5 rounded italic opacity-50">{(roomId as string).slice(0, 8)}</span>}
             </div>
          </div>
        </div>

        {/* Connection Quality / Recording Indicator */}
        <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
          {isRecording && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-red-600/20 backdrop-blur-xl border border-red-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg"
            >
               <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
               <span className="text-red-400 text-xs font-black uppercase tracking-widest">{recordingDurationLabel}</span>
            </motion.div>
          )}
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2">
             <div className={`h-1.5 w-1.5 rounded-full ${connectionQuality === 'good' ? 'bg-emerald-400' : connectionQuality === 'fair' ? 'bg-amber-400' : 'bg-red-400'}`} />
             <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
                {connectionQuality}
             </span>
          </div>
        </div>

        {/* Video Tiles Grid */}
        <div className="w-full h-full max-w-7xl max-h-[85vh] flex items-center justify-center">
          <div className={`w-full h-full grid gap-4 ${
            remoteCount === 0 ? 'grid-cols-1' : 
            remoteCount === 1 ? 'grid-cols-1 lg:grid-cols-2' : 
            remoteCount === 2 ? 'grid-cols-1 md:grid-cols-3' : 
            'grid-cols-2 lg:grid-cols-3'
          }`}>
            
            {/* Remote Participants */}
            {Object.entries(remoteStreams).map(([remoteUserId, stream]) => (
              <VideoTile
                key={remoteUserId}
                stream={stream}
                label={participantNames[remoteUserId] || `Participant ${remoteUserId}`}
                className="w-full h-full min-h-[280px] shadow-2xl transition-transform duration-500 hover:scale-[1.01]"
              />
            ))}

            {/* Waiting State if alone */}
            {remoteCount === 0 && !loading && (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-white/5 rounded-[2.5rem] border border-white/5 backdrop-blur-sm">
                <div className="relative">
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-orange-500/20 rounded-full blur-3xl"
                  />
                  <Loader2 className="h-20 w-20 animate-spin text-orange-500/20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Video className="h-8 w-8 text-orange-500 opacity-60" />
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-orange-100/10 flex items-center justify-center mb-6">
                    <Video className="w-12 h-12 text-orange-500/50" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {user?.role === 'pandit' 
                      ? `Waiting for ${bookingDetails?.user_full_name || 'Customer'}...`
                      : `Waiting for Pandit ${bookingDetails?.pandit_full_name || 'Ji'}...`
                    }
                  </h3>
                  <p className="text-white/40 text-center max-w-xs">
                    The ritual space is being prepared. Your connection will start automatically when the other participant joins.
                  </p>
                </div>
                <p className="text-sm opacity-60 mt-2 italic">The sacred space is being prepared</p>
              </div>
            )}

            {/* Local View (Floating or part of grid) */}
            {localStream && (
              <VideoTile
                stream={localStream}
                isLocal
                label="You"
                className={`
                  ${remoteCount === 0 
                    ? 'w-full h-full min-h-[280px]' 
                    : 'absolute bottom-28 right-10 w-64 h-40 z-30 shadow-[0_20px_50px_rgba(0,0,0,0.4)] border-2 border-white/20 transform hover:scale-105 transition-all'
                  }
                `}
              />
            )}
          </div>
        </div>
      </main>

      {/* Floating Bottom Control Bar */}
      <footer className="absolute bottom-8 left-0 right-0 z-50 flex items-center justify-center pointer-events-none px-6">
        <div className="bg-[#1e1e1e]/80 backdrop-blur-3xl border border-white/10 p-2.5 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex items-center gap-2 pointer-events-auto transition-all hover:bg-[#1e1e1e]">
          
          <div className="flex items-center gap-1.5 px-2">
            <Button
              variant="ghost"
              size="icon"
              className={`w-12 h-12 rounded-full transition-all duration-300 ${isMicOn ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20'}`}
              onClick={toggleAudio}
            >
              {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className={`w-12 h-12 rounded-full transition-all duration-300 ${isVideoOn ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20'}`}
              onClick={toggleVideo}
            >
              {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>
          </div>

          <div className="w-px h-8 bg-white/10 mx-1" />

          <div className="flex items-center gap-1.5 px-1">
            <Button
              variant="ghost"
              size="icon"
              className={`w-12 h-12 rounded-full transition-all duration-300 ${isRecording ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse' : 'bg-white/5 text-white hover:bg-white/10'}`}
              onClick={() => isRecording ? stopRecordingAndUpload() : startRecording()}
              disabled={isUploadingRecording}
            >
              <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-white' : 'bg-red-500'}`} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className={`w-12 h-12 rounded-full transition-all duration-300 ${isScreenSharing ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-white/5 text-white hover:bg-white/10'}`}
              onClick={toggleScreenShare}
              title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
            >
              <MonitorUp className={`h-5 w-5 ${isScreenSharing ? 'rotate-45' : ''}`} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 rounded-full bg-white/5 text-white hover:bg-white/10"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </Button>
          </div>

          <div className="w-px h-8 bg-white/10 mx-1" />

          <div className="flex items-center gap-1.5 px-2">
            <Button
              variant="ghost"
              size="icon"
              className={`w-12 h-12 rounded-full bg-white/5 transition-all ${showSidebar ? 'text-orange-500 bg-orange-500/10' : 'text-white hover:bg-white/10'}`}
              onClick={() => {
                setShowSidebar(!showSidebar)
                if (!showSidebar) setUnreadCount(0)
              }}
            >
              <div className="relative">
                <Send className="h-5 w-5" />
                {!showSidebar && unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#1e1e1e]">
                    {unreadCount}
                  </span>
                )}
              </div>
            </Button>

            <Button
              variant="destructive"
              className="h-12 px-6 rounded-full font-black uppercase tracking-widest text-xs ml-2 shadow-xl shadow-red-600/20"
              onClick={() => leaveCall()}
            >
              <PhoneOff className="h-4 w-4 mr-2" />
              End Call
            </Button>
          </div>
        </div>
      </footer>

      {/* Right Sidebar (Chat & Info) */}
      <AnimatePresence>
        {showSidebar && (
          <motion.aside
            initial={{ x: 360 }}
            animate={{ x: 0 }}
            exit={{ x: 360 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-[360px] bg-white dark:bg-[#1a1a1a] shadow-[-20px_0_50px_rgba(0,0,0,0.3)] z-40 flex flex-col border-l border-white/5"
          >
            {/* Sidebar Tabs */}
            <div className="flex items-center p-4 border-b border-gray-100 dark:border-white/5">
              <button 
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-2 text-xs font-black uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === 'chat' ? 'text-orange-600 border-orange-600' : 'text-gray-400 border-transparent'}`}
              >
                Messages
              </button>
              <button 
                onClick={() => setActiveTab('info')}
                className={`flex-1 py-2 text-xs font-black uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === 'info' ? 'text-orange-600 border-orange-600' : 'text-gray-400 border-transparent'}`}
              >
                Room Details
              </button>
              <Button variant="ghost" size="icon" className="ml-2" onClick={() => setShowSidebar(false)}>
                 <Maximize2 className="h-4 w-4 rotate-45 text-gray-400" />
              </Button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col p-6">
              {activeTab === 'chat' ? (
                <>
                  <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-thin scrollbar-thumb-orange-500/20">
                    {chatMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4 opacity-50">
                        <Send className="h-12 w-12" />
                        <p className="text-sm font-medium">Say hello to the Pandit Ji</p>
                      </div>
                    ) : (
                      chatMessages.map((msg, i) => {
                        const mine = msg.userId === user?.id
                        const showName = i === 0 || chatMessages[i-1].userId !== msg.userId
                        return (
                          <div key={msg.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                            {showName && (
                              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">
                                {mine ? 'You' : (msg.username || 'Participant')}
                              </span>
                            )}
                            <div className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed max-w-[90%] shadow-sm ${
                              mine ? 'bg-orange-600 text-white rounded-tr-none' : 'bg-gray-100 dark:bg-white/5 dark:text-white rounded-tl-none'
                            }`}>
                              {msg.message}
                            </div>
                          </div>
                        )
                      })
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  <div className="mt-6 flex items-center gap-3">
                    <div className="flex-1 relative">
                       <input
                         value={chatInput}
                         onChange={(e) => setChatInput(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                         placeholder="Send message..."
                         className="w-full bg-gray-100 dark:bg-white/5 border-none h-12 px-6 rounded-2xl text-sm focus:ring-2 focus:ring-orange-500 transition-all dark:text-white"
                       />
                    </div>
                    <Button 
                      size="icon" 
                      onClick={sendChatMessage} 
                      disabled={!chatInput.trim()} 
                      className="h-12 w-12 rounded-2xl bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-600/20"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                  <div className="space-y-4">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Meeting Info</h4>
                    <div className="space-y-2">
                       <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Room ID</p>
                          <p className="text-sm font-bold break-all dark:text-white">{roomId}</p>
                       </div>
                       <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Booking Status</p>
                          <p className="text-sm font-bold text-emerald-600">Active Session</p>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Session Quality</h4>
                    <div className="grid grid-cols-1 gap-2">
                       {[
                         { id: 'good', label: 'Ultra HD', desc: '1.5 Mbps - Best Visuals' },
                         { id: 'fair', label: 'Balanced', desc: '700 Kbps - Standard' },
                         { id: 'poor', label: 'Data Saver', desc: '300 Kbps - Limited Data' }
                       ].map(q => (
                         <button
                           key={q.id}
                           onClick={() => setRequestedQuality(q.id as ConnectionQuality)}
                           className={`p-3 rounded-2xl text-left transition-all border ${
                             requestedQuality === q.id 
                               ? 'bg-orange-500/10 border-orange-500 text-orange-600' 
                               : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-500 hover:border-gray-200 dark:hover:border-white/10'
                           }`}
                         >
                           <p className="text-xs font-black uppercase tracking-tight">{q.label}</p>
                           <p className="text-[10px] opacity-60 font-medium">{q.desc}</p>
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Audio/Video Settings</h4>
                    <div className="space-y-3">
                       <select
                         value={selectedVideoInput}
                         onChange={(e) => switchVideoInput(e.target.value)}
                         className="w-full h-12 bg-gray-50 dark:bg-white/5 rounded-2xl px-4 text-xs font-bold border-none ring-1 ring-gray-200 dark:ring-white/10"
                       >
                         {devices.filter(d => d.kind === 'videoinput').map(d => (
                            <option key={d.deviceId} value={d.deviceId} className="dark:bg-[#1a1a1a]">{d.label}</option>
                         ))}
                       </select>
                       <select
                         value={selectedAudioInput}
                         onChange={(e) => switchAudioInput(e.target.value)}
                         className="w-full h-12 bg-gray-50 dark:bg-white/5 rounded-2xl px-4 text-xs font-bold border-none ring-1 ring-gray-200 dark:ring-white/10"
                       >
                         {devices.filter(d => d.kind === 'audioinput').map(d => (
                            <option key={d.deviceId} value={d.deviceId} className="dark:bg-[#1a1a1a]">{d.label}</option>
                         ))}
                       </select>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => window.print()}
                      className="w-full h-12 rounded-2xl border-dashed border-gray-300 dark:border-white/10 dark:text-white"
                    >
                       <FileText className="h-4 w-4 mr-2" />
                       Download Session Recap
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  )
}
