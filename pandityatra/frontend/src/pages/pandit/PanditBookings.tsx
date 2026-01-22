import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import apiClient from '@/lib/api-client'
import { Video, Check, X } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

interface Booking {
  id: number;
  service_name: string;
  booking_date: string;
  booking_time: string;
  status: string;
  user_full_name: string;
  video_room_url?: string;
}

const PanditBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await apiClient.get('/bookings/');
      setBookings(response.data.results || response.data);
    } catch (error) {
      console.error("Failed to load bookings", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await apiClient.patch(`/bookings/${id}/update_status/`, { status });
      toast({ title: `Booking ${status.toLowerCase()}` });
      fetchBookings();
    } catch (error) {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout userRole="pandit">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
          <p className="text-muted-foreground">Manage your upcoming and past service requests.</p>
        </div>

        <div className="grid gap-4">
          {loading ? <p>Loading...</p> : bookings.length === 0 ? <p className="text-muted-foreground">No bookings found.</p> : bookings.map((booking) => (
            <Card key={booking.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl">{booking.service_name}</CardTitle>
                <Badge variant={booking.status === 'ACCEPTED' ? 'default' : booking.status === 'COMPLETED' ? 'secondary' : 'outline'}>
                  {booking.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  <p><span className="font-semibold">Client:</span> {booking.user_full_name}</p>
                  <p><span className="font-semibold">Date:</span> {booking.booking_date}</p>
                  <p><span className="font-semibold">Time:</span> {booking.booking_time}</p>
                </div>
                <div className="flex gap-2">
                  {booking.status === 'PENDING' && (
                    <>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleStatusUpdate(booking.id, 'ACCEPTED')}>
                        <Check className="w-4 h-4 mr-1" /> Accept
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate(booking.id, 'CANCELLED')}>
                        <X className="w-4 h-4 mr-1" /> Decline
                      </Button>
                    </>
                  )}
                  {booking.status === 'ACCEPTED' && booking.video_room_url && (
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => window.open(booking.video_room_url, '_blank')}>
                      <Video className="w-4 h-4 mr-1" /> Join Live Puja
                    </Button>
                  )}
                  {booking.status === 'ACCEPTED' && (
                    <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(booking.id, 'COMPLETED')}>
                      Mark Completed
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default PanditBookings
