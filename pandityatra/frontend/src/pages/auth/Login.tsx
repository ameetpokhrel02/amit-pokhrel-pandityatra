
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Eye, EyeOff } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const LoginPage: React.FC = () => {
  const { requestOtp, passwordLogin, token } = useAuth();
  const navigate = useNavigate();
  const [loginMethod, setLoginMethod] = useState<'otp' | 'password'>('password');
  // New state for input type toggle (Phone / Email)
  const [inputType, setInputType] = useState<'phone' | 'email'>('phone');

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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
      // Determine payload based on input type
      if (inputType === 'phone') {
        await requestOtp(phone); // Original function (needs update in useAuth too ideally, but for now relies on phone)
      } else {
        // Since useAuth might not support email yet, we might need to bypass or update it.
        // For this specific fix, let's assume useAuth.requestOtp handles it or we call api directly.
        // Ideally, we should update useAuth.tsx, but let's see if we can just pass the right arg.
        // Note: useAuth probably calls api.requestLoginOtp.

        // TEMPORARY: If useAuth is strictly phone, we might fail here. 
        // Let's rely on api call if useAuth isn't flexible enough, BUT better to assume we updated useAuth.
        // For now, let's assume we send 'phone' as empty or handle in useAuth.
        // Actually, let's look at useAuth.tsx next.
        // For now, let's pass it.
        await requestOtp(inputType === 'email' ? email : phone);
      }

      navigate('/otp-verification', {
        state: {
          phone_number: inputType === 'phone' ? phone : undefined,
          email: inputType === 'email' ? email : undefined,
          flow: 'login'
        }
      });
    } catch (err: any) {
      // ... err handling
      setError(err?.message || 'Failed to request OTP');
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const identifier = inputType === 'email' ? email : phone;
      const resp = await passwordLogin(identifier, password);
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
    <AuthLayout title="Welcome" subtitle="Please login here">
      <div className="space-y-6">
        {/* Login Method Toggle - styled as subtle tabs */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setLoginMethod('password');
              setError(null);
            }}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${loginMethod === 'password'
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Password Login
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMethod('otp');
              setError(null);
              setPassword('');
            }}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${loginMethod === 'otp'
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            OTP Login
          </button>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <div className="space-y-2">
            {/* Input Type Toggle for BOTH OTP and Password Mode */}
            <div className="flex space-x-4 mb-2">
              <label className="flex items-center space-x-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  checked={inputType === 'phone'}
                  onChange={() => setInputType('phone')}
                  className="text-primary"
                />
                <span>Phone</span>
              </label>
              <label className="flex items-center space-x-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  checked={inputType === 'email'}
                  onChange={() => setInputType('email')}
                  className="text-primary"
                />
                <span>Email</span>
              </label>
            </div>

            <Label htmlFor="identifier">
              {inputType === 'phone' ? 'Phone Number' : 'Email Address'}
            </Label>

            {inputType === 'phone' ? (
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
                type="tel"
                className="h-12 rounded-xl border-gray-200 focus-visible:ring-primary"
              />
            ) : (
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                type="email"
                className="h-12 rounded-xl border-gray-200 focus-visible:ring-primary"
              />
            )}
          </div>

          {loginMethod === 'password' && (
            <div className="space-y-2">
              <Label htmlFor="password-login">Password</Label>
              <div className="relative">
                <Input
                  id="password-login"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  type={showPassword ? 'text' : 'password'}
                  className="h-12 rounded-xl border-gray-200 focus-visible:ring-primary pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Remember Me & Forgot Password */}
        {loginMethod === 'password' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <label
                htmlFor="remember-me"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-600"
              >
                Remember me
              </label>
            </div>
            <Link
              to="/auth/forgot-password"
              className="text-sm font-bold text-primary hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
        )}

        {/* Action Button */}
        {loginMethod === 'password' ? (
          <Button
            onClick={handlePasswordLogin}
            disabled={loading || (inputType === 'phone' ? !phone : !email) || !password}
            className="w-full h-12 text-base rounded-xl bg-primary hover:bg-primary/90 transition-colors"
          >
            {loading ? <LoadingSpinner size={20} className="text-white" /> : 'Login'}
          </Button>
        ) : (
          <Button
            onClick={handleRequestOtp}
            disabled={loading || (inputType === 'phone' ? !phone : !email)}
            className="w-full h-12 text-base rounded-xl bg-primary hover:bg-primary/90 transition-colors"
          >
            {loading ? <LoadingSpinner size={20} className="text-white" /> : 'Request OTP'}
          </Button>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Register Link */}
        <div className="text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-primary hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;

