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

const RegisterPage: React.FC = () => {
  const { register, token } = useAuth();
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
        phone_number: phone.trim(),
        role: 'user',
      };
      if (email.trim()) payload.email = email.trim();
      if (password.trim()) payload.password = password.trim();

      await register(payload);

      toast({
        title: "Account Created!",
        description: password ? "You can now login with your password." : "OTP sent to your phone.",
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
              <div className="space-y-1">
                <Label htmlFor="fullName">Full Name *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <FaUser className="w-4 h-4" />
                  </span>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="h-11 rounded-xl bg-gray-50/50 border-orange-100 focus-visible:ring-orange-500 pl-10"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <Label htmlFor="phone">Phone Number *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <FaPhone className="w-4 h-4" />
                  </span>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98XXXXXXXX"
                    type="tel"
                    className="h-11 rounded-xl bg-gray-50/50 border-orange-100 focus-visible:ring-orange-500 pl-10"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <Label htmlFor="email">Email (Optional)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <FaEnvelope className="w-4 h-4" />
                  </span>
                  <Input
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    type="email"
                    className="h-11 rounded-xl bg-gray-50/50 border-orange-100 focus-visible:ring-orange-500 pl-10"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <Label htmlFor="password">Password (Optional)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <FaLock className="w-4 h-4" />
                  </span>
                  <Input
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    type={showPassword ? 'text' : 'password'}
                    className="h-11 rounded-xl bg-gray-50/50 border-orange-100 focus-visible:ring-orange-500 pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">Leave blank to use OTP login only.</p>
              </div>

              {/* Submit */}
              <Button
                onClick={handleRegister}
                disabled={loading || !phone || !fullName}
                className="w-full h-12 text-base rounded-xl bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-500/20"
              >
                {loading ? <LoadingSpinner size={20} className="text-white" /> : (
                  <div className="flex items-center gap-2">
                    Create Account <FaArrowRight size={14} />
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

        {/* Back to Login */}
        <div className="pt-4 text-center border-t border-gray-100">
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
