/**
 * Payment Success Page
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle, Calendar, MapPin, Video } from 'lucide-react';
import { getPaymentStatus } from '@/lib/payment-api';
import axios from 'axios';

interface BookingDetails {
  id: number;
  service_name: string;
  pandit_name: string;
  booking_date: string;
  booking_time: string;
  service_location: string;
  video_room_url: string | null;
  total_fee: number;
  payment_method: string;
}

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    verifyPayment();
  }, [sessionId]);

  const verifyPayment = async () => {
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      // Get booking ID from session or local storage
      const bookingId = sessionStorage.getItem('pending_booking_id');
      
      if (bookingId) {
        // Fetch booking details
        const response = await axios.get(
          `http://localhost:8000/api/bookings/${bookingId}/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setBooking(response.data);
        
        // Clear pending booking
        sessionStorage.removeItem('pending_booking_id');
      }
    } catch (err) {
      console.error('Failed to verify payment:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardContent className="pt-8 pb-6 px-6 space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
          </div>

          {/* Success Message */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Payment Successful!</h1>
            <p className="text-gray-600">
              Your puja booking has been confirmed
            </p>
          </div>

          {/* Booking Details */}
          {booking && (
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <h2 className="font-semibold text-lg mb-4">Booking Details</h2>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="font-medium">{booking.service_name}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(booking.booking_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-gray-600">Time: {booking.booking_time}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Pandit: {booking.pandit_name}</p>
                    <p className="text-sm text-gray-600">Location: {booking.service_location}</p>
                  </div>
                </div>

                {booking.video_room_url && (
                  <div className="flex items-start gap-3">
                    <Video className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-blue-600">Video Call Ready</p>
                      <p className="text-sm text-gray-600 mb-2">
                        Your video room is ready for the puja
                      </p>
                      <Button
                        onClick={() => window.open(booking.video_room_url!, '_blank')}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <Video className="w-4 h-4" />
                        Open Video Room
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="font-medium">{booking.payment_method}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-600">Booking ID</span>
                  <span className="font-medium">#{booking.id}</span>
                </div>
              </div>
            </div>
          )}

          {/* Email Confirmation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-sm text-blue-800">
              📧 A confirmation email has been sent to your registered email address
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={() => navigate('/my-bookings')}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              View My Bookings
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="flex-1"
            >
              Go to Home
            </Button>
          </div>

          {/* Additional Info */}
          <div className="text-center text-xs text-gray-500 pt-4 border-t">
            <p>Need help? Contact us at support@pandityatra.com</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
