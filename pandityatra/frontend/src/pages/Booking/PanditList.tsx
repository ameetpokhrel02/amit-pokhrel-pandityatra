// In frontend/src/pages/Booking/PanditList.tsx

import { useEffect, useState, useMemo, useRef } from 'react';
import { fetchPandits } from '../../lib/api';
import type { Pandit } from '../../lib/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { PanditServicesModal } from '@/components/PanditServicesModal';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import MotionSearch from '@/components/ui/motion-search';
import AnimatedCard from '@/components/ui/AnimatedCard';
import { fadeInUp, subtleHover } from '@/components/ui/motion-variants';
import { useFavorites } from '@/hooks/useFavorites';
import { FaHeart, FaRegHeart } from 'react-icons/fa';

export const PanditList = () => {
    const [pandits, setPandits] = useState<Pandit[]>([]);
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const debounceRef = useRef<number | null>(null);
    const { isFavorite, toggleFavorite } = useFavorites();

    useEffect(() => {
        const loadPandits = async () => {
            try {
                setIsLoading(true);
                const data = await fetchPandits();
                setPandits(data);
                setError(null);
            } catch (err: any) {
                setError(err?.message || 'Failed to load pandits');
            } finally {
                setIsLoading(false);
            }
        };
        loadPandits();
    }, []);

    // Debounced query updater used by MotionSearch
    const handleQuery = (q: string) => {
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
        // small debounce so typing doesn't filter aggressively
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        debounceRef.current = window.setTimeout(() => setQuery(q), 180) as any;
    };

    const filtered = useMemo(() => {
        if (!query) return pandits;
        const q = query.toLowerCase();
        return pandits.filter(p => (
            p.full_name.toLowerCase().includes(q) ||
            (p.expertise || '').toLowerCase().includes(q) ||
            (p.language || '').toLowerCase().includes(q)
        ));
    }, [pandits, query]);

    if (isLoading) {
        return <div className="flex justify-center p-8"><LoadingSpinner /></div>;
    }

    if (error) {
        return <div className="text-red-500 text-center p-8">Error: {error}</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <h1 className="text-3xl font-bold">Available Pandits ({filtered.length})</h1>
                <div className="flex items-center">
                    <MotionSearch onSearch={handleQuery} />
                </div>
            </div>
            <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.06 } }
                }}
            >
                {filtered.map((pandit) => (
                    <motion.div key={pandit.id} variants={fadeInUp} whileHover={subtleHover}>
                        <AnimatedCard className="border-t-4 border-t-primary">
                            <CardHeader>
                                <CardTitle className="text-xl">{pandit.full_name}</CardTitle>
                                <CardDescription>
                                    Expertise: {pandit.expertise} • Language: {pandit.language}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <p className="text-yellow-600 font-bold">Rating: {pandit.rating} / 5.0</p>
                                    <p className="text-muted-foreground italic line-clamp-3">{pandit.bio}</p>
                                    <div className="mt-4">
                                        <div className="flex gap-2">
                                            <Link to={`/pandits/${pandit.id}`} className="no-underline">
                                                <Button variant="ghost">View Profile</Button>
                                            </Link>
                                            <PanditServicesModal
                                                panditId={pandit.id}
                                                panditName={pandit.full_name}
                                            />
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className={`hover:bg-transparent ${isFavorite(pandit.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                                                onClick={() => toggleFavorite({
                                                    id: pandit.id,
                                                    type: 'pandit',
                                                    name: pandit.full_name,
                                                    description: pandit.expertise,
                                                    image: pandit.image
                                                })}
                                            >
                                                {isFavorite(pandit.id) ? (
                                                    <FaHeart className="h-5 w-5 text-red-500" />
                                                ) : (
                                                    <FaRegHeart className="h-5 w-5 text-gray-400 hover:text-red-500" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </AnimatedCard>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
};