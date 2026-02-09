import { useVideoTrack, useAudioTrack } from '@daily-co/daily-react';
import { useRef, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { User, MicOff } from 'lucide-react';

export default function VideoTile({ id, isLocal }: { id: string, isLocal?: boolean }) {
  const videoState = useVideoTrack(id);
  const audioState = useAudioTrack(id);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (videoState.track && videoRef.current) {
      videoRef.current.srcObject = new MediaStream([videoState.track]);
    }
  }, [videoState.track]);

  useEffect(() => {
    if (audioState.track && audioRef.current) {
      audioRef.current.srcObject = new MediaStream([audioState.track]);
    }
  }, [audioState.track]);

  return (
    <Card className={`relative overflow-hidden bg-slate-800 ${isLocal ? 'h-32 w-48 absolute bottom-4 right-4 z-10 border-2 border-orange-500 shadow-lg' : 'w-full h-full border-none rounded-none'}`}>
      {/* Video not available fallback */}
      {videoState.isOff ? (
        <div className="w-full h-full flex items-center justify-center flex-col text-slate-400">
           <User className="h-16 w-16 mb-2 opacity-50" />
           <span className="text-xs">{isLocal ? "Camera Off" : "Video Paused"}</span>
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
         <div className="bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded flex items-center gap-2">
            {audioState.isOff && <MicOff className="h-3 w-3 text-red-400" />}
            {isLocal ? "You" : "Live Feed"}
         </div>
      </div>
    </Card>
  );
}
