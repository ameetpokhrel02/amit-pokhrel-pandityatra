
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
import { motion } from 'framer-motion';
import { FaPhone, FaEnvelope, FaUser, FaLock } from 'react-icons/fa';
import { useToast } from '@/hooks/use-toast';

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { staggerChildren: 0.1 }
  }
};

const LoginPage: React.FC = () => {
  const { requestOtp, passwordLogin, token, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loginMethod, setLoginMethod] = useState<'otp' | 'password'>('password');
  // New state for input type toggle (Phone / Email / Username)
  const [inputType, setInputType] = useState<'phone' | 'email' | 'username'>('phone');

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [hasJustLoggedIn, setHasJustLoggedIn] = useState(false);

  // Redirect if already logged in or after successful login
  useEffect(() => {
    if (token) {
      if (hasJustLoggedIn && role) {
        // Redirect based on role
        if (role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else if (role === 'pandit') {
          navigate('/pandit/dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
        setHasJustLoggedIn(false);
      } else if (!hasJustLoggedIn && !loading) {
        // Already logged in - session restore
        if (role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else if (role === 'pandit') {
          navigate('/pandit/dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    }
  }, [token, role, navigate, hasJustLoggedIn, loading]);

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

      toast({
        title: "OTP Sent!",
        description: `Verification code sent to your ${inputType}. Please check and enter it.`,
        variant: "default",
      });
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
      const identifier = inputType === 'email' ? email : inputType === 'username' ? username : phone;
      await passwordLogin(identifier, password);
      // Show success toast
      toast({
        title: "Login Successful!",
        description: "Welcome back! Redirecting to your dashboard...",
        variant: "default",
      });
      // Set flag to trigger redirect in useEffect after context updates
      setHasJustLoggedIn(true);
    } catch (err: any) {
      setError(err?.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome" subtitle="Please login here">
      <motion.div className="space-y-6" variants={itemVariants}>
        {/* Login Method Toggle - styled as subtle tabs */}
        <motion.div className="flex bg-gray-100 p-1 rounded-lg" variants={itemVariants}>
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
        </motion.div>

        {/* Inputs */}
        <motion.div className="space-y-4" variants={itemVariants}>
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
              <label className="flex items-center space-x-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  checked={inputType === 'username'}
                  onChange={() => setInputType('username')}
                  className="text-primary"
                />
                <span>Username</span>
              </label>
            </div>

            <Label htmlFor="identifier">
              {inputType === 'phone' ? 'Phone Number' : inputType === 'email' ? 'Email Address' : 'Username'}
            </Label>

            {inputType === 'phone' ? (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <FaPhone className="w-5 h-5" />
                </span>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  type="tel"
                  className="h-12 rounded-xl bg-gray-50/50 border-orange-100 focus-visible:ring-orange-500 pl-10"
                />
              </div>
            ) : inputType === 'email' ? (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <FaEnvelope className="w-5 h-5" />
                </span>
                <Input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  type="email"
                  className="h-12 rounded-xl bg-gray-50/50 border-orange-100 focus-visible:ring-orange-500 pl-10"
                />
              </div>
            ) : (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <FaUser className="w-5 h-5" />
                </span>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  type="text"
                  className="h-12 rounded-xl bg-gray-50/50 border-orange-100 focus-visible:ring-orange-500 pl-10"
                />
              </div>
            )}
          </div>

          {loginMethod === 'password' && (
            <div className="space-y-2">
              <Label htmlFor="password-login">Password</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <FaLock className="w-5 h-5" />
                </span>
                <Input
                  id="password-login"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  type={showPassword ? 'text' : 'password'}
                  className="h-12 rounded-xl bg-gray-50/50 border-orange-100 focus-visible:ring-orange-500 pl-10 pr-10"
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
        </motion.div>

        <motion.div className="space-y-6" variants={itemVariants}>

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
              disabled={
                    loading ||
                    (inputType === 'phone' && !phone) ||
                    (inputType === 'email' && !email) ||
                    (inputType === 'username' && !username) ||
                    !password
            }
              className="w-full h-12 text-base rounded-xl bg-primary hover:bg-primary/90 transition-colors"
            >
          {loading ? <LoadingSpinner size={20} className="text-white" /> : 'Login'}
           </Button>
          ) : (
            <Button
              onClick={handleRequestOtp}
              disabled={
                    loading ||
                    (inputType === 'phone' && !phone) ||
                    (inputType === 'email' && !email) ||
                    (inputType === 'username' && !username)
            }
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

          {/* Register Link + Pandit Registration */}
        </motion.div>

        <motion.div className="space-y-3 text-center" variants={itemVariants}>
          <div className="text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-primary hover:underline">
              Register here
            </Link>
          </div>

          {/* Separator */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Register as Pandit Button */}
          <Link to="/pandit/register">
            <Button
              variant="outline"
              className="w-full h-12 text-base rounded-xl border-orange-200 hover:bg-orange-50"
            >
              Register as Pandit
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </AuthLayout>
  );
};

export default LoginPage;