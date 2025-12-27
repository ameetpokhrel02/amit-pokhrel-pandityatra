import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';

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
      if (userRole === 'pandit') {
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Verify OTP</CardTitle>
          <CardDescription>
            Enter the 6-digit OTP sent to {identifier}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginOTPVerification;

