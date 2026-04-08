/**
 * Shop eSewa Payment Verification Page
 * Handles redirect from eSewa after shop payment
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/useCart';
import apiClient, { publicApi } from '@/lib/api-client';
import { CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ShopEsewaVerify: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { clear } = useCart();
  const [searchParams] = useSearchParams();

  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    let data = searchParams.get('data');
    let orderId = searchParams.get('order_id');

    // Handle eSewa's weird URL string combinations. Sometimes it appends ?data= instead of &data=
    if (!data) {
      const searchStr = window.location.search;
      const dataMatch = searchStr.match(/[?&]data=([^&]+)/);
      if (dataMatch) {
         data = dataMatch[1];
      }
    }
    
    if (!data && orderId && orderId.includes('?data=')) {
      const parts = orderId.split('?data=');
      orderId = parts[0];
      data = parts[1];
    }

    if (!data) {
      console.error("Full URL search string:", window.location.search);
      setError(`Invalid parameters. Received: ${window.location.search}`);
      setVerifying(false);
      setTimeout(() => navigate('/shop/payment/cancel'), 5000);
      return;
    }

    try {
      const verifyUrl = orderId
        ? `/payments/esewa/verify/?data=${encodeURIComponent(data)}&order_id=${encodeURIComponent(orderId)}`
        : `/payments/esewa/verify/?data=${encodeURIComponent(data)}`;
      const result = await publicApi.get(verifyUrl);

      if (result.data.success && result.data.type === 'SHOP_ORDER') {
        setSuccess(true);
        setVerifying(false);
        
        // Clear the cart
        clear();

        // Store details for success page
        sessionStorage.setItem('last_payment_method', result.data.payment_method || 'ESEWA');
        sessionStorage.setItem('last_transaction_id', result.data.transaction_id || '');

        toast({
          title: 'Payment Verified!',
          description: 'Your order has been placed successfully.',
          variant: 'default',
        });

        // Redirect to success page
        setTimeout(() => {
          navigate(`/shop/payment/success?order_id=${result.data.order_id}`);
        }, 1500);
      } else {
        throw new Error('Payment verification returned failure status.');
      }
    } catch (err: any) {
      console.error("Verification Error:", err);
      setError(err.response?.data?.error || err.message || 'Verification failed. Please contact support.');
      toast({
        title: 'Verification Failed',
        description: 'Could not verify your payment.',
        variant: 'destructive',
      });
      setVerifying(false);
      setTimeout(() => navigate('/shop/payment/cancel'), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#60BB46]/10 to-green-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl">
          <div className={`h-1.5 w-full ${success ? 'bg-green-500' : error ? 'bg-red-500' : 'bg-[#60BB46] animate-pulse'}`} />
          <CardContent className="pt-12 pb-12 px-8 text-center space-y-6">

            <AnimatePresence mode="wait">
              {verifying && (
                <motion.div
                  key="verifying"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center gap-6"
                >
                  <div className="w-20 h-20 rounded-full bg-[#60BB46]/10 flex items-center justify-center">
                    <img 
                      src="/images/esewa.jpg" 
                      alt="eSewa" 
                      className="w-14 h-14 object-contain rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-gray-800">Verifying Payment</h2>
                    <p className="text-gray-500 text-sm">Please wait while we confirm your eSewa payment...</p>
                  </div>
                  <LoadingSpinner size={32} className="text-[#60BB46]" />
                </motion.div>
              )}

              {success && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', duration: 0.5 }}
                    className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center"
                  >
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </motion.div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-green-700">Payment Successful!</h2>
                    <p className="text-gray-500 text-sm">Your order has been placed.</p>
                    <p className="text-gray-400 text-xs">Redirecting to confirmation...</p>
                  </div>
                </motion.div>
              )}

              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', duration: 0.5 }}
                    className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center"
                  >
                    <XCircle className="w-12 h-12 text-red-600" />
                  </motion.div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-red-700">Verification Failed</h2>
                    <p className="text-gray-500 text-sm">{error}</p>
                    <p className="text-gray-400 text-xs">Redirecting...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* eSewa branding */}
            <div className="pt-6 border-t">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <span>Powered by</span>
                <img 
                  src="/images/esewa.jpg" 
                  alt="eSewa" 
                  className="h-6 object-contain rounded"
                />
              </div>
            </div>

          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ShopEsewaVerify;
