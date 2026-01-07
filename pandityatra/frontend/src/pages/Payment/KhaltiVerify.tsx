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
import { CheckCircle, XCircle } from 'lucide-react';

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
      setTimeout(() => navigate('/payment/cancel'), 2000);
      return;
    }

    // Check if Khalti indicated failure
    if (status === 'failed' || status === 'cancelled') {
      setError('Payment was cancelled');
      setVerifying(false);
      setTimeout(() => navigate('/payment/cancel'), 2000);
      return;
    }

    try {
      const result = await verifyKhaltiPayment(pidx, token);
      
      if (result.success) {
        setSuccess(true);
        
        // Store booking ID for success page
        sessionStorage.setItem('pending_booking_id', result.booking_id.toString());
        
        toast({
          title: 'Payment Successful!',
          description: 'Your puja booking has been confirmed',
          variant: 'default',
        });
        
        // Redirect to success page
        setTimeout(() => {
          navigate('/payment/success');
        }, 1500);
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Verification failed');
      toast({
        title: 'Verification Failed',
        description: 'Could not verify your payment',
        variant: 'destructive',
      });
      
      setTimeout(() => navigate('/payment/cancel'), 2000);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-6 px-6">
          <div className="text-center space-y-6">
            {verifying && (
              <>
                <LoadingSpinner size={60} className="mx-auto text-purple-600" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Verifying Payment
                  </h2>
                  <p className="text-gray-600">
                    Please wait while we confirm your Khalti payment...
                  </p>
                </div>
              </>
            )}

            {!verifying && success && (
              <>
                <div className="flex justify-center">
                  <div className="rounded-full bg-green-100 p-4">
                    <CheckCircle className="w-16 h-16 text-green-600" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Payment Verified!
                  </h2>
                  <p className="text-gray-600">
                    Redirecting to confirmation page...
                  </p>
                </div>
              </>
            )}

            {!verifying && error && (
              <>
                <div className="flex justify-center">
                  <div className="rounded-full bg-red-100 p-4">
                    <XCircle className="w-16 h-16 text-red-600" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Verification Failed
                  </h2>
                  <p className="text-gray-600">{error}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Redirecting to payment page...
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KhaltiVerify;
