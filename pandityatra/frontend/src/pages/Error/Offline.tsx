import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { WifiOff } from 'lucide-react';
import sadPandit from '@/assets/images/sad-pandit.png';

const Offline: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-[#F5F5F5] flex flex-col items-center justify-center p-6 text-left overflow-hidden">
            <div className="max-w-5xl w-full flex flex-col md:flex-row items-center justify-between gap-12 animate-fade-in-up relative z-10">

                {/* Text Content */}
                <div className="flex-1 space-y-8 relative z-20 order-2 md:order-1">
                    <div className="relative inline-block">
                        <h1 className="text-8xl md:text-9xl font-black text-[#FF6F00] opacity-10 select-none pointer-events-none absolute -top-16 -left-4">
                            LOST
                        </h1>
                        <h2 className="text-5xl md:text-7xl font-extrabold text-[#3E2723] leading-tight">
                            Connection <br />
                            <span className="text-[#FF6F00]">Lost</span>
                        </h2>
                    </div>

                    <p className="text-[#3E2723]/70 text-xl md:text-2xl max-w-lg">
                        It seems you've lost your connection to the divine (and the internet).
                        Please check your network settings.
                    </p>

                    <div className="pt-4">
                        <Button
                            onClick={() => window.location.reload()}
                            className="bg-[#3E2723] hover:bg-[#3E2723]/90 text-white px-10 py-7 text-lg rounded-full transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-1 w-full sm:w-auto"
                        >
                            Try Reconnecting
                        </Button>
                    </div>
                </div>

                {/* Image - Moved to Side */}
                <div className="flex-1 relative order-1 md:order-2 flex justify-center md:justify-end">
                    <div className="relative w-72 h-72 md:w-[450px] md:h-[450px] drop-shadow-[0_35px_35px_rgba(0,0,0,0.15)]">
                        <img
                            src={sadPandit}
                            alt="Sad Pandit"
                            className="w-full h-full object-contain animate-float grayscale"
                        />
                        <div className="absolute top-10 right-10 bg-red-500 rounded-full p-6 shadow-2xl border-4 border-white">
                            <WifiOff className="w-12 h-12 text-white" />
                        </div>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#FF6F00]/5 rounded-full blur-3xl -z-10" />
                </div>
            </div>
        </div>
    );
};

export default Offline;
