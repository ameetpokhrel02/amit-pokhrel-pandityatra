/**
 * Khalti Payment Verification Page
 * Handles redirect from Khalti after payment
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { verifyKhaltiPayment } from '@/lib/payment-api';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const KhaltiVerify: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    const pidx = searchParams.get('pidx');
    const status = searchParams.get('status');

    if (!pidx || !token) {
      setError('Invalid payment parameters');
      setVerifying(false);
      setTimeout(() => navigate('/payment/cancel'), 3000);
      return;
    }

    // Check if Khalti indicated failure
    if (status === 'failed' || status === 'cancelled') {
      setError('Payment was cancelled or failed at Khalti.');
      setVerifying(false);
      setTimeout(() => navigate('/payment/cancel'), 3000);
      return;
    }

    try {
      const result = await verifyKhaltiPayment(pidx, token);

      if (result.success) {
        setSuccess(true);
        setVerifying(false);

        // Store booking ID for success page
        sessionStorage.setItem('pending_booking_id', result.booking_id.toString());

        toast({
          title: 'Payment Verified!',
          description: 'Redirecting to confirmation...',
          variant: 'default',
        });

        // Redirect to success page
        setTimeout(() => {
          navigate(`/payment/success/${result.booking_id}`);
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
      setTimeout(() => navigate('/payment/cancel'), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50/30 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl">
          <div className={`h-1.5 w-full ${success ? 'bg-green-500' : error ? 'bg-red-500' : 'bg-purple-500 animate-pulse'}`} />
          <CardContent className="pt-12 pb-12 px-8 text-center space-y-6">

            <AnimatePresence mode="wait">
              {verifying && (
                <motion.div
                  key="verifying"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="space-y-6"
                >
                  <LoadingSpinner size={64} className="mx-auto text-purple-600" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Verifying Payment</h2>
                    <p className="text-gray-500 mt-2">Connecting to Khalti...</p>
                  </div>
                </motion.div>
              )}

              {!verifying && success && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  <div className="flex justify-center">
                    <div className="rounded-full bg-green-100 p-5">
                      <CheckCircle className="w-16 h-16 text-green-600" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Payment Verified!</h2>
                    <p className="text-gray-500 mt-2">Redirecting you to the confirmation page...</p>
                  </div>
                </motion.div>
              )}

              {!verifying && error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  <div className="flex justify-center">
                    <div className="rounded-full bg-red-100 p-5">
                      <XCircle className="w-16 h-16 text-red-600" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Verification Failed</h2>
                    <p className="text-red-500 mt-2 font-medium bg-red-50 p-3 rounded-lg border border-red-100 text-sm">
                      {error}
                    </p>
                    <p className="text-gray-400 text-sm mt-4">Redirecting back...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default KhaltiVerify;
