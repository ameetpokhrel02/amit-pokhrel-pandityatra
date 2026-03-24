import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchActiveBanners, type Banner } from '@/lib/api';
import apiClient from '@/lib/api-client';

export const BannerCarousel: React.FC = () => {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    const loadBanners = useCallback(async () => {
        try {
            const data = await fetchActiveBanners();
            setBanners(data);
            
            // Track views for initial banners if needed
            if (data.length > 0) {
                trackView(data[0].id);
            }
        } catch (err) {
            console.error("Failed to load banners:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBanners();
    }, [loadBanners]);

    const trackView = (id: number) => {
        apiClient.post(`/banners/${id}/track_view/`).catch(() => {});
    };

    const trackClick = (id: number) => {
        apiClient.post(`/banners/${id}/track_click/`).catch(() => {});
    };

    const nextSlide = useCallback(() => {
        if (banners.length === 0) return;
        const nextIdx = (currentIndex + 1) % banners.length;
        setCurrentIndex(nextIdx);
        trackView(banners[nextIdx].id);
    }, [currentIndex, banners]);

    const prevSlide = useCallback(() => {
        if (banners.length === 0) return;
        const prevIdx = (currentIndex - 1 + banners.length) % banners.length;
        setCurrentIndex(prevIdx);
        trackView(banners[prevIdx].id);
    }, [currentIndex, banners]);

    useEffect(() => {
        if (banners.length <= 1) return;
        const interval = setInterval(nextSlide, 4000);
        return () => clearInterval(interval);
    }, [nextSlide, banners.length]);

    if (loading) {
        return (
            <div className="w-full h-[250px] md:h-[400px] bg-gray-100 animate-pulse rounded-2xl flex items-center justify-center">
                <div className="text-gray-400">Loading offers...</div>
            </div>
        );
    }

    if (banners.length === 0) return null;

    const currentBanner = banners[currentIndex];

    return (
        <div className="relative w-full overflow-hidden rounded-2xl group shadow-sm bg-gray-50">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5 }}
                    className="relative w-full h-[300px] md:h-[400px]"
                >
                    {/* Background Layer (Desktop/Mobile responsive image) */}
                    <picture>
                        {currentBanner.mobile_image_url && (
                            <source media="(max-width: 767px)" srcSet={currentBanner.mobile_image_url} />
                        )}
                        <img
                            src={currentBanner.image_url}
                            alt={currentBanner.title}
                            className="w-full h-full object-cover"
                        />
                    </picture>

                    {/* Gradient Overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />

                    {/* Content Layer */}
                    <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 space-y-4">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="space-y-2 max-w-lg"
                        >
                            <span className="inline-block px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-bold uppercase tracking-wider">
                                {currentBanner.banner_type.replace('_', ' ')}
                            </span>
                            <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                                {currentBanner.title}
                            </h2>
                            <p className="text-lg text-gray-200 line-clamp-2">
                                {currentBanner.description}
                            </p>
                            
                            {currentBanner.link_url && (
                                <div className="pt-4">
                                    <Button
                                        asChild
                                        onClick={() => trackClick(currentBanner.id)}
                                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-12 px-8 rounded-full shadow-lg hover:shadow-orange-500/20 transition-all"
                                    >
                                        <a href={currentBanner.link_url}>
                                            {currentBanner.link_text || 'Shop Now'}
                                        </a>
                                    </Button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation Dots */}
            {banners.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                    {banners.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                setCurrentIndex(idx);
                                trackView(banners[idx].id);
                            }}
                            className={`w-2.5 h-2.5 rounded-full transition-all ${
                                currentIndex === idx ? 'bg-orange-500 w-8' : 'bg-white/50 hover:bg-white'
                            }`}
                        />
                    ))}
                </div>
            )}

            {/* Navigation Arrows */}
            {banners.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>
                </>
            )}
        </div>
    );
};
