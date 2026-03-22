import React from 'react';
import { Button } from '@/components/ui/button';
import MiniOrbit from './MiniOrbit';

const CosmicOrbit: React.FC = () => {
    const scrollToGenerator = () => {
        document.getElementById('generator-form')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section className="relative w-full h-[550px] sm:h-[650px] md:h-[750px] lg:h-[800px] overflow-hidden flex items-center">
            {/* Background Video (Optimized for all screens) */}
            <div className="absolute inset-0 z-0 bg-[#3E2723]">
                <video
                    src="https://res.cloudinary.com/dm0vvpzs9/video/upload/v1774165306/astrology_vide_umcrqj.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover opacity-90"
                />
                {/* Overlay for Readability (Responsive intensity) */}
                <div className="absolute inset-0 bg-black/40 sm:bg-black/50 lg:bg-black/30 lg:bg-gradient-to-r lg:from-black/70 lg:to-transparent" />
            </div>

            {/* Content Overlay - Centered on Mobile, Left on Desktop */}
            <div className="container relative z-10 px-4 md:px-8 mx-auto">
                <div className="max-w-4xl space-y-6 sm:space-y-8 animate-fade-in-up text-center lg:text-left mx-auto lg:mx-0">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 bg-orange-600/30 backdrop-blur-md border border-orange-500/40 text-orange-400 px-4 py-2 rounded-full text-xs sm:text-sm font-black tracking-widest uppercase">
                            <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-ping" />
                            Celestial Guidance
                        </div>
                        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-[0.9] drop-shadow-lg">
                            COSMIC <br />
                            <span className="text-orange-500">DESTINY</span>
                        </h1>
                        <p className="text-lg sm:text-xl md:text-2xl text-white/90 font-medium max-w-xl lg:max-w-lg leading-relaxed mx-auto lg:mx-0 drop-shadow-sm">
                            Unlock the secrets of your stars through our precision Vedic calculation engine. Explore your celestial journey with expert accuracy.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                        <Button
                            onClick={scrollToGenerator}
                            className="bg-orange-600 hover:bg-orange-700 text-white font-black py-7 px-10 rounded-full shadow-[0_10px_40px_rgba(234,88,12,0.5)] hover:shadow-orange-500/80 transition-all duration-500 transform hover:-translate-y-1 group flex items-center h-auto w-full sm:w-auto overflow-hidden text-xl uppercase tracking-widest"
                        >
                            <MiniOrbit size={32} className="mr-3" />
                            <span>Generate Kundali</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Bottom Gradient Fade to white background of page */}
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent z-10" />
        </section>
    );
};

export default React.memo(CosmicOrbit);
