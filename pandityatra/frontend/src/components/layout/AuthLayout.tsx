import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import panditLogo from '@/assets/images/PanditYatralogo.png';

interface AuthLayoutProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
            <Card className="w-full max-w-md border-0 shadow-xl bg-white/90 backdrop-blur-sm dark:bg-gray-900/90">
                <CardContent className="pt-8 px-8 pb-8">
                    <div className="flex flex-col items-center mb-6 text-center space-y-4">
                        {/* Logo Section */}
                        <div className="flex items-center gap-4 mb-2">
                            <img
                                src={panditLogo}
                                alt="PanditYatra Logo"
                                className="h-24 w-auto object-contain"
                            />
                        </div>

                        {/* Title Section */}
                        <div className="space-y-1">
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                                {title || 'Welcome'}
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                {subtitle || 'Please login here'}
                            </p>
                        </div>
                    </div>

                    {/* Main Content */}
                    {children}
                </CardContent>
            </Card>

            {/* Decorative Bottom Wave - optional, can add svg here if requested */}
        </div>
    );
};
