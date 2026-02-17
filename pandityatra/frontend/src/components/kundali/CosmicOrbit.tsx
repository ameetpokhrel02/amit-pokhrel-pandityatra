import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { GiStarsStack } from 'react-icons/gi';
import MiniOrbit from './MiniOrbit';

interface OrbitingItem {
    name: string;
    symbol: string;
    radius: number;
    speed: number; // Degrees per frame
    size: number;
    color: string;
}

const PLANETS: OrbitingItem[] = [
    { name: 'Mercury', symbol: '☿', radius: 60, speed: 1.2, size: 14, color: '#9CA3AF' },
    { name: 'Venus', symbol: '♀', radius: 90, speed: 0.8, size: 18, color: '#FCD34D' },
    { name: 'Earth', symbol: '🌍', radius: 130, speed: 0.6, size: 20, color: '#3B82F6' },
    { name: 'Mars', symbol: '♂', radius: 170, speed: 0.5, size: 16, color: '#EF4444' },
    { name: 'Jupiter', symbol: '♃', radius: 220, speed: 0.3, size: 28, color: '#F97316' },
    { name: 'Saturn', symbol: '♄', radius: 280, speed: 0.2, size: 26, color: '#EAB308' },
];

const ZODIAC_SIGNS = [
    { name: 'Aries', symbol: '♈' }, { name: 'Taurus', symbol: '♉' },
    { name: 'Gemini', symbol: '♊' }, { name: 'Cancer', symbol: '♋' },
    { name: 'Leo', symbol: '♌' }, { name: 'Virgo', symbol: '♍' },
    { name: 'Libra', symbol: '♎' }, { name: 'Scorpio', symbol: '♏' },
    { name: 'Sagittarius', symbol: '♐' }, { name: 'Capricorn', symbol: '♑' },
    { name: 'Aquarius', symbol: '♒' }, { name: 'Pisces', symbol: '♓' },
];

