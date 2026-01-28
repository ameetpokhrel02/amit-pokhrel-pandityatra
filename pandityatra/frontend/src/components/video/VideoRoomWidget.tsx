import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Users, 
  MessageCircle,
  Settings,
  StopCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';

interface VideoRoomWidgetProps {
  bookingId: number;
  roomUrl: string;
  isHost?: boolean; // True for pandit, false for customer
  onCallEnd?: () => void;
}

declare global {
  interface Window {
    DailyIframe: any;
  }
}

export const VideoRoomWidget: React.FC<VideoRoomWidgetProps> = ({
  bookingId,
  roomUrl,
  isHost = false,
  onCallEnd
}) => {
  const { user } = useAuth();
  const callFrameRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    loadDailyScript();
    return () => {
      if (callFrameRef.current) {
        callFrameRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    let interval: number;
    if (isConnected) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected]);

  const loadDailyScript = () => {
    if (window.DailyIframe) {
      initializeCall();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@daily-co/daily-js';
    script.onload = initializeCall;
    script.onerror = () => setError('Failed to load video call library');
    document.head.appendChild(script);
  };

  const initializeCall = async () => {
    try {
      if (!window.DailyIframe) {
        throw new Error('Daily library not loaded');
      }

      // Get meeting token from backend
      const tokenResponse = await apiClient.post('/video/create-token/', {
        booking_id: bookingId,
        room_url: roomUrl,
        is_host: isHost
      });

      const meetingToken = tokenResponse.data.token;

      // Create call frame
      callFrameRef.current = window.DailyIframe.createFrame(containerRef.current, {
        iframeStyle: {
          width: '100%',
          height: '400px',
          border: 'none',
          borderRadius: '8px'
        },
        showLeaveButton: false,
        showFullscreenButton: true,
        showLocalVideo: true,
        showParticipantsBar: true,
        theme: {
          accent: '#f97316',
          accentText: '#ffffff',
          background: '#ffffff',
          backgroundAccent: '#fef3e2',
          baseText: '#1f2937',
          border: '#e5e7eb',
          mainAreaBg: '#ffffff',
          mainAreaBgAccent: '#f9fafb',
          mainAreaText: '#1f2937',
          supportiveText: '#6b7280'
        }
      });

      // Set up event listeners
      callFrameRef.current
        .on('joined-meeting', handleJoinedMeeting)
        .on('left-meeting', handleLeftMeeting)
        .on('participant-joined', handleParticipantJoined)
        .on('participant-left', handleParticipantLeft)
        .on('recording-started', () => setIsRecording(true))
        .on('recording-stopped', () => setIsRecording(false))
        .on('error', handleError);

      // Join the meeting
      await callFrameRef.current.join({
        url: roomUrl,
        token: meetingToken,
        userName: user?.full_name || 'User'
      });

    } catch (error: any) {
      console.error('Failed to initialize video call:', error);
      setError(error.message || 'Failed to join video call');
      setIsLoading(false);
    }
  };

  const handleJoinedMeeting = (event: any) => {
    setIsConnected(true);
    setIsLoading(false);
    setParticipants(Object.values(event.participants));
  };

  const handleLeftMeeting = () => {
    setIsConnected(false);
    onCallEnd?.();
  };

  const handleParticipantJoined = (event: any) => {
    setParticipants(prev => [...prev, event.participant]);
  };

  const handleParticipantLeft = (event: any) => {
    setParticipants(prev => 
      prev.filter(p => p.session_id !== event.participant.session_id)
    );
  };

  const handleError = (event: any) => {
    console.error('Daily call error:', event);
    setError(event.errorMsg || 'Video call error occurred');
  };

  const toggleVideo = () => {
    if (callFrameRef.current) {
      callFrameRef.current.setLocalVideo(!isVideoOn);
      setIsVideoOn(!isVideoOn);
    }
  };

  const toggleAudio = () => {
    if (callFrameRef.current) {
      callFrameRef.current.setLocalAudio(!isAudioOn);
      setIsAudioOn(!isAudioOn);
    }
  };

  const startRecording = async () => {
    if (callFrameRef.current && isHost) {
      try {
        await callFrameRef.current.startRecording();
        setIsRecording(true);
      } catch (error) {
        console.error('Failed to start recording:', error);
      }
    }
  };

  const stopRecording = async () => {
    if (callFrameRef.current && isHost) {
      try {
        await callFrameRef.current.stopRecording();
        setIsRecording(false);
      } catch (error) {
        console.error('Failed to stop recording:', error);
      }
    }
  };

  const leaveCall = () => {
    if (callFrameRef.current) {
      callFrameRef.current.leave();
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Puja Video Call
            {isHost && (
              <Badge variant="secondary" className="ml-2">
                Host
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-4">
            {isConnected && (
              <>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  {participants.length} participant{participants.length !== 1 ? 's' : ''}
                </div>
                <div className="text-sm text-gray-600">
                  {formatDuration(callDuration)}
                </div>
                {isRecording && (
                  <Badge variant="destructive" className="animate-pulse">
                    <span className="w-3 h-3 mr-1 bg-red-500 rounded-full"></span>
                    Recording
                  </Badge>
                )}
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Connecting to video call...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Video Container */}
            <div 
              ref={containerRef} 
              className="w-full h-96 bg-gray-900 rounded-lg overflow-hidden mb-4"
            />

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant={isVideoOn ? "default" : "destructive"}
                size="sm"
                onClick={toggleVideo}
                className="flex items-center gap-2"
              >
                {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                {isVideoOn ? 'Video On' : 'Video Off'}
              </Button>

              <Button
                variant={isAudioOn ? "default" : "destructive"}
                size="sm"
                onClick={toggleAudio}
                className="flex items-center gap-2"
              >
                {isAudioOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                {isAudioOn ? 'Mic On' : 'Mic Off'}
              </Button>

              {isHost && (
                <Button
                  variant={isRecording ? "destructive" : "outline"}
                  size="sm"
                  onClick={isRecording ? stopRecording : startRecording}
                  className="flex items-center gap-2"
                >
                  {isRecording ? (
                    <>
                      <StopCircle className="w-4 h-4" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <span className="w-4 h-4 bg-red-500 rounded-full"></span>
                      Start Recording
                    </>
                  )}
                </Button>
              )}

              <Button
                variant="destructive"
                size="sm"
                onClick={leaveCall}
                className="flex items-center gap-2"
              >
                <PhoneOff className="w-4 h-4" />
                Leave Call
              </Button>
            </div>

            {/* Participants List */}
            {participants.length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-semibold mb-2">Participants:</h4>
                <div className="flex flex-wrap gap-2">
                  {participants.map((participant, index) => (
                    <Badge key={participant.session_id || index} variant="outline">
                      {participant.user_name || `User ${index + 1}`}
                      {participant.local && ' (You)'}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoRoomWidget;