import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import panditLogo from '@/assets/images/PanditYatralogo.png';
import { motion } from 'framer-motion';

interface AuthLayoutProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1] as any,
                staggerChildren: 0.15
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" as any }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">

            {/* Background Elements */}
            <motion.div
                className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-200/20 rounded-full blur-3xl"
                animate={{ scale: [1, 1.1, 1], x: [0, 30, 0] }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-200/20 rounded-full blur-3xl"
                animate={{ scale: [1, 1.1, 1], x: [0, -30, 0] }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            />

            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="w-full max-w-lg z-10 p-4 sm:p-0"
            >
                <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl dark:bg-gray-900/80 overflow-hidden ring-1 ring-orange-100/50">
                    <CardContent className="pt-10 px-8 pb-10">
                        <div className="flex flex-col items-center mb-8 text-center space-y-4">
                            {/* Logo Section - Matching Navbar Style */}
                            <motion.div variants={itemVariants} className="relative group">
                                <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-2xl group-hover:bg-orange-500/30 transition-all duration-700" />
                                <div className="relative w-20 h-20 bg-white dark:bg-gray-800 rounded-full p-4 shadow-sm ring-1 ring-orange-100">
                                    <img
                                        src={panditLogo}
                                        alt="PanditYatra Logo"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            </motion.div>

                            {/* Title Section */}
                            <motion.div className="space-y-1" variants={itemVariants}>
                                <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                                    {title || 'Welcome'}
                                </h1>
                                <p className="text-muted-foreground text-sm">
                                    {subtitle || 'Please login here'}
                                </p>
                            </motion.div>
                        </div>

                        {/* Main Content */}
                        <motion.div variants={itemVariants}>
                            {children}
                        </motion.div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};
