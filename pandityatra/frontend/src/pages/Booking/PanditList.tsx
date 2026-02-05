// In frontend/src/pages/Booking/PanditList.tsx

import { useEffect, useState, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchPandits } from '../../lib/api';
import type { Pandit } from '../../lib/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { PanditServicesModal } from '@/components/PanditServicesModal';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import MotionSearch from '@/components/ui/motion-search';
import { fadeInUp, subtleHover } from '@/components/ui/motion-variants';
import { useFavorites } from '@/hooks/useFavorites';
import { Heart, Star, MapPin, Languages, Video, Calendar, ShieldCheck } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const PanditList = () => {
    const [pandits, setPandits] = useState<Pandit[]>([]);
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const debounceRef = useRef<number | null>(null);
    const { isFavorite, toggleFavorite } = useFavorites();
    const location = useLocation();

    // Filters State
    const [specializationFilter, setSpecializationFilter] = useState<string>("all");
    const [experienceFilter, setExperienceFilter] = useState<string>("all");
    const [languageFilter, setLanguageFilter] = useState<string>("all");

    // Parse query params for pujaType and date
    const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
    const pujaTypeParam = params.get('pujaType')?.toLowerCase() || '';
    const queryParam = params.get('q') || '';

    useEffect(() => {
        if (queryParam) {
            setQuery(queryParam);
        }
    }, [queryParam]);

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

    // Debounced query updater using MotionSearch
    const handleQuery = (q: string) => {
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(() => setQuery(q), 180) as any;
    };

    // --- Rule-based AI/NLP search (maintained from previous logic) ---
    function parseQuery(q: string) {
        const lower = q.toLowerCase();
        const langMatch = lower.match(/(english|nepali|hindi|sanskrit)/g);
        const languages = langMatch ? Array.from(new Set(langMatch)) : [];
        const expMatch = lower.match(/(\d+)\s*(years?|yrs?)/);
        const experience = expMatch ? parseInt(expMatch[1]) : null;
        let expertise = '';
        if (lower.includes('naming')) expertise = 'naming';
        else if (lower.includes('marriage')) expertise = 'marriage';
        else if (lower.includes('thread')) expertise = 'thread';
        else if (lower.includes('puja')) expertise = 'puja';
        else if (lower.includes('astrology')) expertise = 'astrology';
        return { languages, experience, expertise };
    }

    const filtered = useMemo(() => {
        let result = pandits;

        // 1. Initial Param Filter
        if (pujaTypeParam) {
            result = result.filter(p => (p.expertise || '').toLowerCase().includes(pujaTypeParam));
        }

        // 2. Dropdown Filters
        if (specializationFilter !== "all") {
            // Simple approximate matching for demo; ideally backed by normalized tags
            result = result.filter(p => (p.expertise || '').toLowerCase().includes(specializationFilter.toLowerCase()));
        }
        if (languageFilter !== "all") {
            result = result.filter(p => (p.language || '').toLowerCase().includes(languageFilter.toLowerCase()));
        }
        if (experienceFilter !== "all") {
            if (experienceFilter === "10+") result = result.filter(p => p.experience_years >= 10);
            else if (experienceFilter === "5-10") result = result.filter(p => p.experience_years >= 5 && p.experience_years < 10);
            else if (experienceFilter === "<5") result = result.filter(p => p.experience_years < 5);
        }

        // 3. Search Query
        if (query) {
            if (query.length < 5) {
                const q = query.toLowerCase();
                result = result.filter(p => (
                    (p.user_details.full_name || '').toLowerCase().includes(q) ||
                    (p.expertise || '').toLowerCase().includes(q)
                ));
            } else {
                const { languages, experience, expertise } = parseQuery(query);
                result = result.filter(p => {
                    let match = true;
                    if (languages.length > 0) match = match && languages.some(lang => (p.language || '').toLowerCase().includes(lang));
                    if (experience !== null && typeof p.experience_years === 'number') match = match && p.experience_years >= experience;
                    if (expertise) match = match && (p.expertise || '').toLowerCase().includes(expertise);
                    return match;
                });
            }
        }
        return result;
    }, [pandits, query, pujaTypeParam, specializationFilter, experienceFilter, languageFilter]);

    // Extract Unique Options for Filters
    const specializations = useMemo(() => Array.from(new Set(pandits.map(p => p.expertise?.split(',')[0].trim()))).filter(Boolean), [pandits]);
    const languagesList = useMemo(() => Array.from(new Set(pandits.flatMap(p => p.language?.split(',').map(l => l.trim())))).filter(Boolean), [pandits]);


    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen">
                <Navbar />
                <div className="flex-grow flex justify-center items-center">
                    <LoadingSpinner />
                </div>
                <Footer />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col min-h-screen">
                <Navbar />
                <div className="flex-grow flex justify-center items-center text-red-500">
                    Error: {error}
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50/50 pt-20">
            <Navbar />

            <div className="container mx-auto p-4 md:p-8 flex-grow">
                {/* Header Section */}
                <div className="flex flex-col gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Discover Pandits</h1>
                        <p className="text-gray-500 mt-1">Find and book verified Vedic experts for your spiritual needs.</p>
                    </div>

                    {/* Filters Bar */}
                    <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="w-full md:w-1/3">
                            <MotionSearch onSearch={handleQuery} placeholder="Search by name, puja, or expertise..." />
                        </div>

                        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                            <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="Specialization" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Specializations</SelectItem>
                                    {specializations.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>

                            <Select value={languageFilter} onValueChange={setLanguageFilter}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Language" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Languages</SelectItem>
                                    {languagesList.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                </SelectContent>
                            </Select>

                            <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Experience" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Any Experience</SelectItem>
                                    <SelectItem value="10+">10+ Years</SelectItem>
                                    <SelectItem value="5-10">5-10 Years</SelectItem>
                                    <SelectItem value="<5">&lt; 5 Years</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Grid */}
                {filtered.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                        <div className="text-lg font-medium text-gray-900 mb-1">No pandits match your criteria</div>
                        <p className="text-gray-500">Try removing some filters or searching for something else.</p>
                        <Button
                            variant="link"
                            className="mt-2 text-orange-600"
                            onClick={() => {
                                setQuery('');
                                setSpecializationFilter('all');
                                setExperienceFilter('all');
                                setLanguageFilter('all');
                            }}
                        >
                            Clear all filters
                        </Button>
                    </div>
                ) : (
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: {},
                            visible: { transition: { staggerChildren: 0.05 } }
                        }}
                    >
                        {filtered.map((pandit) => (
                            <motion.div key={pandit.id} variants={fadeInUp} whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
                                <Card className="overflow-hidden h-full flex flex-col border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 relative group bg-white">
                                    {/* Availability Badge */}
                                    <div className="absolute top-3 right-3 z-20">
                                        {pandit.is_available ? (
                                            <Badge className="bg-green-500 hover:bg-green-600 text-white border-0 px-2 py-0.5 text-xs font-semibold">Available</Badge>
                                        ) : (
                                            <Badge variant="destructive" className="px-2 py-0.5 text-xs font-semibold">Unavailable</Badge>
                                        )}
                                    </div>

                                    <CardContent className="pt-8 pb-4 flex flex-col items-center text-center flex-grow px-4">
                                        {/* Avatar */}
                                        <div className="relative mb-3">
                                            <Avatar className="h-24 w-24 border-[3px] border-orange-200 shadow-sm">
                                                <AvatarImage src={pandit.user_details.profile_pic_url} className="object-cover" />
                                                <AvatarFallback className="text-xl bg-orange-50 text-orange-600 font-bold">
                                                    {(pandit.user_details?.full_name || "Pt").substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            {pandit.is_verified && (
                                                <div className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-1 border-2 border-white" title="Verified">
                                                    <ShieldCheck className="w-3 h-3" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Name */}
                                        <h3 className="font-bold text-lg text-gray-900 mb-1">{pandit.user_details?.full_name || "Pandit"}</h3>

                                        {/* Simple Rating (Grey/Star) per screenshot */}
                                        <div className="flex items-center justify-center gap-1 mb-4">
                                            <div className="flex text-gray-300">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(Number(pandit.rating || 0)) ? 'fill-gray-400 text-gray-400' : 'fill-gray-200 text-gray-200'}`} />
                                                ))}
                                            </div>
                                            <span className="text-xs text-gray-500">{Number(pandit.rating || 0).toFixed(2)} ({pandit.review_count || 0})</span>
                                        </div>

                                        {/* Stats Row (Beige Boxes) */}
                                        <div className="grid grid-cols-2 gap-3 w-full mb-4">
                                            <div className="bg-[#FFF8F3] rounded-lg p-2 flex flex-col items-center justify-center">
                                                <span className="text-orange-600 font-bold text-lg">{pandit.experience_years}</span>
                                                <span className="text-[10px] text-gray-500 uppercase tracking-wide">Years Exp.</span>
                                            </div>
                                            <div className="bg-[#FFF8F3] rounded-lg p-2 flex flex-col items-center justify-center">
                                                <span className="text-orange-600 font-bold text-lg">{pandit.bookings_count || 0}</span>
                                                <span className="text-[10px] text-gray-500 uppercase tracking-wide">Pujas Done</span>
                                            </div>
                                        </div>

                                        {/* Info Rows (Left aligned) */}
                                        <div className="w-full space-y-3 text-left">
                                            {/* Specializations */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                                                        <img src="/icons/gate.svg" className="w-3.5 h-3.5 opacity-60 hidden" alt="" />
                                                        Specializations
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {pandit.expertise.split(',').slice(0, 2).map((s, i) => (
                                                        <span key={i} className="px-2 py-0.5 border border-orange-200 text-orange-700 bg-orange-50/50 rounded text-xs font-medium inline-block">
                                                            {s.trim()}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Languages */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                                                        <Languages className="w-3.5 h-3.5 text-orange-500" /> Languages
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 truncate">{pandit.language}</p>
                                            </div>

                                            {/* Location */}
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <MapPin className="w-4 h-4 text-orange-500" />
                                                <span>Nepal</span>
                                            </div>
                                        </div>

                                    </CardContent>

                                    <div className="border-t border-gray-100 border-dashed mx-4"></div>

                                    <CardFooter className="p-4 flex flex-col gap-3 bg-white">
                                        <div className="flex justify-between items-center w-full">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-gray-500">Starting from</span>
                                                <span className="text-lg font-bold text-orange-600">₹1100</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="icon" variant="outline" className="h-9 w-9 border-gray-200 text-gray-600 hover:text-orange-600 hover:bg-orange-50">
                                                    <Video className="w-4 h-4" />
                                                </Button>
                                                <Button size="icon" variant="outline" className="h-9 w-9 border-gray-200 text-gray-600 hover:text-orange-600 hover:bg-orange-50">
                                                    <Calendar className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        <Link to={`/pandits/${pandit.id}`} className="w-full">
                                            <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold">
                                                View Profile
                                            </Button>
                                        </Link>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
            <Footer />
        </div>
    );
};