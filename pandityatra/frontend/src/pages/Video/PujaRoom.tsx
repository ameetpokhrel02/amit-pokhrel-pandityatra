import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import apiClient from "@/lib/api-client"
import { DailyProvider, useParticipantIds, useLocalParticipant, useDaily } from "@daily-co/daily-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import ChatSidebar from "@/components/ChatSidebar"
import VideoTile from "./VideoTile"
import { Loader2, Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react"

// Component to handle the grid of videos
const VideoGrid = () => {
    const daily = useDaily();
    const localParticipantId = useLocalParticipant()?.session_id;
    const remoteParticipantIds = useParticipantIds({ filter: 'remote' });
    const [muted, setMuted] = useState(false);
    const [videoOff, setVideoOff] = useState(false);

    const toggleAudio = () => {
        if(daily) {
            daily.setLocalAudio(!muted);
            setMuted(!muted);
        }
    };

    const toggleVideo = () => {
        if(daily) {
            daily.setLocalVideo(!videoOff);
            setVideoOff(!videoOff);
        }
    };

    const leaveCall = () => {
        if(daily) daily.leave();
    };

    return (
        <div className="relative w-full h-full bg-slate-900 flex items-center justify-center">
             {/* Remote Participants (Main View) */}
             {remoteParticipantIds.length > 0 ? (
                 remoteParticipantIds.map(id => (
                     <VideoTile key={id} id={id} />
                 ))
             ) : (
                <div className="text-center text-slate-400">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-orange-500" />
                    <p>Waiting for the Pandit to join...</p>
                </div>
             )}

             {/* Local Participant (PIP) */}
             {localParticipantId && (
                 <VideoTile id={localParticipantId} isLocal />
             )}

             {/* Controls */}
             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 bg-black/20 backdrop-blur-md p-2 rounded-full border border-white/10">
                <Button 
                    variant={muted ? "destructive" : "secondary"} 
                    size="icon" 
                    className="rounded-full"
                    onClick={toggleAudio}
                >
                    {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button 
                    variant={videoOff ? "destructive" : "secondary"} 
                    size="icon" 
                    className="rounded-full"
                    onClick={toggleVideo}
                >
                    {videoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                </Button>
                <Button 
                    variant="destructive" 
                    size="icon" 
                    className="rounded-full"
                    onClick={leaveCall}
                >
                    <PhoneOff className="h-4 w-4" />
                </Button>
             </div>
        </div>
    );
};

export default function PujaRoom() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [roomUrl, setRoomUrl] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchRoom = () => {
    setLoading(true)
    setError(null)
    if (id) {
      apiClient.post(`/video/create-token/`, { booking_id: id }).then((response) => {
        setRoomUrl(response.data.room_url)
        setToken(response.data.token)
        setLoading(false)
      }).catch(err => {
        console.error(err);
        setError("Unable to connect to the video provider. Please check your connection or try again later.")
        setLoading(false)
      })
    }
  }

  useEffect(() => {
    fetchRoom()
    // eslint-disable-next-line
  }, [id])

  if (loading) {
    return <div className="p-10 flex items-center justify-center h-screen text-orange-600 font-bold gap-2"><Loader2 className="animate-spin" /> Connecting to Sacred Space...</div>
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-orange-50">
        <div className="bg-white p-8 rounded-xl shadow-lg flex flex-col items-center gap-4 border border-orange-200">
          <span className="text-6xl">🙏</span>
          <h2 className="text-2xl font-bold text-orange-700">Video Service Unavailable</h2>
          <p className="text-gray-700 text-center max-w-md">{error}</p>
          <div className="flex gap-3 mt-2">
            <Button variant="outline" onClick={fetchRoom}>Retry</Button>
            <Button variant="destructive" onClick={() => navigate('/my-bookings')}>Return to My Bookings</Button>
            <a href="/contact" className="text-primary underline text-sm flex items-center">Contact Support</a>
          </div>
        </div>
      </div>
    )
  }

  if (!roomUrl || !token) return <div className="p-10 flex items-center justify-center h-screen text-orange-600 font-bold">Connecting to Sacred Space...</div>

  return (
    <DailyProvider url={roomUrl} token={token}>
      <motion.div
        className="min-h-screen flex flex-col lg:flex-row bg-background overflow-y-auto lg:overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Video Area */}
        <div className="w-full lg:w-[70%] aspect-video lg:h-full p-4 bg-black">
          <Card className="h-full bg-slate-900 overflow-hidden relative border-none">
             <VideoGrid />
          </Card>
        </div>

        {/* Info + Chat Area */}
        <div className="w-full lg:w-[30%] h-[500px] lg:h-full p-4 flex flex-col gap-4 border-l">
          <Card className="flex-1 p-4 relative flex flex-col border-none shadow-none">
            <h2 className="text-xl font-bold text-[#3E2723] mb-2">Live Puja Portal</h2>
            <div className="flex-1 rounded-lg bg-orange-50/30 border border-orange-100 p-4 relative">
              <div className="space-y-4">
                <div className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-orange-500">
                  <p className="text-xs font-bold text-orange-800 uppercase">Current Occasion</p>
                  <p className="text-sm font-medium">Bratabandha Ceremony</p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-blue-500">
                  <p className="text-xs font-bold text-blue-800 uppercase">Location Info</p>
                  <p className="text-sm font-medium">Remote (Nepal Time: UTC+5:45)</p>
                </div>
              </div>

              {/* Chat Sidebar Integration */}
              <div className="absolute inset-0 top-[120px]">
                <ChatSidebar bookingId={id!} />
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => window.print()} className="border-[#3E2723]">
              Notes
            </Button>
            <Button
              variant="destructive"
              onClick={() => navigate('/my-bookings')}
            >
              Leave Room
            </Button>
          </div>
        </div>
      </motion.div>
    </DailyProvider>
  )
}