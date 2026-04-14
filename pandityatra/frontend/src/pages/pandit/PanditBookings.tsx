import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import apiClient from '@/lib/api-client'
import { Video, Check, X, XCircle } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

interface Booking {
  id: number;
  service_name: string;
  booking_date: string;
  booking_time: string;
  status: string;
  user_full_name: string;
  full_name: string;
  phone_number: string;
  service_address: string;
  service_location: string;
  payment_status: boolean;
  payment_method?: string;
  transaction_id?: string;
  video_room_url?: string;
  daily_room_url?: string;
}

const PanditBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bookings' | 'history'>('bookings');
  const [videoHistory, setVideoHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBookings();
    if (activeTab === 'history') {
      fetchVideoHistory();
    }
  }, [activeTab]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/bookings/');
      setBookings(response.data.results || response.data);
    } catch (error) {
      console.error("Failed to load bookings", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVideoHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await apiClient.get('/video/history/');
      setVideoHistory(response.data);
    } catch (err) {
      console.error("Failed to load video history", err);
    } finally {
      setHistoryLoading(false);
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
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
            <p className="text-muted-foreground">Manage your upcoming and past service requests.</p>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <Button
              variant={activeTab === 'bookings' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('bookings')}
              className={activeTab === 'bookings' ? 'bg-orange-600 hover:bg-orange-700' : ''}
            >
              Bookings
            </Button>
            <Button
              variant={activeTab === 'history' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('history')}
              className={activeTab === 'history' ? 'bg-orange-600 hover:bg-orange-700' : ''}
            >
              History
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {activeTab === 'history' ? (
            historyLoading ? <p>Loading History...</p> : videoHistory.length === 0 ? <p className="text-muted-foreground">No sessions found.</p> : videoHistory.map((h) => (
              <Card key={h.id} className="border-l-4 border-l-green-600">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-lg">{h.puja_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">Client: {h.partner_name} • {h.date}</p>
                  </div>
                  {h.duration_seconds && <Badge variant="outline">{Math.floor(h.duration_seconds / 60)} mins</Badge>}
                </CardHeader>
                <CardContent className="flex justify-end gap-2">
                  {h.recording_url && (
                    <Button size="sm" className="bg-green-600" onClick={() => window.open(h.recording_url, '_blank')}>
                      View Recording
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={async () => {
                    // Logic to see chat if desired, currently using log download style from client
                    const { fetchChatMessages } = await import('@/lib/chat-api');
                    const messages = await fetchChatMessages(h.booking_id);
                    const log = messages.map((m: any) => `[${new Date(m.timestamp).toLocaleString()}] ${m.sender?.username || m.sender}: ${m.content}`).join('\n');
                    const blob = new Blob([log], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `chat-history-booking-${h.booking_id}.txt`;
                    a.click();
                  }}>
                    Chat History
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            loading ? <p>Loading...</p> : bookings.length === 0 ? <p className="text-muted-foreground">No bookings found.</p> : bookings.map((booking) => (
              <Card key={booking.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xl">{booking.service_name}</CardTitle>
                  <Badge variant={booking.status === 'ACCEPTED' ? 'default' : booking.status === 'COMPLETED' ? 'secondary' : 'outline'}>
                    {booking.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-4">
                    <p><span className="font-semibold">Host / Participant:</span> {booking.full_name || booking.user_full_name}</p>
                    <p><span className="font-semibold">Contact:</span> {booking.phone_number || 'N/A'}</p>
                    <p><span className="font-semibold">Ritual Location:</span> {booking.service_location} {booking.service_address ? `(${booking.service_address})` : ''}</p>
                    <p><span className="font-semibold">Date:</span> {booking.booking_date} at {booking.booking_time}</p>
                    <div className="flex items-center gap-2 my-2">
                      <span className="font-semibold text-gray-700">Payment:</span>{' '}
                      {booking.payment_status ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">Paid {booking.payment_method ? `(${booking.payment_method})` : ''}</Badge>
                      ) : (
                        <Badge variant="outline" className="text-yellow-700 border-yellow-300 bg-yellow-50">Payment Pending</Badge>
                      )}
                    </div>
                    {booking.transaction_id && (
                      <p><span className="font-semibold">Transaction:</span> {booking.transaction_id}</p>
                    )}
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
                    {booking.status === 'ACCEPTED' && (booking.daily_room_url || booking.video_room_url) && (
                      (() => {
                        const sessionDate = new Date(`${booking.booking_date}T${booking.booking_time}`);
                        const now = new Date();
                        const isPastDay = new Date(now.toDateString()) > new Date(sessionDate.toDateString());
                        const isPastHour = now > new Date(sessionDate.getTime() + 1 * 60 * 60 * 1000);
                        const isPast = isPastDay || isPastHour;

                        if (isPast) {
                          return (
                            <Badge variant="outline" className="border-red-200 text-red-600 bg-red-50 px-2 py-1 flex items-center gap-1 text-[10px]">
                              <XCircle className="h-3 w-3" />
                              Missed
                            </Badge>
                          );
                        }

                        return (
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => window.open(booking.daily_room_url || booking.video_room_url, '_blank')}>
                            <Video className="w-4 h-4 mr-1" /> Start Puja
                          </Button>
                        );
                      })()
                    )}
                    {booking.status === 'ACCEPTED' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200"
                          onClick={async () => {
                            try {
                              await apiClient.post(`/video/generate-link/${booking.id}/`);
                              toast({ title: (booking.daily_room_url || booking.video_room_url) ? "Room regenerated successfully" : "Room generated successfully" });
                              fetchBookings();
                            } catch (error) {
                              toast({ title: "Failed to generate link", variant: "destructive" });
                            }
                          }}
                        >
                          <Video className="w-4 h-4 mr-1" />
                          {(booking.daily_room_url || booking.video_room_url) ? 'Regenerate Link' : 'Generate Link'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(booking.id, 'COMPLETED')}>
                          Mark Completed
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default PanditBookings
