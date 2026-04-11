import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
    Shield, ShieldCheck, QrCode, Loader2, AlertCircle, XCircle, 
    Copy, Check, Key, Lock, Fingerprint, ExternalLink 
} from 'lucide-react';
import { AdminTOTPInput } from '../admin/AdminTOTPInput';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

export const TOTPSecuritySection: React.FC = () => {
    const { get2FAStatus, setup2FA, confirm2FA, disable2FA } = useAuth();
    const [isEnabled, setIsEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [setupMode, setSetupMode] = useState(false);
    const [disableMode, setDisableMode] = useState(false);
    const [qrData, setQrData] = useState<{ qr_code: string; secret: string } | null>(null);
    const [code, setCode] = useState('');
    const [processing, setProcessing] = useState(false);
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const resp = await get2FAStatus();
            setIsEnabled(resp.has_2fa);
        } catch (err) {
            console.error("Failed to fetch 2FA status", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (!qrData?.secret) return;
        navigator.clipboard.writeText(qrData.secret);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
            title: "Secret Copied",
            description: "The recovery secret has been copied to your clipboard.",
        });
    };

    const handleStartSetup = async () => {
        setProcessing(true);
        try {
            const resp = await setup2FA();
            setQrData(resp);
            setSetupMode(true);
        } catch (err: any) {
            toast({
                title: "Setup Failed",
                description: err.message || "Could not generate setup key.",
                variant: "destructive"
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleConfirmSetup = async () => {
        if (code.length !== 6) return;
        setProcessing(true);
        try {
            await confirm2FA(code); 
            setIsEnabled(true);
            setSetupMode(false);
            setQrData(null);
            setCode('');
            toast({
                title: "Security Hardened!",
                description: "Two-Factor Authentication is now active.",
            });
        } catch (err: any) {
            toast({
                title: "Verification Failed",
                description: err.message || "Invalid code. Please try again.",
                variant: "destructive"
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleDisable = async () => {
        if (code.length !== 6) return;
        setProcessing(true);
        try {
            await disable2FA(code);
            setIsEnabled(false);
            setDisableMode(false);
            setCode('');
            toast({
                title: "2FA Disabled",
                description: "Security has been reverted to single-factor.",
            });
        } catch (err: any) {
            toast({
                title: "Failed to Disable",
                description: err.message || "Invalid code provided.",
                variant: "destructive"
            });
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-12">
            <Loader2 className="animate-spin text-orange-500 mb-4" size={32} />
            <p className="text-sm font-medium text-gray-400">Loading security settings...</p>
        </div>
    );

    return (
        <div className="relative overflow-hidden bg-white/40 backdrop-blur-md rounded-3xl border border-orange-50/50 p-8 shadow-2xl shadow-orange-950/5">
            {/* Background Decorative Element */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-100/30 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-2xl transition-all duration-500 ${isEnabled ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-gray-100 text-gray-400'}`}>
                            {isEnabled ? <ShieldCheck size={28} /> : <Shield size={28} />}
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-[#3E2723] tracking-tight">Multi-Factor Security</h3>
                            <p className="text-sm text-[#3E2723]/60 font-medium">Protect your journey with 2FA</p>
                        </div>
                    </div>
                    <motion.div 
                        initial={false}
                        animate={{ scale: isEnabled ? 1 : 0.95 }}
                        className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] shadow-sm ${isEnabled ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}
                    >
                        {isEnabled ? 'Activated' : 'Inactive'}
                    </motion.div>
                </div>

                <AnimatePresence mode="wait">
                    {!isEnabled && !setupMode && (
                        <motion.div 
                            key="status-off"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100 group hover:bg-orange-50 transition-colors">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-600 mb-3 shadow-sm group-hover:scale-110 transition-transform">
                                        <Lock size={20} />
                                    </div>
                                    <h4 className="font-bold text-orange-900 text-sm mb-1">Enhanced Privacy</h4>
                                    <p className="text-orange-800/60 text-xs">Prevent unauthorized access even if your password is stolen.</p>
                                </div>
                                <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100 group hover:bg-orange-50 transition-colors">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-600 mb-3 shadow-sm group-hover:scale-110 transition-transform">
                                        <Fingerprint size={20} />
                                    </div>
                                    <h4 className="font-bold text-orange-900 text-sm mb-1">Identity Trust</h4>
                                    <p className="text-orange-800/60 text-xs">Confirm your identity using a unique time-based code.</p>
                                </div>
                            </div>
                            
                            <Button 
                                onClick={handleStartSetup}
                                className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-black text-lg rounded-2xl shadow-xl shadow-orange-500/20 transition-all active:scale-95 group"
                                disabled={processing}
                            >
                                {processing ? <Loader2 className="animate-spin mr-2" /> : <QrCode className="mr-3 group-hover:rotate-12 transition-transform" size={24} />}
                                Enable Authentication
                            </Button>
                        </motion.div>
                    )}

                    {setupMode && qrData && (
                        <motion.div 
                            key="setup-mode"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                            <div className="relative group">
                                <div className="absolute inset-0 bg-orange-500/5 rounded-[2.5rem] blur-2xl group-hover:bg-orange-500/10 transition-colors" />
                                <div className="relative bg-white/60 p-8 rounded-[2rem] border-2 border-dashed border-orange-100 flex flex-col items-center">
                                    <div className="text-center mb-6">
                                        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 inline-block">Step 1: Scan</span>
                                        <p className="text-sm font-bold text-gray-700">Open your authenticator app</p>
                                    </div>
                                    
                                    <div className="relative p-4 bg-white rounded-2xl shadow-2xl shadow-orange-950/10 mb-6">
                                        <img src={qrData.qr_code} alt="QR Setup" className="w-44 h-44" />
                                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white shadow-lg animate-bounce">
                                            <QrCode size={16} />
                                        </div>
                                    </div>

                                    <div className="w-full max-w-xs space-y-2">
                                        <p className="text-[10px] text-center font-black text-gray-400 uppercase tracking-widest">Or enter secret manually</p>
                                        <div className="flex items-center gap-2 bg-gray-100/80 p-1.5 rounded-xl border border-gray-200">
                                            <code className="flex-1 text-[11px] px-3 font-mono text-gray-600 truncate">{qrData.secret}</code>
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                onClick={handleCopy}
                                                className="h-8 w-8 rounded-lg hover:bg-white transition-colors"
                                            >
                                                {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-gray-400" />}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                transition={{ delay: 0.2 }}
                                className="space-y-6"
                            >
                                <div className="text-center">
                                    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 inline-block">Step 2: Verify</span>
                                    <h5 className="text-sm font-bold text-gray-900">Enter the 6-digit code</h5>
                                </div>
                                
                                <AdminTOTPInput value={code} onChange={setCode} />

                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Button 
                                        onClick={handleConfirmSetup}
                                        className="flex-1 h-14 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl shadow-lg shadow-orange-600/20 active:scale-95 transition-all"
                                        disabled={processing || code.length !== 6}
                                    >
                                        {processing ? <Loader2 className="animate-spin mr-2" /> : <ShieldCheck className="mr-2" size={20} />}
                                        Verify & Secure Account
                                    </Button>
                                    <Button 
                                        variant="ghost"
                                        onClick={() => { setSetupMode(false); setQrData(null); setCode(''); }}
                                        className="h-14 px-6 text-gray-400 hover:text-gray-600 font-bold hover:bg-gray-50 rounded-2xl"
                                        disabled={processing}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}

                    {isEnabled && !disableMode && (
                        <motion.div 
                            key="enabled-status"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-6 text-center"
                        >
                            <div className="py-8 bg-green-50/30 rounded-3xl border border-green-100/50">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                    <ShieldCheck size={32} />
                                </div>
                                <h4 className="text-green-900 font-black text-lg mb-2">Vault Secured</h4>
                                <p className="text-green-800/60 text-xs px-6">
                                    Your account is protected by an extra layer of biometric-grade authentication.
                                </p>
                            </div>
                            
                            <Button 
                                variant="outline"
                                onClick={() => setDisableMode(true)}
                                className="w-full h-14 rounded-2xl font-bold border-red-50 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-100 transition-all"
                            >
                                <XCircle className="mr-2" size={18} />
                                Disable Two-Factor
                            </Button>
                        </motion.div>
                    )}

                    {disableMode && (
                        <motion.div 
                            key="disable-mode"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-8"
                        >
                            <div className="bg-red-50/50 p-6 rounded-[2rem] border border-red-100">
                                <div className="flex items-center gap-3 text-red-600 mb-2">
                                    <AlertCircle size={20} />
                                    <h5 className="font-black text-sm uppercase tracking-wider">Warning</h5>
                                </div>
                                <p className="text-red-900/60 text-xs leading-relaxed">
                                    Disabling security will remove your second factor. You will be redirected to confirm this sensitive action.
                                </p>
                            </div>
                            
                            <div className="space-y-6">
                                <p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Enter Current Code</p>
                                <AdminTOTPInput value={code} onChange={setCode} />
                                
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Button 
                                        onClick={handleDisable}
                                        className="flex-1 h-14 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl shadow-xl shadow-red-600/20"
                                        disabled={processing || code.length !== 6}
                                    >
                                        {processing ? <Loader2 className="animate-spin mr-2" /> : "Deactivate & Confirm"}
                                    </Button>
                                    <Button 
                                        variant="ghost"
                                        onClick={() => { setDisableMode(false); setCode(''); }}
                                        className="h-14 px-6 text-gray-400 hover:text-gray-600 font-bold hover:bg-gray-50 rounded-2xl"
                                        disabled={processing}
                                    >
                                        Keep Security
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
