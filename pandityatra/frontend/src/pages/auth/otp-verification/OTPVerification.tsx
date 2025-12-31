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

const OTPVerificationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyResetOtp, loginWithOtp } = useAuth();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Verify OTP"
      subtitle={`Enter the code sent to ${identifier}`}
    >
      <div className="space-y-6 flex flex-col items-center">
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

        <div className="text-center text-sm text-gray-500">
          Didn't receive code?{' '}
          <button className="font-bold text-primary hover:underline">
            Resend
          </button>
        </div>
      </div>
    </AuthLayout>
  );
};

export default OTPVerificationPage;
