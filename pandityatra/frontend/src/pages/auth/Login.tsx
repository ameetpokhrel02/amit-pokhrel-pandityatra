import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';

const LoginPage: React.FC = () => {
  const { requestOtp, passwordLogin, token } = useAuth();
  const navigate = useNavigate();
  const [loginMethod, setLoginMethod] = useState<'otp' | 'password'>('otp');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [token, navigate]);

  const handleRequestOtp = async () => {
    setError(null);
    setLoading(true);
    try {
      await requestOtp(phone);
      // Redirect to OTP verification page
      navigate('/otp-verification', {
        state: { phone_number: phone, flow: 'login' }
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to request OTP');
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const resp = await passwordLogin(phone, password);
      // Redirect based on role
      const userRole = (resp as any)?.role || 'user';
      if (userRole === 'pandit') {
        navigate('/pandit/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>
            {loginMethod === 'otp' && 'Enter your phone number to receive an OTP'}
            {loginMethod === 'password' && 'Enter your phone number and password'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Login Method Toggle */}
          <div className="flex gap-2 mb-4">
            <Button
              type="button"
              variant={loginMethod === 'otp' ? 'default' : 'outline'}
              onClick={() => {
                setLoginMethod('otp');
                setError(null);
                setPassword('');
              }}
              className="flex-1"
            >
              Login with OTP
            </Button>
            <Button
              type="button"
              variant={loginMethod === 'password' ? 'default' : 'outline'}
              onClick={() => {
                setLoginMethod('password');
                setError(null);
              }}
              className="flex-1"
            >
              Login with Password
            </Button>
          </div>

          {/* OTP Login Flow */}
          {loginMethod === 'otp' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  type="tel"
                />
              </div>
              <Button 
                onClick={handleRequestOtp} 
                disabled={loading || !phone}
                className="w-full"
              >
                {loading ? <LoadingSpinner size={18} /> : 'Request OTP'}
              </Button>
            </div>
          )}

          {/* Password Login */}
          {loginMethod === 'password' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone-password">Phone Number</Label>
                <Input
                  id="phone-password"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  type="tel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-login">Password</Label>
                <Input
                  id="password-login"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  type="password"
                />
              </div>
              <Button 
                onClick={handlePasswordLogin} 
                disabled={loading || !phone || !password}
                className="w-full"
              >
                {loading ? <LoadingSpinner size={18} /> : 'Login'}
              </Button>
            </div>
          )}


          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2 text-center text-sm text-muted-foreground mt-4">
            <div>
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline">
                Register here
              </Link>
            </div>
            <div>
              <Link to="/auth/forgot-password" className="text-primary hover:underline">
                Forgot Password?
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;

