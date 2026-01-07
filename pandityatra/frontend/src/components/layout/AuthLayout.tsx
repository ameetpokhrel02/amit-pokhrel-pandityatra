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
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: "easeOut" as any,
                when: "beforeChildren",
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
    };

    const logoVariants = {
        float: {
            y: [0, -10, 0],
            transition: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut" as any as any
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">

            {/* Background Elements (Optional for extra flair) */}
            <motion.div
                className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-200/20 rounded-full blur-3xl"
                animate={{ scale: [1, 1.2, 1], x: [0, 50, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-200/20 rounded-full blur-3xl"
                animate={{ scale: [1, 1.2, 1], x: [0, -50, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />

            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="w-full max-w-md z-10"
            >
                <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-md dark:bg-gray-900/90 overflow-hidden">
                    <CardContent className="pt-8 px-8 pb-8">
                        <div className="flex flex-col items-center mb-6 text-center space-y-4">
                            {/* Logo Section */}
                            <motion.div
                                className="flex items-center gap-4 mb-2"
                                variants={logoVariants}
                                animate="float"
                            >
                                <img
                                    src={panditLogo}
                                    alt="PanditYatra Logo"
                                    className="h-24 w-auto object-contain drop-shadow-sm"
                                />
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
