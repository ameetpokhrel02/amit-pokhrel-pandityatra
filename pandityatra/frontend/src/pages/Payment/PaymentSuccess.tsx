import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Calendar, Home, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/api-client';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import Confetti from 'react-confetti';

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
}

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const { bookingId: paramBookingId } = useParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Use param ID or fallback to session storage (for backward compatibility)
  const bookingId = paramBookingId || sessionStorage.getItem('pending_booking_id');

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
      fetchBookingDetails();
    } else {
      setLoading(false);
      // If no ID found, redirect to home after a delay or show error
      const timer = setTimeout(() => navigate('/'), 3000);
      return () => clearTimeout(timer);
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const response = await api.get(`/bookings/${bookingId}/`);
      setBooking(response.data);
      // Clear session storage if it was used
      if (!paramBookingId) {
        sessionStorage.removeItem('pending_booking_id');
      }
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
      <div className="min-h-screen bg-orange-50/30 flex items-center justify-center">
        <LoadingSpinner size={60} />
      </div>
    );
  }

  if (!booking && !loading) {
    return (
       <div className="min-h-screen bg-orange-50/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 text-center">
             <h2 className="text-xl font-bold text-gray-800 mb-2">Booking Not Found</h2>
             <p className="text-gray-600 mb-4">We couldn't find the booking details. You will be redirected to home shortly.</p>
             <Button onClick={() => navigate('/')}>Go Home</Button>
        </Card>
       </div>
    )
  }

  return (
    <div className="min-h-screen bg-orange-50/30 flex items-center justify-center p-4 relative overflow-hidden">
      <Confetti
        width={windowSize.width}
        height={windowSize.height}
        recycle={false}
        numberOfPieces={500}
        gravity={0.15}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl relative z-10"
      >
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl overflow-hidden">
          {/* Top accent bar */}
          <div className="h-2 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600" />
          
          <CardContent className="pt-10 pb-8 px-8 space-y-6">

            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="flex justify-center mb-6"
            >
              <div className="rounded-full bg-green-100 p-5 shadow-green-200/50 shadow-lg ring-4 ring-green-50">
                <CheckCircle className="w-16 h-16 text-green-600" strokeWidth={3} />
              </div>
            </motion.div>

            {/* Heading */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 tracking-tight">
                Payment Successful!
              </h1>
              <p className="text-lg font-medium text-gray-600 font-inter">
                Your booking is confirmed
              </p>
            </div>

            {/* Booking Summary Card */}
            {booking && (
              <div className="bg-orange-50/50 rounded-xl p-6 border border-orange-100/50 space-y-4 shadow-sm">
                
                <div className="flex justify-between items-start pb-4 border-b border-orange-200/50">
                   <div>
                      <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Puja</p>
                      <h3 className="font-semibold text-gray-800 text-lg">{booking.service_name}</h3>
                      <p className="text-sm text-gray-600">with {booking.pandit_name}</p>
                   </div>
                      <div className="text-right">
                      <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Order ID</p>
                      <p className="font-mono text-gray-700">#{booking.id.toString().padStart(5, '0')}</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase tracking-wide">Date & Time</span>
                    </div>
                    <p className="text-gray-800 font-medium">
                      {formatDate(booking.booking_date)}
                    </p>
                    <p className="text-gray-600 text-sm">{booking.booking_time}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-2 text-gray-500 mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wide">Total Paid</span>
                    </div>
                     <p className="text-gray-800 font-bold text-lg">
                      {booking.total_fee_usd ? `$${booking.total_fee_usd}` : formatCurrency(booking.total_fee)}
                    </p>
                  </div>
                </div>

              </div>
            )}

            {/* Next Steps */}
            <div className="space-y-3">
               <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                 <Info className="w-4 h-4 text-orange-500" />
                 What happens next?
               </h4>
               <ul className="space-y-2 text-sm text-gray-600 pl-1">
                 <li className="flex items-start gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5" />
                   <span>You will receive an email confirmation shortly.</span>
                 </li>
                 <li className="flex items-start gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5" />
                   <span>Join the live puja from <b>"My Bookings"</b> on the day.</span>
                 </li>
                 <li className="flex items-start gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5" />
                   <span>Recording will be available after completion.</span>
                 </li>
               </ul>
            </div>

          </CardContent>
          
          <CardFooter className="flex flex-col sm:flex-row gap-3 bg-gray-50/50 p-6 border-t border-gray-100">
            <Button 
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-6 text-lg shadow-lg shadow-orange-200/50 transition-all hover:-translate-y-0.5"
              onClick={() => navigate(`/my-bookings`)} 
            >
              View Booking Details
            </Button>
            <Button 
              variant="outline" 
              className="w-full border-gray-300 text-gray-600 hover:bg-gray-100 py-6 text-lg hover:text-gray-900"
              onClick={() => navigate('/')}
            >
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </CardFooter>
        </Card>
        
        <p className="text-center mt-6 text-gray-500 text-sm">
          Need help? <button onClick={() => navigate('/contact')} className="text-orange-600 font-medium hover:underline">Contact Support</button>
        </p>

      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
