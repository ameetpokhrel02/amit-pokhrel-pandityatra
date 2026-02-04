import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { FaUser, FaUserTie, FaPhone, FaEnvelope, FaLock, FaArrowRight } from 'react-icons/fa';
import { Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { GoogleLogin } from '@react-oauth/google';

const RegisterPage: React.FC = () => {
  const { register, googleLogin, token } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [role, setRole] = useState<'user' | 'pandit' | ''>('');

  // Form fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [token, navigate]);

  // Auto-redirect for Pandit
  useEffect(() => {
    if (role === 'pandit') {
      navigate('/pandit/register', { replace: true });
    }
  }, [role, navigate]);

  const handleRegister = async () => {
    setError(null);
    setLoading(true);
    try {
      const payload: any = {
        full_name: fullName.trim(),
        email: email.trim(),
        role: 'user',
      };
      if (phone.trim()) payload.phone_number = phone.trim();
      if (password.trim()) payload.password = password.trim();

      await register(payload);

      toast({
        title: "Account Created!",
        description: password ? "You can now login with your password." : "OTP sent to your email.",
        variant: "default",
      });

      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={role === 'user' ? "Create Account" : "Join PanditYatra"}
      subtitle={role === 'user' ? "Fill in your details below" : "Choose how you want to register"}
    >
      <motion.div className="space-y-5">

        {/* Role Selection (Always visible) */}
        <div className="space-y-2">
          <Label className="text-gray-700 font-medium">I want to register as:</Label>
          <Select value={role} onValueChange={(value: 'user' | 'pandit') => setRole(value)}>
            <SelectTrigger className="w-full h-12 rounded-xl bg-gray-50/50 border-orange-100 focus:ring-orange-500">
              <SelectValue placeholder="Select your role..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">
                <div className="flex items-center gap-2">
                  <FaUser className="w-4 h-4 text-blue-500" />
                  <span>Customer / User</span>
                </div>
              </SelectItem>
              <SelectItem value="pandit">
                <div className="flex items-center gap-2">
                  <FaUserTie className="w-4 h-4 text-orange-500" />
                  <span>Pandit / Priest</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* User Registration Form (Shows when 'user' is selected) */}
        <AnimatePresence>
          {role === 'user' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 overflow-hidden"
            >
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-gray-600 font-semibold px-1">Full Name *</Label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                    <FaUser className="w-4 h-4" />
                  </span>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="h-14 rounded-2xl bg-gray-100/50 border-transparent focus:bg-white focus:ring-orange-500/20 focus:border-orange-200 pl-12 text-base transition-all"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-600 font-semibold px-1">Email Address *</Label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                    <FaEnvelope className="w-4 h-4" />
                  </span>
                  <Input
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    type="email"
                    className="h-14 rounded-2xl bg-gray-100/50 border-transparent focus:bg-white focus:ring-orange-500/20 focus:border-orange-200 pl-12 text-base transition-all"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-600 font-semibold px-1">Phone Number (Optional)</Label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                    <FaPhone className="w-4 h-4" />
                  </span>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98XXXXXXXX"
                    type="tel"
                    className="h-14 rounded-2xl bg-gray-100/50 border-transparent focus:bg-white focus:ring-orange-500/20 focus:border-orange-200 pl-12 text-base transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-600 font-semibold px-1">Password (Optional)</Label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                    <FaLock className="w-4 h-4" />
                  </span>
                  <Input
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    type={showPassword ? 'text' : 'password'}
                    className="h-14 rounded-2xl bg-gray-100/50 border-transparent focus:bg-white focus:ring-orange-500/20 focus:border-orange-200 pl-12 pr-12 text-base transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 px-1">Leave blank to use OTP login only.</p>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleRegister}
                disabled={loading || !email || !fullName}
                className="w-full h-14 text-lg font-bold rounded-full bg-[#F97316] hover:bg-[#EA580C] text-white shadow-xl shadow-orange-200/50 transition-all active:scale-[0.98] border-none mt-4"
              >
                {loading ? <LoadingSpinner size={24} className="text-white" /> : (
                  <div className="flex items-center gap-2">
                    Join PanditYatra <FaArrowRight size={14} />
                  </div>
                )}
              </Button>

              {error && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hint when no role selected */}
        {!role && (
          <p className="text-center text-sm text-gray-500 py-4">
            Select a role above to continue.
          </p>
        )}

        {/* Google Login Section */}
        <div className="flex flex-col items-center gap-4 pt-2">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Or Continue With</p>
          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                if (credentialResponse.credential) {
                  setLoading(true);
                  try {
                    await googleLogin(credentialResponse.credential);
                    toast({
                      title: "Success!",
                      description: "Your account is ready. Redirecting...",
                    });
                  } catch (err: any) {
                    setError(err.message || "Google registration failed");
                  } finally {
                    setLoading(false);
                  }
                }
              }}
              onError={() => {
                setError("Google authentication failed. Please try again.");
              }}
              theme="outline"
              shape="pill"
              size="large"
              width="100%"
              text="signup_with"
            />
          </div>
        </div>

        {/* Back to Login */}
        <div className="pt-8 text-center border-t border-gray-100 mt-4">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-orange-600 hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </motion.div>
    </AuthLayout>
  );
};

export default RegisterPage;
