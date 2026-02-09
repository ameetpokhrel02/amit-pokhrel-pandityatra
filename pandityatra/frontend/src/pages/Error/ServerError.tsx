import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import sadPandit from '@/assets/images/sad-pandit.png';

const ServerError: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center p-6 text-left overflow-hidden">
            <div className="max-w-5xl w-full flex flex-col md:flex-row items-center justify-between gap-12 animate-fade-in-up relative z-10">

                {/* Text Content */}
                <div className="flex-1 space-y-8 relative z-20 order-2 md:order-1">
                    <div className="relative inline-block">
                        <h1 className="text-8xl md:text-9xl font-black text-[#FF6F00] opacity-10 select-none pointer-events-none absolute -top-16 -left-4">
                            500
                        </h1>
                        <h2 className="text-5xl md:text-7xl font-extrabold text-[#3E2723] leading-tight">
                            Server Is <br />
                            <span className="text-[#FF6F00]">Resting</span>
                        </h2>
                    </div>

                    <p className="text-[#3E2723]/70 text-xl md:text-2xl max-w-lg">
                        Something went wrong on our end. Our technical pandits are performing a repair ritual.
                        Please try again in a few moments.
                    </p>

                    <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                        <Button
                            onClick={() => window.location.reload()}
                            className="bg-[#FF6F00] hover:bg-[#FF6F00]/90 text-white px-10 py-7 text-lg rounded-full transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-1 w-full sm:w-auto"
                        >
                            Try Reloading
                        </Button>
                        <Button
                            onClick={() => navigate('/')}
                            variant="outline"
                            className="border-[#3E2723] text-[#3E2723] hover:bg-[#3E2723] hover:text-white px-10 py-7 text-lg rounded-full transition-all duration-300 w-full sm:w-auto"
                        >
                            Go to Homepage
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
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#FF6F00]/5 rounded-full blur-3xl -z-10" />
                </div>
            </div>

            {/* Background Decorative Text */}
            <h1 className="fixed bottom-[-10%] right-[-5%] text-[25rem] font-black text-[#3E2723] opacity-[0.02] select-none pointer-events-none -z-10 leading-none">
                500
            </h1>
        </div>
    );
};

export default ServerError;
