import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { motion } from 'framer-motion';

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

const LoginOTPVerification: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOtp, requestOtp } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phone_number, setPhoneNumber] = useState<string | undefined>(
    location.state?.phone_number
  );
  const [email, setEmail] = useState<string | undefined>(
    location.state?.email
  );
  const [flow, setFlow] = useState<string | undefined>(location.state?.flow);

  // Identifier can be phone or email
  const identifier = phone_number || email;

  useEffect(() => {
    // Redirect if no identifier provided or wrong flow
    if (!identifier || flow !== 'login') {
      navigate('/login');
    }
  }, [identifier, flow, navigate]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const resp = await verifyOtp(identifier!, otp);
      // Redirect based on role
      const userRole = (resp as any)?.role || 'user';
      if (userRole === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (userRole === 'pandit') {
        navigate('/pandit/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError(null);
    setLoading(true);
    try {
      await requestOtp(identifier!);
      setError(null);
      // Show success message briefly
      setTimeout(() => {
        setError(null);
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Verify OTP"
      subtitle={`Enter the 6-digit OTP sent to ${identifier}`}
    >
      <motion.div className="space-y-4" variants={itemVariants}>
        <div className="space-y-2">
          <Label htmlFor="otp" className="text-center block">Enter OTP</Label>
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value) => {
                setOtp(value);
                setError(null);
              }}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleVerify}
          disabled={loading || otp.length !== 6}
          className="w-full"
        >
          {loading ? <LoadingSpinner size={18} /> : 'Verify & Login'}
        </Button>

        <div className="text-center text-sm space-y-2">
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={loading}
            className="text-primary hover:underline block w-full"
          >
            Resend OTP
          </button>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-muted-foreground hover:underline block w-full"
          >
            Back to Login
          </button>
        </div>
      </motion.div>
    </AuthLayout>
  );
};

export default LoginOTPVerification;

