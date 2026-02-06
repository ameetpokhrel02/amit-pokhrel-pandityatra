import React from 'react';
import panditLogo from '@/assets/images/PanditYatralogo.png';
import sideImage from '@/assets/images/pandit_loging.webp';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, Calendar, User, CheckCircle2 } from 'lucide-react';

interface AuthLayoutProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
            {/* Main Outer Container */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-6xl min-h-[90vh] lg:min-h-0 lg:aspect-[16/10] bg-white rounded-3xl lg:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row relative ring-4 lg:ring-8 ring-white/50"
            >
                {/* Close Button / Go Home */}
                <button
                    onClick={() => navigate('/')}
                    className="absolute top-6 right-6 z-50 bg-gray-100 hover:bg-gray-200 text-gray-500 p-2 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Left Side: Form Section */}
                <div className="w-full lg:w-[45%] p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-y-auto custom-scrollbar">
                    <div className="space-y-12">
                        {/* Brand Logo */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center p-1.5">
                                <img src={panditLogo} alt="PanditYatra" className="w-full h-full object-contain" />
                            </div>
                            <span className="text-xl font-bold text-[#2D2D2D]">PanditYatra</span>
                        </div>

                        {/* Welcome Text */}
                        <div className="space-y-3">
                            <h1 className="text-4xl font-extrabold text-[#1A1A1A] tracking-tight leading-tight">
                                {title || 'Welcome Back'}
                            </h1>
                            <p className="text-gray-500 text-lg">
                                {subtitle || 'Ready for your sacred journey? Entry awaits.'}
                            </p>
                        </div>

                        {/* Content Area */}
                        <div className="mt-8">
                            {children}
                        </div>
                    </div>

                    {/* Footer Info (Anita's Reference) */}
                    <div className="pt-8 flex justify-between items-center text-xs text-gray-400">
                        <span>© 2026 PanditYatra Inc.</span>
                        <div className="flex gap-4">
                            <a href="#" className="hover:text-orange-500 underline underline-offset-4">Terms</a>
                            <a href="#" className="hover:text-orange-500 underline underline-offset-4">Privacy</a>
                        </div>
                    </div>
                </div>

                {/* Right Side: Visual Section */}
                <div className="hidden lg:block w-[55%] relative p-8">
                    {/* Main Image Container */}
                    <div className="w-full h-full rounded-[2rem] overflow-hidden relative shadow-2xl group ring-4 ring-orange-50/20">
                        <img
                            src={sideImage}
                            alt="The Sacred Vibe"
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                        {/* Floating Glassmorphism Elements (Reflecting Reference Image Style) */}

                        {/* 1. Daily Task/Calendar Card */}
                        <motion.div
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className="absolute top-10 right-10 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl w-64 shadow-xl"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <p className="text-[10px] font-bold text-white/60 tracking-widest uppercase">Upcoming Puja</p>
                                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                            </div>
                            <p className="text-sm font-semibold text-white mb-2">Ganesh Vandana Ritual</p>
                            <p className="text-xs text-white/70">09:30 AM - 11:00 AM IST</p>
                        </motion.div>

                        {/* 2. Team/Pandit Status Card */}
                        <motion.div
                            initial={{ x: -30, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.7, duration: 0.8 }}
                            className="absolute middle right-10 top-40 flex flex-col gap-2"
                        >
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="w-12 h-12 rounded-full border-2 border-white ring-4 ring-black/10 overflow-hidden shadow-lg transform hover:scale-110 transition-transform">
                                    <img src={`https://i.pravatar.cc/150?u=${i * 10}`} alt="avatar" />
                                </div>
                            ))}
                        </motion.div>

                        {/* 3. Bottom Action/Verification Card */}
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.9, duration: 0.8 }}
                            className="absolute bottom-10 left-10 right-10 bg-white p-5 rounded-3xl shadow-2xl flex items-center gap-4 border border-orange-50"
                        >
                            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                                <Calendar size={24} />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-gray-900 leading-tight">Sacred Meeting Confirmed</h4>
                                <p className="text-xs text-gray-500">Connecting with Ramesh Shastri Ji</p>
                            </div>
                            <div className="flex -space-x-2">
                                <div className="w-8 h-8 rounded-full border-2 border-white bg-green-500 flex items-center justify-center text-white shadow-md">
                                    <CheckCircle2 size={16} />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            {/* Background Decorative Rings (matching ref aesthetic) */}
            <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] aspect-square bg-gradient-to-br from-orange-200/20 via-white to-blue-200/20 rounded-full blur-[120px]" />
            </div>
        </div>
    );
};
