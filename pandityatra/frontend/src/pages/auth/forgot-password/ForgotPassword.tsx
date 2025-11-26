import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { requestForgotPasswordOTP } from '../helper';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [usePhone, setUsePhone] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload: any = {};
      if (usePhone) {
        payload.phone_number = phone.trim();
      } else {
        payload.email = email.trim();
      }

      await requestForgotPasswordOTP(payload);
      setSuccess(true);
      
      // Navigate to OTP verification with identifier
      setTimeout(() => {
        navigate('/auth/otp-verification', {
          state: {
            phone_number: usePhone ? phone.trim() : undefined,
            email: usePhone ? undefined : email.trim(),
          },
        });
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
          <CardDescription>
            Enter your phone number or email to receive an OTP
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <Alert>
              <AlertDescription className="text-green-600">
                OTP sent successfully! Redirecting to verification...
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Toggle between phone and email */}
              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  variant={usePhone ? 'default' : 'outline'}
                  onClick={() => {
                    setUsePhone(true);
                    setEmail('');
                    setError(null);
                  }}
                  className="flex-1"
                >
                  Phone
                </Button>
                <Button
                  type="button"
                  variant={!usePhone ? 'default' : 'outline'}
                  onClick={() => {
                    setUsePhone(false);
                    setPhone('');
                    setError(null);
                  }}
                  className="flex-1"
                >
                  Email
                </Button>
              </div>

              {usePhone ? (
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98XXXXXXXX"
                    type="tel"
                    required
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    type="email"
                    required
                  />
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={loading || (usePhone ? !phone : !email)}
                className="w-full"
              >
                {loading ? <LoadingSpinner size={18} /> : 'Send OTP'}
              </Button>

              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-primary hover:underline"
                >
                  Back to Login
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;

