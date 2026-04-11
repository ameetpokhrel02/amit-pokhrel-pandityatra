import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { FaShieldAlt } from 'react-icons/fa';
import { AdminTOTPInput } from '@/components/admin/AdminTOTPInput';

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

const LoginOTPVerification: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOtp, requestOtp, verifyGlobalTOTP } = useAuth();
  const { toast } = useToast();
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
  const [step, setStep] = useState<'otp' | '2fa'>('otp');
  const [preAuthId, setPreAuthId] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [verifying2fa, setVerifying2fa] = useState(false);

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
      
      if (resp.requires_2fa) {
        setPreAuthId(resp.pre_auth_id);
        setStep('2fa');
        setLoading(false);
        return;
      }

      toast({
        title: "Login Successful!",
        description: "OTP verified. Redirecting to dashboard...",
        variant: "default",
      });
      // Redirect based on role
      const userRole = (resp as any)?.role || 'user';
      if (userRole === 'admin' || userRole === 'superadmin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (userRole === 'pandit') {
        navigate('/pandit/dashboard', { replace: true });
      } else if (userRole === 'vendor') {
        navigate('/vendor/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerify = async () => {
    if (totpCode.length !== 6 || !preAuthId) return;
    setVerifying2fa(true);
    setError(null);
    try {
      const resp = await verifyGlobalTOTP(totpCode, preAuthId);
      toast({
        title: "Security Verified",
        description: "Welcome back!",
      });
      
      const userRole = (resp as any)?.role || 'user';
      if (userRole === 'admin' || userRole === 'superadmin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (userRole === 'pandit') {
        navigate('/pandit/dashboard', { replace: true });
      } else if (userRole === 'vendor') {
        navigate('/vendor/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || "Invalid 2FA code.");
    } finally {
      setVerifying2fa(false);
    }
  };

  const handleResendOTP = async () => {
    setError(null);
    setLoading(true);
    try {
      await requestOtp(identifier!);
      toast({
        title: "OTP Resent!",
        description: "A new verification code has been sent.",
        variant: "default",
      });
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
    <AuthLayout
      title={step === '2fa' ? "Security Step" : "Verify OTP"}
      subtitle={step === '2fa' ? "Enter your authenticator code" : `Enter the 6-digit OTP sent to ${identifier}`}
    >
      {step === '2fa' ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-4 text-orange-600 shadow-sm">
                    <FaShieldAlt size={32} />
                </div>
            </div>

            <div className="space-y-4">
                <Label className="text-sm font-bold text-gray-900 border-l-4 border-orange-500 pl-3">
                    6-Digit Authenticator Code
                </Label>
                <AdminTOTPInput value={totpCode} onChange={setTotpCode} />
                
                {error && (
                    <Alert variant="destructive" className="bg-red-50 border-red-100 py-3">
                        <AlertDescription className="text-red-700 font-medium">
                            {error}
                        </AlertDescription>
                    </Alert>
                )}

                <div className="pt-2">
                    <Button 
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold h-14 rounded-2xl shadow-lg shadow-orange-100 transition-all text-lg"
                        onClick={handle2FAVerify}
                        disabled={verifying2fa || totpCode.length !== 6}
                    >
                        {verifying2fa ? <LoadingSpinner size={20} className="mr-2" /> : "Verify & Continue"}
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full mt-4 text-gray-500 hover:text-gray-700 font-medium rounded-xl"
                        onClick={() => {
                            setStep('otp');
                            setPreAuthId(null);
                            setTotpCode('');
                            setError(null);
                        }}
                        disabled={verifying2fa}
                    >
                        Back to OTP
                    </Button>
                </div>
            </div>
        </div>
      ) : (
      <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }}>
        <motion.div className="space-y-4" variants={itemVariants}>
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
            type="submit"
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
        </motion.div>
      </form>
      )}
    </AuthLayout>
  );
};

export default LoginOTPVerification;

