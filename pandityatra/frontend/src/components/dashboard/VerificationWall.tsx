import React from 'react';
import { motion } from 'framer-motion';
import { 
    ShieldCheck, 
    Clock, 
    AlertCircle, 
    XCircle, 
    ArrowRight, 
    ShieldAlert, 
    FileText,
    CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useNavigate } from 'react-router-dom';

interface VerificationWallProps {
    role: 'vendor' | 'pandit';
    status: 'PENDING' | 'REJECTED' | 'INCOMPLETE';
}

export const VerificationWall: React.FC<VerificationWallProps> = ({ role, status }) => {
    const navigate = useNavigate();

    const config = {
        PENDING: {
            icon: Clock,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            border: 'border-amber-200',
            title: 'Account Under Review',
            description: "We're currently verifying your credentials and identification. This usually takes 24-48 hours. We'll notify you once your account is activated.",
            actionText: 'Check Profile Details',
            actionLink: role === 'vendor' ? '/vendor/profile' : '/pandit/profile'
        },
        REJECTED: {
            icon: XCircle,
            color: 'text-red-600',
            bg: 'bg-red-50',
            border: 'border-red-200',
            title: 'Verification Declined',
            description: "Unfortunately, your verification request was not approved. Please review our guidelines and update your documents to re-apply.",
            actionText: 'Fix Profile Issues',
            actionLink: role === 'vendor' ? '/vendor/profile' : '/pandit/profile'
        },
        INCOMPLETE: {
            icon: AlertCircle,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            title: 'Complete Your Profile',
            description: "Welcome to PanditYatra! To start serving customers as a " + role + ", you must first complete your professional profile and submit it for verification.",
            actionText: 'Complete Profile Now',
            actionLink: role === 'vendor' ? '/vendor/profile' : '/pandit/profile'
        }
    };

    const current = config[status];
    const Icon = current.icon;

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl"
            >
                <Card className={`border-2 ${current.border} shadow-xl overflow-hidden`}>
                    <div className={`${current.bg} p-8 flex flex-col items-center text-center space-y-4`}>
                        <div className={`p-4 rounded-3xl bg-white shadow-lg ${current.color}`}>
                            <Icon size={48} strokeWidth={1.5} />
                        </div>
                        <h2 className={`text-3xl font-black tracking-tight ${current.color}`}>
                            {current.title}
                        </h2>
                        <p className="text-slate-600 font-medium max-w-md mx-auto leading-relaxed">
                            {current.description}
                        </p>
                    </div>
                    
                    <CardContent className="p-8 bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">What's Next?</h3>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 p-1 bg-green-50 text-green-600 rounded-full">
                                            <CheckCircle2 size={16} />
                                        </div>
                                        <p className="text-sm font-medium text-slate-600">Our team reviews your uploaded documents</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 p-1 bg-green-50 text-green-600 rounded-full">
                                            <CheckCircle2 size={16} />
                                        </div>
                                        <p className="text-sm font-medium text-slate-600">Identity verification check</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 p-1 bg-blue-50 text-blue-600 rounded-full">
                                            <CheckCircle2 size={16} />
                                        </div>
                                        <p className="text-sm font-medium text-slate-600">Account activation via email/SMS</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-slate-50 rounded-2xl p-6 flex flex-col justify-center space-y-4 border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Need Help?</p>
                                <Button 
                                    className="w-full bg-slate-900 hover:bg-black text-white rounded-xl py-6 font-bold"
                                    onClick={() => navigate(current.actionLink)}
                                >
                                    {current.actionText}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                                <p className="text-[10px] text-center text-slate-400 font-medium italic">
                                    Usually approved within 1 business day.
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-slate-400">
                                <ShieldCheck size={16} />
                                <span className="text-xs font-bold uppercase tracking-tighter">Secured Professional Onboarding</span>
                            </div>
                            <Button variant="ghost" className="text-slate-500 hover:text-slate-900 font-bold text-sm" asChild>
                                <Link to="/contact">Contact Support</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
            
            <div className="mt-8 flex items-center gap-4 opacity-30 grayscale pointer-events-none">
                <ShieldAlert size={24} />
                <FileText size={24} />
                <CheckCircle2 size={24} />
            </div>
        </div>
    );
};
