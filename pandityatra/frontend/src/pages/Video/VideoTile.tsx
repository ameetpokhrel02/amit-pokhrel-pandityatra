import { useRef, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { User, MicOff, Monitor } from 'lucide-react';

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
    <Card className={`relative overflow-hidden bg-[#1a1a1a] group transition-all duration-500 rounded-[2rem] border border-white/5 ${className || (isLocal ? 'h-44 w-64 absolute bottom-8 right-8 z-30 ring-4 ring-orange-500/30 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]' : 'w-full h-full shadow-2xl')}`}>
      {/* Video not available fallback */}
      {isVideoOff ? (
        <div className="w-full h-full flex items-center justify-center flex-col bg-gradient-to-br from-[#1e1e1e] to-[#111]">
           <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-700">
              <User className="h-10 w-10 text-white/20" />
           </div>
           <span className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{isLocal ? "Self Camera Off" : (label || "Participant")}</span>
        </div>
      ) : (
        <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted={isLocal} 
            className={`w-full h-full ${videoTrack?.label?.toLowerCase().includes('screen') || !isLocal ? 'object-contain bg-black' : 'object-cover scale-x-[-1]'}`} 
        />
      )}
      
      {/* Audio */}
      {!isLocal && <audio ref={audioRef} autoPlay playsInline />}
      
      {/* Indicators */}
      <div className="absolute bottom-4 left-4 flex gap-2 z-20">
        <div className="bg-black/40 backdrop-blur-3xl px-4 py-2 rounded-2xl flex items-center gap-3 border border-white/10 shadow-2xl">
          {isAudioOff && (
            <div className="flex items-center justify-center w-5 h-5 bg-red-500/20 rounded-full border border-red-500/30">
               <MicOff className="h-2.5 w-2.5 text-red-400" />
            </div>
          )}
          {videoTrack?.label?.toLowerCase().includes('screen') && (
            <div className="flex items-center gap-1.5 bg-orange-500/20 px-2 py-0.5 rounded-lg border border-orange-500/30">
               <Monitor className="h-2.5 w-2.5 text-orange-400" />
               <span className="text-[9px] font-bold text-orange-400 uppercase">Screen</span>
            </div>
          )}
          <span className="text-white/90 text-xs font-black uppercase tracking-widest">{label || (isLocal ? "You" : "Participant")}</span>
         </div>
      </div>
    </Card>
  );
}
