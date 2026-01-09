import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { DailyProvider } from "@daily-co/daily-react"
import getVideoRoom from "@/services/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export default function PujaRoom() {
  const { id } = useParams()
  const [roomUrl, setRoomUrl] = useState<string | null>(null)

  useEffect(() => {
    getVideoRoom(`/rooms/${id}`).then((response) => {
      setRoomUrl(response.data.room_url)
    })
  }, [id])

  if (!roomUrl) return <div className="p-10">Loading Puja...</div>

  return (
    <DailyProvider url={roomUrl}>
      <motion.div
        className="h-screen flex bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Video */}
        <div className="w-[70%] p-4">
          <Card className="h-full overflow-hidden">
            {/* You need to iterate over participants and render DailyVideo for each, or use a layout component */}
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Video Frame
            </div>
          </Card>
        </div>

        {/* Chat + Controls */}
        <div className="w-[30%] p-4 flex flex-col gap-4">
          <Card className="flex-1 p-4">
            <h2 className="text-lg font-bold">Live Puja Chat</h2>
            <div className="mt-3 h-full bg-muted rounded p-2" />
          </Card>

          <Button className="bg-orange-500 hover:bg-orange-600">
            End Puja
          </Button>
        </div>
      </motion.div>
    </DailyProvider>
  )
}