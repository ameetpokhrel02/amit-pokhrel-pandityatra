import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock, User, Eye, EyeOff, ShieldCheck, QrCode, ArrowLeft } from 'lucide-react';
import { AdminTOTPInput } from '@/components/admin/AdminTOTPInput';

type LoginStep = 'password' | 'totp' | 'setup';

const AdminLoginPage: React.FC = () => {
    // Current state management
    const [step, setStep] = useState<LoginStep>('password');
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [preAuthId, setPreAuthId] = useState('');
    const [qrCode, setQrCode] = useState('');

    // UI state
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { adminLogin, verifyAdminTOTP, setupAdminTOTP, confirmAdminTOTP, token, role, logout } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    // Redirect if already logged in as admin
    useEffect(() => {
        if (token && (role === 'admin' || role === 'superadmin' || role === 'audit')) {
            navigate('/admin/dashboard', { replace: true });
        }
    }, [token, role, navigate]);

    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!identifier || !password) return;

        setLoading(true);
        try {
            const resp = await adminLogin(identifier, password);

            if (resp.requires_2fa) {
                setPreAuthId(resp.pre_auth_id);
                setStep('totp');
                toast({
                    title: "Password Verified",
                    description: "Please enter your 2FA code from the authenticator app.",
                });
            } else if (resp.requires_setup) {
                setPreAuthId(resp.pre_auth_id);
                const setupResp = await setupAdminTOTP(resp.pre_auth_id);
                setQrCode(setupResp.qr_code);
                setStep('setup');
                toast({
                    title: "2FA Setup Required",
                    description: "Please scan this QR code with your authenticator app.",
                });
            } else if (resp.access) {
                // Direct login (should only happen if 2FA is somehow bypassed or not configured)
                navigate('/admin/dashboard', { replace: true });
            }
        } catch (err: any) {
            toast({
                title: "Authentication Failed",
                description: err.message || "Invalid admin credentials.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleTOTPVerify = async (codeOverride?: string) => {
        const codeToUse = codeOverride || otp;
        if (codeToUse.length !== 6) return;

        setLoading(true);
        try {
            // Verify with backend
            const resp = await verifyAdminTOTP(codeToUse, preAuthId);

            toast({
                title: "Login Successful",
                description: "Authenticating administrative session...",
            });

            // 🚀 BOLD NAVIGATION: Force push to dashboard
            // The useEffect will handle fallback, but direct push is faster UI
            setTimeout(() => {
                navigate('/admin/dashboard', { replace: true });
            }, 500);

        } catch (err: any) {
            toast({
                title: "Verification Failed",
                description: err.message || "Invalid or expired code.",
                variant: "destructive",
            });
            setOtp(''); // Clear failed OTP
        } finally {
            setLoading(false);
        }
    };

    const handleSetupConfirm = async (codeOverride?: string) => {
        const codeToUse = codeOverride || otp;
        if (codeToUse.length !== 6) return;

        setLoading(true);
        try {
            await confirmAdminTOTP(codeToUse, preAuthId);
            toast({
                title: "Security Configured",
                description: "2FA is now active. Welcome to your dashboard.",
            });
            navigate('/admin/dashboard', { replace: true });
        } catch (err: any) {
            toast({
                title: "Setup Failed",
                description: err.message || "Invalid verification code.",
                variant: "destructive",
            });
            setOtp('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title={
                step === 'password' ? "System Board" :
                    step === 'totp' ? "Security Barrier" : "Configure Guard"
            }
            subtitle={
                step === 'password' ? "Administrative authentication required for dashboard access." :
                    step === 'totp' ? "Identity verification via Authenticator App required." :
                        "Initialize your secure connection node."
            }
        >
            {/* 1. PASSWORD STEP */}
            {step === 'password' && (
                <form onSubmit={handlePasswordLogin} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="identifier">Admin Username or Email</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <Input
                                id="identifier"
                                type="text"
                                placeholder="Admin ID"
                                className="pl-10 h-12 rounded-xl border-gray-200 focus:ring-black"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                disabled={loading}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Secret Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className="pl-10 pr-10 h-12 rounded-xl border-gray-200 focus:ring-black"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="animate-spin" size={24} /> : "Validate Credentials"}
                    </Button>
                </form>
            )}

            {/* 2. TOTP VERIFICATION STEP */}
            {step === 'totp' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-center">
                        <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center text-white shadow-xl">
                            <ShieldCheck size={40} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-center block text-gray-500">Authenticator Code</Label>
                        <AdminTOTPInput
                            value={otp}
                            onChange={setOtp}
                            onComplete={handleTOTPVerify}
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-4">
                        <Button
                            onClick={() => handleTOTPVerify()}
                            className="w-full h-12 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                            disabled={loading || otp.length !== 6}
                        >
                            {loading ? <Loader2 className="animate-spin" size={24} /> : "Verify & Enter"}
                        </Button>

                        <button
                            onClick={() => setStep('password')}
                            className="w-full text-sm text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1 py-2 underline underline-offset-4"
                        >
                            <ArrowLeft size={14} /> Back to Password
                        </button>
                    </div>
                </div>
            )}

            {/* 3. INITIAL SETUP STEP */}
            {step === 'setup' && (
                <div className="space-y-8 animate-in zoom-in duration-500">
                    <div className="flex flex-col items-center gap-4">
                        <div className="p-4 bg-white border-2 border-dashed border-gray-200 rounded-2xl shadow-sm">
                            {qrCode ? (
                                <img src={qrCode} alt="TOTP QR Code" className="w-48 h-48" />
                            ) : (
                                <div className="w-48 h-48 flex items-center justify-center bg-gray-50 rounded-lg">
                                    <Loader2 className="animate-spin text-gray-300" size={32} />
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-400 text-center max-w-[250px]">
                            Scan this with Google Authenticator or Authy to enable 2FA on your account.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-center block text-gray-500">Verification Code</Label>
                        <AdminTOTPInput
                            value={otp}
                            onChange={setOtp}
                            onComplete={handleSetupConfirm}
                            disabled={loading}
                        />
                    </div>

                    <Button
                        onClick={() => handleSetupConfirm()}
                        className="w-full h-12 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                        disabled={loading || otp.length !== 6}
                    >
                        {loading ? <Loader2 className="animate-spin" size={24} /> : "Enable & Login"}
                    </Button>
                </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col gap-4 text-center">
                <p className="text-xs text-gray-400 leading-relaxed uppercase tracking-[0.1em]">
                    Secure Entry Node: admin_access_v2_otp
                </p>
                <p className="text-[10px] text-gray-300">
                    Unauthorized access is strictly prohibited and monitored.
                </p>
            </div>
        </AuthLayout>
    );
};

export default AdminLoginPage;
