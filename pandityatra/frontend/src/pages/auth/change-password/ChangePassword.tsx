import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { FaLock } from 'react-icons/fa';
import { useToast } from '@/hooks/use-toast';

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

const ChangePasswordPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePassword = (pass: string) => {
    if (!pass) return { score: 0, met: [] };
    const requirements = [
      { id: 'length', text: 'Min 8 characters', test: (p: string) => p.length >= 8 },
      { id: 'upper', text: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
      { id: 'lower', text: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
      { id: 'number', text: 'One number', test: (p: string) => /[0-9]/.test(p) },
      { id: 'special', text: 'One special character', test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
    ];
    const met = requirements.filter(r => r.test(pass)).map(r => r.id);
    return { score: met.length, met };
  };

  const passwordInfo = validatePassword(newPassword);

  const { phone_number, email, otp } = location.state || {};
  const identifier = phone_number || email;

  useEffect(() => {
    if (!identifier || !otp) {
      navigate('/login');
    }
  }, [identifier, otp, navigate]);

  const handleSubmit = async () => {
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(identifier, otp, newPassword);
            toast({
              title: "Password Changed Successfully!",
              description: "Your password has been updated. Redirecting to login...",
              variant: "default",
            });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout title="Password Reset" subtitle="Success">
        <div className="text-center space-y-4">
          <Alert className="bg-green-50 text-green-800 border-green-200">
            <AlertDescription>
              Password has been reset successfully. Redirecting to login...
            </AlertDescription>
          </Alert>
          <LoadingSpinner size={24} className="mx-auto text-primary" />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Set New Password"
      subtitle="Create a new strong password"
    >
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <motion.div className="space-y-4" variants={itemVariants}>
        <div className="space-y-2">
          <Label htmlFor="new-password">New Password</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              <FaLock className="w-5 h-5" />
            </span>
            <Input
              id="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              type={showPassword ? 'text' : 'password'}
              className="h-12 rounded-xl border-gray-200 focus-visible:ring-primary pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          
          {newPassword && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Strength</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  passwordInfo.score <= 2 ? 'bg-red-100 text-red-600' : 
                  passwordInfo.score <= 4 ? 'bg-orange-100 text-orange-600' : 
                  'bg-green-100 text-green-600'
                }`}>
                  {passwordInfo.score <= 2 ? 'Weak' : passwordInfo.score <= 4 ? 'Medium' : 'Strong'}
                </span>
              </div>
              
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <div key={lvl} className={`h-1.5 rounded-full transition-all duration-500 ${
                    lvl <= passwordInfo.score ? (
                      passwordInfo.score <= 2 ? 'bg-red-500' : 
                      passwordInfo.score <= 4 ? 'bg-orange-500' : 
                      'bg-green-500'
                    ) : 'bg-gray-200'
                  }`} />
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 pt-1">
                {[
                  { id: 'length', text: '8+ Characters' },
                  { id: 'upper', text: 'Uppercase' },
                  { id: 'lower', text: 'Lowercase' },
                  { id: 'number', text: 'Number' },
                  { id: 'special', text: 'Special Char' },
                ].map((req) => (
                  <div key={req.id} className="flex items-center gap-2">
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors ${
                      passwordInfo.met.includes(req.id) ? 'bg-green-500' : 'bg-gray-200'
                    }`}>
                      {passwordInfo.met.includes(req.id) && <span className="text-[10px] text-white">✓</span>}
                    </div>
                    <span className={`text-[11px] font-medium ${
                      passwordInfo.met.includes(req.id) ? 'text-gray-700' : 'text-gray-400'
                    }`}>{req.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              <FaLock className="w-5 h-5" />
            </span>
            <Input
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              type={showConfirmPassword ? 'text' : 'password'}
              className="h-12 rounded-xl border-gray-200 focus-visible:ring-primary pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading || !newPassword || !confirmPassword}
          className="w-full h-12 text-base rounded-xl bg-primary hover:bg-primary/90 transition-colors"
        >
          {loading ? <LoadingSpinner size={20} className="text-white" /> : 'Reset Password'}
        </Button>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </motion.div>
      </form>
    </AuthLayout>
  );
};

export default ChangePasswordPage;
