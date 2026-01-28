import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

const OTPVerificationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyResetOtp, loginWithOtp, requestOtp } = useAuth();
  const { toast } = useToast();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  const { phone_number, email, flow } = location.state || {}; // flow: 'login' | 'reset_password'
  const identifier = phone_number || email;

  useEffect(() => {
    if (!identifier) {
      navigate('/login');
    }
  }, [identifier, navigate]);

  const handleVerify = async () => {
    setError(null);
    setLoading(true);
    try {
      if (flow === 'login') {
        const resp = await loginWithOtp(identifier, otp);
        const userRole = (resp as any)?.role || 'user';
        if (userRole === 'pandit') {
          navigate('/pandit/dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        // flow === 'reset_password' or other
        await verifyResetOtp(identifier, otp);
        navigate('/auth/change-password', {
          state: { phone_number, email, otp } // Pass both or identifier
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError(null);
    setResendSuccess(null);
    setResendLoading(true);
    try {
      await requestOtp(identifier);
      setResendSuccess('A new verification code has been sent.');
      toast({
        title: 'OTP Resent!',
        description: 'A new verification code has been sent.',
        variant: 'default',
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Verify OTP"
      subtitle={`Enter the code sent to ${identifier}`}
    >
      <motion.div className="space-y-6 flex flex-col items-center" variants={itemVariants}>
        <InputOTP
          maxLength={6}
          value={otp}
          onChange={(value) => setOtp(value)}
        >
          <InputOTPGroup className="gap-2">
            <InputOTPSlot index={0} className="w-10 h-12 rounded-lg border-gray-300" />
            <InputOTPSlot index={1} className="w-10 h-12 rounded-lg border-gray-300" />
            <InputOTPSlot index={2} className="w-10 h-12 rounded-lg border-gray-300" />
            <InputOTPSlot index={3} className="w-10 h-12 rounded-lg border-gray-300" />
            <InputOTPSlot index={4} className="w-10 h-12 rounded-lg border-gray-300" />
            <InputOTPSlot index={5} className="w-10 h-12 rounded-lg border-gray-300" />
          </InputOTPGroup>
        </InputOTP>

        <Button
          onClick={handleVerify}
          disabled={loading || otp.length < 6}
          className="w-full h-12 text-base rounded-xl bg-primary hover:bg-primary/90 transition-colors"
        >
          {loading ? <LoadingSpinner size={20} className="text-white" /> : 'Verify'}
        </Button>

        {error && (
          <Alert variant="destructive" className="w-full">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {resendSuccess && (
          <Alert variant="success" className="w-full">
            <AlertDescription>{resendSuccess}</AlertDescription>
          </Alert>
        )}

        <div className="text-center text-sm text-gray-500">
          Didn't receive code?{' '}
          <button
            className="font-bold text-primary hover:underline disabled:opacity-60"
            onClick={handleResendOTP}
            disabled={resendLoading}
          >
            {resendLoading ? 'Resending...' : 'Resend'}
          </button>
        </div>
      </motion.div>
    </AuthLayout>
  );
};

export default OTPVerificationPage;
