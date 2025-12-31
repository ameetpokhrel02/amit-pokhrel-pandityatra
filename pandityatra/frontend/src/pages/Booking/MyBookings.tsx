import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, Clock, MapPin, User, DollarSign, X } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

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
}

const MyBookingsPage: React.FC = () => {
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

      const response = await axios.get(
        'http://localhost:8000/api/bookings/my_bookings/',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
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
      await axios.patch(
        `http://localhost:8000/api/bookings/${bookingId}/cancel/`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1 container mx-auto py-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">My Bookings</h1>
            <p className="text-gray-600">View and manage your puja bookings</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Filter Buttons */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {(['all', 'pending', 'accepted', 'completed', 'cancelled'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                onClick={() => setFilter(f)}
                className={filter === f ? 'bg-orange-600 hover:bg-orange-700' : ''}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center items-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            </div>
          ) : filteredBookings.length === 0 ? (
            <Card>
              <CardContent className="pt-12 text-center">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-6">No bookings found</p>
                <Button onClick={() => navigate('/booking')} className="bg-orange-600 hover:bg-orange-700">
                  Book a Pandit
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {filteredBookings.map((booking, index) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{booking.service_name}</CardTitle>
                          <CardDescription className="mt-1">
                            Pandit: {booking.pandit_full_name}
                          </CardDescription>
                        </div>
                        <Badge className={`${getStatusColor(booking.status)} border`}>
                          {booking.status}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Left Column */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-gray-600" />
                            <div>
                              <p className="text-sm text-gray-600">Date</p>
                              <p className="font-semibold">{new Date(booking.booking_date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-gray-600" />
                            <div>
                              <p className="text-sm text-gray-600">Time</p>
                              <p className="font-semibold">{booking.booking_time}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <MapPin className="h-4 w-4 text-gray-600" />
                            <div>
                              <p className="text-sm text-gray-600">Location</p>
                              <p className="font-semibold">{booking.service_location.replace(/_/g, ' ')}</p>
                            </div>
                          </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <User className="h-4 w-4 text-gray-600" />
                            <div>
                              <p className="text-sm text-gray-600">Expertise</p>
                              <p className="font-semibold">{booking.pandit_expertise}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <DollarSign className="h-4 w-4 text-gray-600" />
                            <div>
                              <p className="text-sm text-gray-600">Total Amount</p>
                              <p className="font-semibold text-orange-600">₹{booking.total_fee}</p>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm text-gray-600">Payment Status</p>
                            <Badge variant={booking.payment_status ? "default" : "secondary"} className="mt-1">
                              {booking.payment_status ? 'Paid' : 'Pending'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Fee Breakdown */}
                      <div className="bg-gray-50 p-4 rounded-lg mb-6">
                        <div className="flex justify-between text-sm mb-2">
                          <span>Service Fee:</span>
                          <span>₹{booking.service_fee}</span>
                        </div>
                        {booking.samagri_fee > 0 && (
                          <div className="flex justify-between text-sm mb-2">
                            <span>Samagri Fee:</span>
                            <span>₹{booking.samagri_fee}</span>
                          </div>
                        )}
                        <div className="border-t pt-2 flex justify-between font-semibold">
                          <span>Total:</span>
                          <span>₹{booking.total_fee}</span>
                        </div>
                      </div>

                      {/* Notes */}
                      {booking.notes && (
                        <div className="bg-blue-50 p-4 rounded-lg mb-6">
                          <p className="text-sm font-semibold text-blue-900 mb-1">Your Notes:</p>
                          <p className="text-sm text-blue-800">{booking.notes}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {booking.status === 'PENDING' && (
                          <Button
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={cancellingId === booking.id}
                            variant="destructive"
                            className="flex-1"
                          >
                            {cancellingId === booking.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <X className="h-4 w-4 mr-2" />
                            )}
                            Cancel Booking
                          </Button>
                        )}
                        {booking.status === 'ACCEPTED' && (
                          <Button
                            disabled
                            className="flex-1 bg-blue-600"
                          >
                            Awaiting Your Confirmation
                          </Button>
                        )}
                        {booking.status === 'COMPLETED' && (
                          <Button
                            onClick={() => navigate(`/booking/${booking.id}/review`)}
                            className="flex-1"
                          >
                            Leave Review
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default MyBookingsPage;
