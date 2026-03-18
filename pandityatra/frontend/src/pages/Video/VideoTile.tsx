import { useRef, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { User, MicOff } from 'lucide-react';

interface VideoTileProps {
  stream: MediaStream | null;
  isLocal?: boolean;
  label?: string;
  className?: string;
}

export default function VideoTile({ stream, isLocal, label, className }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const videoTrack = stream?.getVideoTracks()[0] || null;
  const audioTrack = stream?.getAudioTracks()[0] || null;
  const isVideoOff = !videoTrack || videoTrack.enabled === false;
  const isAudioOff = !audioTrack || audioTrack.enabled === false;

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <Card className={`relative overflow-hidden bg-slate-800 ${className || (isLocal ? 'h-32 w-48 absolute bottom-4 right-4 z-10 border-2 border-orange-500 shadow-lg rounded-xl' : 'w-full h-full border border-slate-700/60 rounded-xl')}`}>
      {/* Video not available fallback */}
      {isVideoOff ? (
        <div className="w-full h-full flex items-center justify-center flex-col text-slate-300 bg-gradient-to-br from-slate-800 to-slate-900">
           <User className="h-14 w-14 mb-2 opacity-60" />
           <span className="text-xs font-medium">{isLocal ? "Camera Off" : "Video Paused"}</span>
        </div>
      ) : (
        <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted={isLocal} 
            className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`} 
        />
      )}
      
      {/* Audio */}
      {!isLocal && <audio ref={audioRef} autoPlay playsInline />}
      
      {/* Indicators */}
      <div className="absolute bottom-2 left-2 flex gap-2">
        <div className="bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-2 border border-white/20">
          {isAudioOff && <MicOff className="h-3 w-3 text-red-400" />}
          {label || (isLocal ? "You" : "Live Feed")}
         </div>
      </div>
    </Card>
  );
}
