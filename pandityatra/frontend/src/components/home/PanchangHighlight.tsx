import React, { useRef } from 'react';
import { motion, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import PanchangWidget from '../panchang/PanchangWidget';
import calendarImg from '@/assets/images/calander view .webp';

const PanchangHighlight: React.FC = () => {
    const { t } = useTranslation();
    const ref = useRef<HTMLDivElement>(null);

    // Mouse position state for parallax
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Smooth spring animation for the movement
    const mouseX = useSpring(x, { stiffness: 150, damping: 20 });
    const mouseY = useSpring(y, { stiffness: 150, damping: 20 });

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top, width, height } = currentTarget.getBoundingClientRect();
        const xPos = (clientX - left) / width - 0.5;
        const yPos = (clientY - top) / height - 0.5;

        // Move up to 30px for a more subtle, smoother effect that fits better
        x.set(xPos * 30);
        y.set(yPos * 30);
    }

    function handleMouseLeave() {
        x.set(0);
        y.set(0);
    }

    return (
        <section
            className="relative overflow-hidden bg-white py-16 md:py-24 px-4 md:px-8 border-y border-orange-50"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            ref={ref}
        >
            <div className="container mx-auto max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">

                    {/* Left Side: Content */}
                    <div className="flex flex-col space-y-6 md:space-y-8 z-10">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            viewport={{ once: true }}
                        >
                            <div className="inline-flex items-center gap-2 bg-orange-100/80 text-orange-700 px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest mb-4 md:mb-6">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>{t('panchang.spiritual_alignment')}</span>
                            </div>

                            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-[#3E2723] mb-4 md:mb-6 leading-[1.1] tracking-tight">
                                {t('panchang.align_actions')} <br />
                                <span className="text-orange-600">{t('panchang.cosmic_rhythms')}</span>
                            </h2>

                            <p className="text-lg md:text-xl text-gray-600 max-w-lg mb-8 md:mb-10 leading-relaxed font-medium">
                                {t('panchang.daily_guidance')}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <Link to="/kundali">
                                    <Button className="bg-[#3E2723] hover:bg-[#2D1B18] text-white px-8 h-14 rounded-2xl text-lg font-bold shadow-xl shadow-brown-200 transition-all hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto">
                                        {t('panchang.explore_calendar')}
                                    </Button>
                                </Link>
                                <Button
                                    className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white shadow-xl shadow-orange-500/20 px-8 rounded-full font-bold h-auto py-3 text-base md:text-lg transition-all duration-300 transform hover:-translate-y-1"
                                >
                                    Book Special Puja
                                </Button>
                                <Link to="/calendar" className="w-full sm:w-auto">
                                    <Button
                                        variant="outline"
                                        className="w-full border-orange-200 text-orange-700 hover:bg-orange-50 rounded-full px-8 py-3 h-auto font-bold text-base md:text-lg transition-all duration-300 transform hover:-translate-y-1"
                                    >
                                        Explore Calendar
                                    </Button>
                                </Link>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Side: Animated Image & Widget Overlay */}
                    <div className="relative flex justify-center lg:justify-end items-center order-first md:order-last mb-8 md:mb-0 md:pr-4 lg:pr-12">
                        {/* Decorative Background Blob - Static */}
                        <div className="absolute w-[250px] md:w-[450px] h-[250px] md:h-[450px] bg-orange-50 rounded-full blur-3xl -z-10 animate-pulse"></div>

                        {/* ── Mobile stacked layout ── */}
                        <div className="flex flex-col items-center gap-4 md:hidden w-full px-2">
                            {/* Panchang Widget on mobile — full width card */}
                            <motion.div
                                className="w-full max-w-[280px]"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                                viewport={{ once: true }}
                            >
                                <div className="shadow-xl rounded-2xl overflow-hidden bg-white border border-orange-50/50">
                                    <PanchangWidget />
                                </div>
                            </motion.div>

                            {/* Calendar Image on mobile */}
                            <motion.div
                                className="relative"
                                initial={{ scale: 0.9, opacity: 0 }}
                                whileInView={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
                                viewport={{ once: true }}
                            >
                                <img
                                    src={calendarImg}
                                    alt="Advanced Calendar View"
                                    className="w-full max-w-[200px] h-auto object-contain drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                                />
                            </motion.div>

                            {/* Sparkle badge on mobile */}
                            <motion.div
                                className="bg-white p-2.5 rounded-xl shadow-lg border border-orange-50"
                                initial={{ opacity: 0, scale: 0.5 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4, duration: 0.4 }}
                                viewport={{ once: true }}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                        <Sparkles className="w-4 h-4 text-orange-600" />
                                    </div>
                                    <div className="pr-1">
                                        <p className="font-bold text-[10px] text-[#3E2723]">Daily Guidance</p>
                                        <p className="text-[8px] text-gray-500 whitespace-nowrap">Trusted by 10k+</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* ── Desktop parallax layout (md+) ── */}
                        <div className="relative z-10 hidden md:flex flex-col items-center perspective-1000">
                            {/* Main Calendar Image with 3D Motion Effect */}
                            <motion.div
                                className="relative group md:ml-auto"
                                initial={{ scale: 0.9, opacity: 0 }}
                                whileInView={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
                                viewport={{ once: true }}
                                style={{
                                    x: mouseX,
                                    y: mouseY,
                                    rotateX: useTransform(mouseY, [-30, 30], [5, -5]),
                                    rotateY: useTransform(mouseX, [-30, 30], [-5, 5]),
                                }}
                            >
                                <img
                                    src={calendarImg}
                                    alt="Advanced Calendar View"
                                    className="w-full max-w-[400px] lg:max-w-[420px] h-auto object-contain drop-shadow-[0_0_15px_rgba(249,115,22,0.5)] transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-orange-400/5 to-transparent pointer-events-none rounded-3xl" />
                            </motion.div>

                            {/* Floating Panchang Widget */}
                            <motion.div
                                className="absolute -top-16 -left-32 lg:-left-48 w-[240px] lg:w-[260px] z-20"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.5 }}
                                viewport={{ once: true }}
                            >
                                <div className="transition-all duration-500 shadow-2xl rounded-3xl overflow-hidden bg-white border border-orange-50/50 hover:shadow-orange-200/40">
                                    <PanchangWidget />
                                </div>
                            </motion.div>

                            {/* Decorative Sparkle Badge */}
                            <motion.div
                                className="absolute -bottom-6 -right-4 bg-white p-4 rounded-2xl shadow-xl border border-orange-50 z-30"
                                initial={{ opacity: 0, scale: 0.5 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.6, duration: 0.4 }}
                                viewport={{ once: true }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div className="pr-1">
                                        <p className="font-bold text-xs text-[#3E2723]">Daily Guidance</p>
                                        <p className="text-[10px] text-gray-500 whitespace-nowrap">Trusted by 10k+</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default PanchangHighlight;
