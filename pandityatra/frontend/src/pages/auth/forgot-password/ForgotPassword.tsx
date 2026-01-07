import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { motion } from 'framer-motion';
import { FaPhone, FaEnvelope } from 'react-icons/fa';
import { useToast } from '@/hooks/use-toast';

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

const ForgotPasswordPage: React.FC = () => {
  const { requestResetOtp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [inputType, setInputType] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestOtp = async () => {
    setError(null);
    setLoading(true);
    try {

      // Call requestResetOtp with correct payload (it sends {phone_number: ...})
      // But we need to support email too. useAuth calls helper.requestForgotPasswordOTP({phone_number: phone})
      // We need to update useAuth logic OR call helper directly here.
      // Easiest is to update useAuth to be flexible like requestOtp.
      // But for now, let's call requestResetOtp signature (which accepts phone string currently).
      // We updated useAuth to accept identifier (phone string), but the implementation calls {phone_number: ...}
      // Let's rely on useAuth update (which we will do next step).
      await requestResetOtp(inputType === 'email' ? email : phone);

      toast({
        title: 'OTP Sent! ',
        description: 'Please check your messages for the verification code.',
        variant: 'default',
      });

      navigate('/auth/otp-verification', {
        state: {
          phone_number: inputType === 'phone' ? phone : undefined,
          email: inputType === 'email' ? email : undefined,
          flow: 'reset_password'
        }
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to request OTP');
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="Enter your details to reset password"
    >
      <motion.div className="space-y-4" variants={itemVariants}>
        {/* Toggle */}
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

        <div className="space-y-2">
          <Label htmlFor="identifier">
            {inputType === 'phone' ? 'Phone Number' : 'Email Address'}
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
                className="h-12 rounded-xl border-gray-200 focus-visible:ring-primary pl-10"
              />
            </div>
          ) : (
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
                className="h-12 rounded-xl border-gray-200 focus-visible:ring-primary pl-10"
              />
            </div>
          )}
        </div>

        <Button
          onClick={handleRequestOtp}
          disabled={loading || (inputType === 'phone' ? !phone : !email)}
          className="w-full h-12 text-base rounded-xl bg-primary hover:bg-primary/90 transition-colors"
        >
          {loading ? <LoadingSpinner size={20} className="text-white" /> : 'Request OTP'}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="text-center text-sm text-gray-500 mt-4">
          Remember your password?{' '}
          <Link to="/login" className="font-bold text-primary hover:underline">
            Login here
          </Link>
        </div>
      </motion.div>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;

