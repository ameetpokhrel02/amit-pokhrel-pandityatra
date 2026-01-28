/**
 * Payment Page - Gateway Selection and Payment Processing
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  createPayment,
  getExchangeRate,
  detectPreferredCurrency,
  formatCurrency,
  openKhaltiPopup,
} from '@/lib/payment-api';
import { CreditCard, Wallet } from 'lucide-react';
import axios from 'axios';

interface BookingDetails {
  id: number;
  service_name: string;
  pandit_name: string;
  booking_date: string;
  booking_time: string;
  total_fee: number;
  total_fee_usd: number;
  service_location: string;
  samagri_items: Array<{ name: string; quantity: number; price: number }>;
}

const PaymentPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { toast } = useToast();

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedGateway, setSelectedGateway] = useState<'STRIPE' | 'KHALTI'>('STRIPE');
  const [selectedCurrency, setSelectedCurrency] = useState<'NPR' | 'USD'>('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(0.0075);

  useEffect(() => {
    loadBookingDetails();
    loadExchangeRate();
    autoDetectCurrency();
  }, [bookingId]);

  const autoDetectCurrency = async () => {
    const preferred = await detectPreferredCurrency();
    setSelectedCurrency(preferred);
    setSelectedGateway(preferred === 'NPR' ? 'KHALTI' : 'STRIPE');
  };

  const loadExchangeRate = async () => {
    try {
      const data = await getExchangeRate();
      setExchangeRate(data.rate);
    } catch (err) {
      console.error('Failed to load exchange rate:', err);
    }
  };

  const loadBookingDetails = async () => {
    if (!bookingId || !token) return;

    try {
      const response = await axios.get(
        `http://localhost:8000/api/bookings/${bookingId}/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setBooking(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!bookingId || !token || !booking) return;

    setProcessing(true);
    setError(null);

    try {
      const paymentIntent = await createPayment(
        parseInt(bookingId),
        selectedGateway,
        selectedCurrency,
        token
      );

      if (paymentIntent.success) {
        if (selectedGateway === 'STRIPE' && paymentIntent.checkout_url) {
          // Redirect to Stripe
          window.location.href = paymentIntent.checkout_url;
        } else if (selectedGateway === 'KHALTI' && paymentIntent.payment_url) {
          // Open Khalti popup or redirect
          window.location.href = paymentIntent.payment_url;
          // Alternative: openKhaltiPopup(paymentIntent.payment_url);
        }
      } else {
        throw new Error('Payment initiation failed');
      }
    } catch (err: any) {
      const backendError = err.response?.data?.error || err.message || 'Payment failed';
      setError(backendError);
      toast({
        title: 'Payment Failed',
        description: backendError,
        variant: 'destructive',
      });
      // Store bookingId for retry
      if (bookingId) {
        sessionStorage.setItem('pending_booking_id', bookingId);
      }
      // Redirect to failure page with error message
      navigate('/payment/failure', { state: { error: backendError } });
      setProcessing(false);
    }
  };

  const getAmount = () => {
    if (!booking) return 0;
    return selectedCurrency === 'NPR' ? booking.total_fee : booking.total_fee_usd || booking.total_fee * exchangeRate;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size={40} />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>Booking not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>Review your booking details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{booking.service_name}</h3>
                    <p className="text-sm text-gray-600">Pandit: {booking.pandit_name}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(booking.booking_date).toLocaleDateString()} at {booking.booking_time}
                    </p>
                    <p className="text-sm text-gray-600">Location: {booking.service_location}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(booking.total_fee, 'NPR')}</p>
                    <p className="text-sm text-gray-600">{formatCurrency(booking.total_fee_usd || booking.total_fee * exchangeRate, 'USD')}</p>
                  </div>
                </div>

                {booking.samagri_items && booking.samagri_items.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Samagri Items</h4>
                    {booking.samagri_items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm py-1">
                        <span>{item.name} x {item.quantity}</span>
                        <span>{formatCurrency(item.price, 'NPR')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Currency Toggle */}
            <Card>
              <CardHeader>
                <CardTitle>Select Currency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button
                    variant={selectedCurrency === 'NPR' ? 'default' : 'outline'}
                    onClick={() => {
                      setSelectedCurrency('NPR');
                      setSelectedGateway('KHALTI');
                    }}
                    className="flex-1"
                  >
                    NPR (Nepali Rupees)
                  </Button>
                  <Button
                    variant={selectedCurrency === 'USD' ? 'default' : 'outline'}
                    onClick={() => {
                      setSelectedCurrency('USD');
                      setSelectedGateway('STRIPE');
                    }}
                    className="flex-1"
                  >
                    USD (US Dollars)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Options */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>Choose your payment gateway</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stripe Option */}
                {selectedCurrency === 'USD' && (
                  <button
                    onClick={() => setSelectedGateway('STRIPE')}
                    className={`w-full p-4 border-2 rounded-lg transition-all ${
                      selectedGateway === 'STRIPE'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-6 h-6 text-blue-600" />
                      <div className="text-left">
                        <p className="font-semibold">Stripe</p>
                        <p className="text-xs text-gray-600">International cards</p>
                      </div>
                    </div>
                  </button>
                )}

                {/* Khalti Option */}
                {selectedCurrency === 'NPR' && (
                  <button
                    onClick={() => setSelectedGateway('KHALTI')}
                    className={`w-full p-4 border-2 rounded-lg transition-all ${
                      selectedGateway === 'KHALTI'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Wallet className="w-6 h-6 text-purple-600" />
                      <div className="text-left">
                        <p className="font-semibold">Khalti</p>
                        <p className="text-xs text-gray-600">Nepal's Digital Wallet</p>
                      </div>
                    </div>
                  </button>
                )}

                {/* Total Amount */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold">Total Amount</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(getAmount(), selectedCurrency)}
                    </span>
                  </div>

                  {/* Pay Button */}
                  <Button
                    onClick={handlePayment}
                    disabled={processing}
                    className="w-full h-12 text-base bg-primary hover:bg-primary/90"
                  >
                    {processing ? (
                      <LoadingSpinner size={20} className="text-white" />
                    ) : (
                      `Pay with ${selectedGateway === 'STRIPE' ? 'Stripe' : 'Khalti'}`
                    )}
                  </Button>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Security Note */}
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-gray-600 text-center">
                  🔒 Your payment is secured with industry-standard encryption
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
