import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

const BackToTop = () => {
    const location = useLocation();
    const [showScrollTop, setShowScrollTop] = useState(false);

    // List of dashboard path prefixes where we DON'T want the button
    const dashboardPaths = ['/admin', '/pandit', '/vendor', '/dashboard', '/profile', '/my-bookings', '/messages'];
    const authPaths = ['/login', '/register', '/pandit/register', '/vendor/register', '/auth'];
    const isExcludedPage = [...dashboardPaths, ...authPaths].some(path => location.pathname.startsWith(path));

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 300);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (isExcludedPage) return null;

    return (
        <AnimatePresence>
            {showScrollTop && (
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    onClick={scrollToTop}
                    className="fixed bottom-24 md:bottom-8 left-8 z-50 bg-orange-50/90 backdrop-blur-sm border border-orange-200 shadow-lg pl-2 pr-5 py-2 rounded-full flex items-center gap-3 group hover:scale-105 transition-all duration-300"
                >
                    <div className="bg-orange-500 text-white rounded-full p-1.5 flex items-center justify-center group-hover:bg-orange-600 transition-colors">
                        <ArrowUp className="w-4 h-4" />
                    </div>
                    <span className="text-gray-800 font-medium text-sm">Back To Top</span>
                </motion.button>
            )}
        </AnimatePresence>
    );
};

export default BackToTop;