const CosmicOrbit: React.FC = () => {
    const [isPaused, setIsPaused] = useState(false);
    const requestRef = useRef<number | null>(null);
    const [angles, setAngles] = useState<number[]>(PLANETS.map(() => Math.random() * 360));
    const [zodiacAngle, setZodiacAngle] = useState(0);

    const animate = (time: number) => {
        if (!isPaused) {
            setAngles(prev => prev.map((angle, i) => (angle + PLANETS[i].speed) % 360));
            setZodiacAngle(prev => (prev - 0.05) % 360); // Slow reverse rotation
        }
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPaused]);

    const scrollToGenerator = () => {
        document.getElementById('generator-form')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div
            className="relative w-full min-h-[500px] md:min-h-[650px] overflow-hidden bg-[#F5F5F5] flex items-center justify-center cursor-default select-none border-b border-orange-100 py-8 lg:py-0"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Soft Cosmic Gradients for Light Mode */}
            <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-200 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-yellow-100 rounded-full blur-[120px]" />
            </div>

            {/* Starfield Background */}
            <div className="absolute inset-0 z-0 opacity-20"
                style={{
                    backgroundImage: 'radial-gradient(circle at 50% 50%, #FF6F00 0.5px, transparent 0.5px)',
                    backgroundSize: '40px 40px'
                }}
            />

            <div className="container relative z-10 px-4 grid lg:grid-cols-2 gap-12 items-center">
                {/* LEFT SIDE: CTA CONTENT */}
                <div className="flex flex-col items-center lg:items-start space-y-6 animate-fade-in-up order-2 lg:order-1">
                    <div className="space-y-3 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 bg-orange-100 border border-orange-200 text-orange-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-1">
                            <span className="flex h-2 w-2 rounded-full bg-orange-600 animate-ping" />
                            Celestial Guidance
                        </div>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#3E2723] tracking-tighter drop-shadow-sm leading-tight">
                            COSMIC <br />
                            <span className="text-[#FF6F00]">DESTINY</span>
                        </h2>
                        <p className="text-base md:text-lg text-[#3E2723]/70 font-medium max-w-lg">
                            Unlock the secrets of your stars through our precision Vedic calculation engine. Explore your celestial journey with expert accuracy.
                        </p>
                    </div>

                    <Button
                        onClick={scrollToGenerator}
                        className="bg-[#FF6F00] hover:bg-[#E65100] text-white font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-orange-400/30 transition-all duration-300 transform hover:-translate-y-1 group flex items-center h-auto w-full sm:w-auto overflow-hidden text-lg"
                    >
                        <MiniOrbit size={28} className="mr-2" />
                        <span>Generate Your Kundali</span>
                    </Button>
                </div>

                {/* RIGHT SIDE: ROTATING ORBIT */}
                <div className="relative flex items-center justify-center order-1 lg:order-2 h-[350px] md:h-[550px] scale-[0.4] sm:scale-[0.55] md:scale-[0.75] lg:scale-[0.85] transition-transform origin-center lg:translate-x-12">
                    {/* Orbit Container */}
                    <div className="relative w-full max-w-[850px] aspect-square flex items-center justify-center">
                        {/* Sun Center */}
                        <div className="relative group z-30">
                            <div className="absolute inset-0 bg-orange-400 rounded-full blur-2xl opacity-40 animate-pulse scale-150" />
                            <div className="relative w-20 h-20 bg-gradient-to-br from-yellow-300 via-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(255,111,0,0.5)] border-2 border-white transition-transform duration-500 hover:scale-110">
                                <span className="text-5xl leading-none">☀</span>
                            </div>
                        </div>

                        {/* PLANET ORBITS */}
                        {PLANETS.map((planet, i) => {
                            const angleRad = (angles[i] * Math.PI) / 180;
                            const x = Math.cos(angleRad) * planet.radius;
                            const y = Math.sin(angleRad) * planet.radius;

                            return (
                                <React.Fragment key={planet.name}>
                                    <div
                                        className="absolute rounded-full border border-orange-200/50"
                                        style={{
                                            width: planet.radius * 2 * 1.1,
                                            height: planet.radius * 2 * 1.1,
                                            boxShadow: 'inset 0 0 10px rgba(255,111,0,0.02)'
                                        }}
                                    />
                                    <div
                                        className="absolute z-10 group transition-all duration-300 pointer-events-auto"
                                        style={{
                                            transform: `translate(${x * 1.1}px, ${y * 1.1}px)`,
                                        }}
                                    >
                                        <div
                                            className="rounded-full flex items-center justify-center transition-all duration-300 cursor-help hover:scale-125 hover:shadow-[0_0_15px_rgba(0,0,0,0.1)]"
                                            style={{
                                                width: planet.size,
                                                height: planet.size,
                                                backgroundColor: planet.color,
                                                boxShadow: `0 2px 10px ${planet.color}40`,
                                                border: '1px solid rgba(255,255,255,0.8)'
                                            }}
                                        >
                                            <span className="text-[10px] md:text-sm font-bold text-white shadow-sm">{planet.symbol}</span>
                                        </div>
                                    </div>
                                </React.Fragment>
                            );
                        })}

                        {/* ZODIAC RING */}
                        <div
                            className="absolute z-0 w-[780px] h-[780px] rounded-full border-2 border-orange-200/30 shadow-[0_0_30px_rgba(255,111,0,0.05)] flex items-center justify-center opacity-80"
                            style={{ transform: `rotate(${zodiacAngle}deg)` }}
                        >
                            {ZODIAC_SIGNS.map((sign, i) => {
                                const angle = (i * 360) / 12;
                                const angleRad = (angle * Math.PI) / 180;
                                const radius = 370;
                                const x = Math.cos(angleRad) * radius;
                                const y = Math.sin(angleRad) * radius;

                                return (
                                    <div
                                        key={sign.name}
                                        className="absolute group transition-all duration-300 pointer-events-auto"
                                        style={{
                                            transform: `translate(${x}px, ${y}px) rotate(${-zodiacAngle}deg)`,
                                        }}
                                    >
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-orange-700 bg-white border border-orange-200 shadow-sm transition-all duration-300 cursor-help hover:bg-orange-600 hover:text-white hover:scale-125 hover:rotate-12 hover:shadow-md">
                                            <span className="text-xl">{sign.symbol}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(CosmicOrbit);
