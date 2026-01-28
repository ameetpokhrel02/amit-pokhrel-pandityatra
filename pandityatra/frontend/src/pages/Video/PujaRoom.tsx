import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import apiClient from "@/lib/api-client"
import { DailyProvider } from "@daily-co/daily-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import ChatSidebar from "@/components/ChatSidebar"

export default function PujaRoom() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [roomUrl, setRoomUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchRoom = () => {
    setLoading(true)
    setError(null)
    if (id) {
      apiClient.get(`/video/room/${id}/`).then((response) => {
        setRoomUrl(response.data.room_url || response.data.room_name)
        setLoading(false)
      }).catch(err => {
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
    return <div className="p-10 flex items-center justify-center h-screen text-orange-600 font-bold">Connecting to Sacred Space...</div>
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

  if (!roomUrl) return <div className="p-10 flex items-center justify-center h-screen text-orange-600 font-bold">Connecting to Sacred Space...</div>

  return (
    <DailyProvider url={roomUrl}>
      <motion.div
        className="min-h-screen flex flex-col lg:flex-row bg-background overflow-y-auto lg:overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Video Area */}
        <div className="w-full lg:w-[70%] aspect-video lg:h-full p-4 bg-black">
          <Card className="h-full bg-slate-900 overflow-hidden relative border-none">
            {/* The DailyProvider handles the underlying call. 
                 In a full impl, we'd use useParticipant hooks to render specific streams.
                 For this flow, we'll assume the frame is active. */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-orange-500 rounded-full animate-pulse mb-4 mx-auto flex items-center justify-center">
                  <span className="text-white text-4xl">🕉️</span>
                </div>
                <p className="text-white text-lg font-medium">Sacred Video Feed Active</p>
                <p className="text-gray-400 text-sm">Ramesh Shastri Ji (Pandit) Joined</p>
              </div>
            </div>

            {/* Overlay Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
              <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-white text-sm">
                Meeting ID: {id}
              </div>
            </div>
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