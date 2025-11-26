import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { verifyForgotPasswordOTP } from '../helper';

const OTPVerification: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phone_number, setPhoneNumber] = useState<string | undefined>(
    location.state?.phone_number
  );
  const [email, setEmail] = useState<string | undefined>(location.state?.email);

  useEffect(() => {
    // Redirect if no identifier provided
    if (!phone_number && !email) {
      navigate('/auth/forgot-password');
    }
  }, [phone_number, email, navigate]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const payload: any = { otp_code: otp };
      if (phone_number) {
        payload.phone_number = phone_number;
      } else if (email) {
        payload.email = email;
      }

      await verifyForgotPasswordOTP(payload);
      
      // Navigate to change password page
      navigate('/auth/change-password', {
        state: {
          phone_number,
          email,
          otp_code: otp,
        },
      });
    } catch (err: any) {
      setError(err?.message || 'OTP verification failed');
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
            Enter the 6-digit OTP sent to {phone_number || email}
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
            {loading ? <LoadingSpinner size={18} /> : 'Verify OTP'}
          </Button>

          <div className="text-center text-sm">
            <button
              type="button"
              onClick={() => navigate('/auth/forgot-password')}
              className="text-primary hover:underline"
            >
              Resend OTP
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OTPVerification;

