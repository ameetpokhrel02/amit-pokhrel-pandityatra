import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, Clock, MapPin, User, DollarSign, X, Video } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

interface Booking {
  id: number;
  user_full_name: string;
  pandit_full_name: string;
  pandit_expertise: string;
  service_name: string;
  service_location: string;
  booking_date: string;
  booking_time: string;
  status: string;
  service_fee: number;
  samagri_fee: number;
  total_fee: number;
  payment_status: boolean;
  service_duration?: number;
  notes?: string;
  created_at: string;
  video_room_url?: string;
  pandit_id: number;
}

const MyBookingsPage: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'completed' | 'cancelled'>('all');
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await apiClient.get('/bookings/my_bookings/');
      setBookings(response.data);
      setError(null);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to load bookings';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      setCancellingId(bookingId);
      const token = localStorage.getItem('access_token');
      await apiClient.patch(`/bookings/${bookingId}/cancel/`);
      fetchBookings();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ACCEPTED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status === filter.toUpperCase();
  });

  if (loading) {
    const LoadingContent = (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your bookings...</p>
        </div>
      </div>
    );

    return embedded ? LoadingContent : (
      <DashboardLayout userRole="user">
        {LoadingContent}
      </DashboardLayout>
    );
  }

  const MainContent = (
    <div className="space-y-6">
      {!embedded && (
        <div>
          <h1 className="text-3xl font-bold">My Bookings</h1>
          <p className="text-muted-foreground">Manage and track your puja appointments.</p>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', 'pending', 'accepted', 'completed', 'cancelled'] as const).map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            onClick={() => setFilter(status)}
            className={`capitalize ${filter === status ? 'bg-orange-600 hover:bg-orange-700' : ''
              }`}
          >
            {status}
          </Button>
        ))}
      </div>

      {/* Bookings List */}
      <div className="grid gap-6">
        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-lg font-semibold text-gray-900">No bookings found</p>
              <p className="text-gray-500 mb-4">You haven't made any bookings in this category yet.</p>
              <Button
                onClick={() => navigate('/booking')}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Book a Puja
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredBookings.map((booking) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="hover:shadow-md transition-shadow duration-300 border-l-4 border-l-orange-500">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900 mb-1">
                        {booking.service_name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Pandit: <Link to={`/pandits/${booking.pandit_id}`} className="text-orange-600 hover:underline font-medium ml-1">{booking.pandit_full_name}</Link>
                      </CardDescription>
                    </div>
                    <Badge className={`${getStatusColor(booking.status)} px-3 py-1 rounded-full`}>
                      {booking.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(booking.booking_date).toLocaleDateString(undefined, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{booking.booking_time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{booking.service_location}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Service Fee:</span>
                        <span className="font-medium">₹{booking.service_fee}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Samagri Fee:</span>
                        <span className="font-medium">₹{booking.samagri_fee}</span>
                      </div>
                      <div className="flex justify-between items-center text-base font-bold text-orange-700 pt-2 border-t">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" /> Total Fee:
                        </span>
                        <span>₹{booking.total_fee}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    {/* VIDEO CALL BUTTON */}
                    {booking.status === 'ACCEPTED' && booking.video_room_url && (
                      <Button
                        onClick={() => window.open(booking.video_room_url, '_blank')}
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                      >
                        <Video className="h-4 w-4" />
                        Join Live Puja
                      </Button>
                    )}

                    {booking.status === 'PENDING' && (
                      <Button
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={cancellingId === booking.id}
                      >
                        {cancellingId === booking.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <X className="h-4 w-4 mr-2" />
                        )}
                        Cancel Booking
                      </Button>
                    )}

                    {booking.status === 'COMPLETED' && (
                      <Button
                        variant="outline"
                        className="border-orange-200 text-orange-600 hover:bg-orange-50"
                        onClick={() => navigate(`/write-review/${booking.id}`)}
                      >
                        Write Review
                      </Button>
                    )}

                    {booking.status === 'ACCEPTED' && !booking.video_room_url && (
                      <Button disabled variant="secondary" className="cursor-not-allowed opacity-70">
                        <Video className="h-4 w-4 mr-2" />
                        Wait for Link
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );

  return embedded ? MainContent : (
    <DashboardLayout userRole="user">
      {MainContent}
    </DashboardLayout>
  );
};

export default MyBookingsPage;
