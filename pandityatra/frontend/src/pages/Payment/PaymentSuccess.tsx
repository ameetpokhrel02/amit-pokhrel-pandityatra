import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Calendar, Home, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/api-client';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import Confetti from 'react-confetti';
import { PaymentSuccessState } from '@/components/payment/PaymentSuccessState';

interface BookingDetails {
  id: number;
  service_name: string;
  pandit_name: string;
  booking_date: string;
  booking_time: string;
  total_fee: number;
  total_fee_usd: number;
  service_location: string;
  status: string;
  transaction_id?: string;
}

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const { bookingId: paramBookingId } = useParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  
  // Use param ID or fallback to session storage (for backward compatibility)
  const bookingId = paramBookingId || sessionStorage.getItem('pending_booking_id');

  // Get payment metadata from session storage
  const lastPaymentMethod = sessionStorage.getItem('last_payment_method') || (sessionId ? 'STRIPE' : 'ESEWA');
  const isFirstBooking = sessionStorage.getItem('is_first_booking') === 'true';
  const lastTransactionId = sessionStorage.getItem('last_transaction_id') || sessionId || booking?.transaction_id;

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (bookingId) {
      if (sessionId) {
        verifyStripePayment(sessionId);
      } else {
        fetchBookingDetails();
      }
    } else {
      setLoading(false);
      const timer = setTimeout(() => navigate('/'), 3000);
      return () => clearTimeout(timer);
    }
  }, [bookingId, sessionId]);

  const verifyStripePayment = async (sid: string) => {
    setVerifying(true);
    setLoading(true);
    try {
      const response = await api.get('/payments/verify-stripe/', {
        params: {
          session_id: sid,
          booking_id: bookingId
        }
      });
      
      if (response.data.success) {
        // After verification, fetch details to show updated status
        await fetchBookingDetails();
      } else {
        throw new Error(response.data.message || "Verification failed");
      }
    } catch (err: any) {
      console.error('Stripe verification failed:', err);
      // Still try to fetch booking details to show whatever we have
      await fetchBookingDetails();
    } finally {
      setVerifying(false);
    }
  };

  const fetchBookingDetails = async () => {
    try {
      const response = await api.get(`/bookings/${bookingId}/`);
      setBooking(response.data);
    } catch (error) {
      console.error('Failed to fetch booking details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number, currency: string = 'NPR') => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50/30 flex items-center justify-center space-y-4 flex-col text-center">
        {verifying ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full"
            />
            <p className="text-xl font-bold text-gray-800">Verifying Divine Payment...</p>
            <p className="text-gray-500 text-sm">Synchronizing with secure processing servers</p>
          </>
        ) : (
          <LoadingSpinner size={60} />
        )}
      </div>
    );
  }

  if (!booking && !loading) {
    return (
       <div className="min-h-screen bg-orange-50/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 text-center rounded-3xl border-0 shadow-xl">
             <h2 className="text-xl font-bold text-gray-800 mb-2">Booking Not Found</h2>
             <p className="text-gray-600 mb-4 text-sm">We couldn't find the booking details. You will be redirected to home shortly.</p>
             <Button onClick={() => navigate('/')} className="bg-orange-500 hover:bg-orange-600 rounded-xl">Go Home</Button>
        </Card>
       </div>
    )
  }

  return (
    <div className="min-h-screen bg-orange-50/10 flex items-center justify-center p-4 relative overflow-hidden font-inter">
      <Confetti
        width={windowSize.width}
        height={windowSize.height}
        recycle={false}
        numberOfPieces={500}
        gravity={0.15}
      />
      
      <PaymentSuccessState
        gateway={lastPaymentMethod}
        transactionId={lastTransactionId || ''}
        amount={booking?.total_fee_usd ? booking.total_fee_usd : booking?.total_fee}
        currency={booking?.total_fee_usd ? 'USD' : 'NPR'}
        isFirstBooking={isFirstBooking}
        onAction={() => navigate('/my-bookings')}
        actionText="View My Bookings"
        onSecondaryAction={() => navigate('/')}
        secondaryActionText="Back to Home"
      >
        {/* Booking Summary Inclusion */}
        {booking && (
          <div className="space-y-4">
            <div className="bg-white/50 border border-orange-100/50 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-800 text-base">{booking.service_name}</h3>
                  <p className="text-xs text-orange-600 font-medium tracking-wide bg-orange-50 inline-block px-2 py-0.5 rounded-full mt-1">
                    {booking.pandit_name}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Booking ID</span>
                  <span className="font-mono text-xs font-bold text-gray-700">#{booking.id.toString().padStart(5, '0')}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-orange-50">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Schedule</p>
                    <p className="text-xs font-bold text-gray-800">{formatDate(booking.booking_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 justify-end">
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Time</p>
                    <p className="text-xs font-bold text-gray-800">{booking.booking_time}</p>
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                    <Home size={16} />
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps List */}
            <div className="space-y-3 px-1">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <div className="h-1 w-3 bg-orange-500 rounded-full" />
                Next Steps
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {[
                  "Check your email for receipt & guide",
                  "Access 'My Bookings' for video link",
                  "Prepare mentioned samagri items"
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="h-5 w-5 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                      <CheckCircle size={12} strokeWidth={3} />
                    </div>
                    <span className="font-medium text-xs">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </PaymentSuccessState>

      <div className="absolute bottom-8 left-0 right-0 text-center relative z-10">
        <p className="text-gray-400 text-xs">
          Secure Payment processed by PanditYatra Financial Services
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess;
