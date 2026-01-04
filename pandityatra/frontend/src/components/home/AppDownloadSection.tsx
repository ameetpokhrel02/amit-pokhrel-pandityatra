import React, { useRef } from 'react';
import { motion, useTransform, useSpring, useMotionValue } from 'framer-motion';
// import { Button } from '@/components/ui/button';
import panditUi from '@/assets/images/pandi ui.jpg';
import appleLogo from '@/assets/images/Apple Logo PNG.jpeg';
import playstoreLogo from '@/assets/images/playstore.jpeg';
import pwaLogo from '@/assets/images/PWA.png';

const AppDownloadSection: React.FC = () => {
    const ref = useRef<HTMLDivElement>(null);

    // Mouse position state for parallax
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Smooth spring animation for the movement
    // Increased stiffness and reduced damping for faster, more responsive motion
    const mouseX = useSpring(x, { stiffness: 150, damping: 20 });
    const mouseY = useSpring(y, { stiffness: 150, damping: 20 });

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top, width, height } = currentTarget.getBoundingClientRect();
        const xPos = (clientX - left) / width - 0.5;
        const yPos = (clientY - top) / height - 0.5;

        // Move up to 50px in either direction for more noticeable effect
        x.set(xPos * 50);
        y.set(yPos * 50);
    }

    function handleMouseLeave() {
        x.set(0);
        y.set(0);
    }

    return (
        <section
            className="relative overflow-hidden bg-cream py-24 px-4 md:px-8"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            ref={ref}
        >
            <div className="container mx-auto max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

                    {/* Left Side: Content */}
                    <div className="flex flex-col space-y-8 z-10 pointer-events-none md:pointer-events-auto">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-4xl md:text-5xl font-bold text-dark-brown mb-4 leading-tight">
                                Carry Your Spiritual Journey <br />
                                <span className="text-saffron">In Your Pocket</span>
                            </h2>
                            <p className="text-lg text-dark-brown/80 max-w-xl mb-8">
                                Download the PanditYatra app for instant access to verified pandits,
                                puja bookings, and offline Kundali generation. Experience spirituality
                                anytime, anywhere.
                            </p>

                            <div className="flex flex-wrap gap-4">
                                {/* Google Play Button */}
                                <motion.a
                                    href="#"
                                    className="bg-saffron text-white px-6 py-3 rounded-xl flex items-center space-x-3 hover:bg-orange-700 transition-colors shadow-lg hover:shadow-xl"
                                    whileHover={{ scale: 1.05, y: -3 }}
                                    whileTap={{ scale: 0.95 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                >
                                    <img src={playstoreLogo} alt="Play Store" className="w-8 h-8 object-contain rounded-md brightness-0 invert" />
                                    <div className="text-left">
                                        <div className="text-xs uppercase opacity-90">Get it on</div>
                                        <div className="text-lg font-semibold leading-none">Google Play</div>
                                    </div>
                                </motion.a>

                                {/* App Store Button */}
                                <motion.a
                                    href="#"
                                    className="bg-dark-brown text-white px-6 py-3 rounded-xl flex items-center space-x-3 hover:bg-brown-900 transition-colors shadow-lg hover:shadow-xl"
                                    whileHover={{ scale: 1.05, y: -3 }}
                                    whileTap={{ scale: 0.95 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                >
                                    <img src={appleLogo} alt="App Store" className="w-8 h-8 object-contain rounded-md brightness-0 invert" />
                                    <div className="text-left">
                                        <div className="text-xs uppercase opacity-90">Download on the</div>
                                        <div className="text-lg font-semibold leading-none">App Store</div>
                                    </div>
                                </motion.a>

                                {/* PWA Button */}
                                <motion.a
                                    href="#"
                                    className="bg-white text-dark-brown px-6 py-3 rounded-xl flex items-center space-x-3 hover:bg-gray-50 transition-colors border-2 border-dark-brown/10 shadow-lg hover:shadow-xl"
                                    whileHover={{ scale: 1.05, y: -3 }}
                                    whileTap={{ scale: 0.95 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                >
                                    <img src={pwaLogo} alt="PWA" className="w-8 h-8 object-contain rounded-md" />
                                    <div className="text-left">
                                        <div className="text-xs uppercase opacity-90 font-bold text-saffron">Launch as</div>
                                        <div className="text-lg font-semibold leading-none">Web App</div>
                                    </div>
                                </motion.a>
                            </div>

                            <div className="mt-10 flex items-center space-x-4">
                                <div className="flex -space-x-4">
                                    {/* Avatars placeholder or small usage stats */}
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className={`w-12 h-12 rounded-full border-2 border-white bg-gray-300 overflow-hidden`}>
                                            <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" />
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <p className="font-bold text-dark-brown text-lg">50k+ <span className="font-normal text-dark-brown/80">Downloads</span></p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Side: Phone Animation */}
                    <div className="relative flex justify-center items-center perspective-1000">
                        {/* Background Decoration */}
                        <div className="absolute w-[600px] h-[600px] bg-saffron/10 rounded-full blur-3xl -z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>

                        <motion.div
                            className="relative z-10"
                            initial={{ x: 100, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            transition={{ duration: 0.5, type: "spring", stiffness: 100, damping: 15 }}
                            viewport={{ once: true }}
                            style={{
                                x: mouseX,
                                y: mouseY,
                                rotateX: useTransform(mouseY, [-50, 50], [8, -8]),
                                rotateY: useTransform(mouseX, [-50, 50], [-8, 8]),
                            }}
                        >
                            <img
                                src={panditUi}
                                alt="PanditYatra App Interface"
                                // Reverted to smaller size as requested
                                className="h-[600px] w-auto object-contain drop-shadow-2xl rounded-3xl"
                                style={{ maxWidth: '300px' }} />

                            {/* Floating Badges - Parallax Effect (Counter Movement) */}
                            <motion.div
                                className="absolute top-24 -left-16 bg-white p-4 rounded-xl shadow-xl flex items-center space-x-3 z-20"
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3, duration: 0.4 }}
                                viewport={{ once: true }}
                                style={{
                                    x: useTransform(mouseX, (val) => val * -2), // Moves opposite to phone
                                    y: useTransform(mouseY, (val) => val * -2)
                                }}
                            >
                                <div className="bg-green-100 p-2 rounded-full">
                                    <span role="img" aria-label="check">✅</span>
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-dark-brown">Booking Confirmed</p>
                                    <p className="text-xs text-gray-500">Satyanarayan Puja</p>
                                </div>
                            </motion.div>

                            <motion.div
                                className="absolute bottom-40 -right-12 bg-white p-4 rounded-xl shadow-xl z-20"
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5, duration: 0.4 }}
                                viewport={{ once: true }}
                                style={{
                                    x: useTransform(mouseX, (val) => val * -1.8),
                                    y: useTransform(mouseY, (val) => val * -1.8)
                                }}
                            >
                                <div className="flex items-center space-x-1 mb-1">
                                    <div className="bg-orange-100 p-1 rounded-full text-saffron font-bold text-xs">★</div>
                                    <span className="font-bold text-dark-brown">4.9/5 Rating</span>
                                </div>
                                <p className="text-xs text-gray-500">from 10k+ reviews</p>
                            </motion.div>
                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default AppDownloadSection;
