import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, Send, ChevronLeft, ChevronRight, User2, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
    fetchRecentPanditReviews,
    fetchSiteReviews,
    submitSiteReview,
    type PanditReviewData,
    type SiteReviewData,
} from '@/lib/api';

// ────────────────────────────────
// Star Rating Display
// ────────────────────────────────
const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 16 }) => (
    <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
            <Star
                key={s}
                className={s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                size={size}
            />
        ))}
    </div>
);

// ────────────────────────────────
// Interactive Star Selector
// ────────────────────────────────
const StarSelector: React.FC<{ value: number; onChange: (v: number) => void }> = ({ value, onChange }) => {
    const [hover, setHover] = useState(0);
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
                <button
                    key={s}
                    type="button"
                    onClick={() => onChange(s)}
                    onMouseEnter={() => setHover(s)}
                    onMouseLeave={() => setHover(0)}
                    className="transition-transform hover:scale-125"
                >
                    <Star
                        size={28}
                        className={
                            s <= (hover || value)
                                ? 'text-yellow-400 fill-yellow-400 drop-shadow-sm'
                                : 'text-gray-300'
                        }
                    />
                </button>
            ))}
        </div>
    );
};

// ────────────────────────────────
// Rating Bar
// ────────────────────────────────
const RatingBar: React.FC<{ label: string; count: number; total: number }> = ({ label, count, total }) => {
    const pct = total > 0 ? (count / total) * 100 : 0;
    return (
        <div className="flex items-center gap-3 text-sm">
            <span className="w-12 text-slate-600 font-medium">{label}</span>
            <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="h-full bg-yellow-400 rounded-full"
                />
            </div>
            <span className="w-10 text-right text-slate-500">{Math.round(pct)}%</span>
        </div>
    );
};

// ────────────────────────────────
// Single Review Card
// ────────────────────────────────
const ReviewCard: React.FC<{
    name: string;
    avatar: string | null;
    rating: number;
    comment: string;
    date: string;
    badge?: string;
    badgeColor?: string;
}> = ({ name, avatar, rating, comment, date, badge, badgeColor }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="h-full"
    >
        <Card className="h-full border-slate-100 hover:shadow-lg transition-all duration-300 hover:border-orange-200/50 bg-white">
            <CardContent className="p-6 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-11 w-11 border-2 border-orange-100">
                            <AvatarImage src={avatar || undefined} />
                            <AvatarFallback className="bg-orange-50 text-orange-600 font-bold text-sm">
                                {name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold text-slate-800 text-sm">{name}</p>
                            <StarRating rating={rating} size={14} />
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-slate-400">
                            {new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        {badge && (
                            <Badge variant="secondary" className={`text-[10px] px-2 py-0 ${badgeColor || 'bg-orange-50 text-orange-600'}`}>
                                {badge}
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Comment */}
                <div className="relative flex-1">
                    <Quote className="absolute -top-1 -left-1 h-5 w-5 text-orange-200/60" />
                    <p className="text-slate-600 text-sm leading-relaxed pl-5 line-clamp-4">
                        {comment}
                    </p>
                </div>
            </CardContent>
        </Card>
    </motion.div>
);

// ════════════════════════════════
// Main ReviewsSection Component
// ════════════════════════════════
const ReviewsSection: React.FC = () => {
    const { t } = useTranslation();
    const { token } = useAuth();
    const { toast } = useToast();

    // Data
    const [panditReviews, setPanditReviews] = useState<PanditReviewData[]>([]);
    const [panditStats, setPanditStats] = useState({ avg: 0, total: 0 });
    const [siteReviews, setSiteReviews] = useState<SiteReviewData[]>([]);
    const [siteStats, setSiteStats] = useState({ avg: 0, total: 0, breakdown: {} as Record<string, number> });
    const [loading, setLoading] = useState(true);

    // Tab state
    const [activeTab, setActiveTab] = useState<'pandit' | 'site'>('pandit');

    // Carousel
    const [page, setPage] = useState(0);

    // Write review form
    const [showForm, setShowForm] = useState(false);
    const [formRating, setFormRating] = useState(0);
    const [formComment, setFormComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        loadReviews();
    }, []);

    const loadReviews = async () => {
        setLoading(true);
        try {
            const [panditRes, siteRes] = await Promise.all([
                fetchRecentPanditReviews().catch(() => ({ reviews: [], average_rating: 0, total_reviews: 0 })),
                fetchSiteReviews().catch(() => ({ reviews: [], average_rating: 0, total_reviews: 0, breakdown: {} })),
            ]);
            setPanditReviews(panditRes.reviews);
            setPanditStats({ avg: panditRes.average_rating, total: panditRes.total_reviews });
            setSiteReviews(siteRes.reviews);
            setSiteStats({ avg: siteRes.average_rating, total: siteRes.total_reviews, breakdown: siteRes.breakdown });
        } catch (e) {
            console.error('Failed to load reviews', e);
        } finally {
            setLoading(false);
        }
    };

    const currentReviews = activeTab === 'pandit' ? panditReviews : siteReviews;
    const cardsPerPage = 3;
    const totalPages = Math.ceil(currentReviews.length / cardsPerPage);
    const visibleReviews = currentReviews.slice(page * cardsPerPage, (page + 1) * cardsPerPage);

    const handleSubmitReview = async () => {
        if (formRating === 0) {
            toast({ title: t('reviews.click_star'), className: 'bg-red-600 text-white border-none shadow-2xl' });
            return;
        }
        if (!formComment.trim()) {
            toast({ title: t('reviews.placeholder_comment'), className: 'bg-red-600 text-white border-none shadow-2xl' });
            return;
        }
        setSubmitting(true);
        try {
            await submitSiteReview({ rating: formRating, comment: formComment.trim() });
            setSubmitted(true);
            setShowForm(false);
            setFormRating(0);
            setFormComment('');
            toast({ title: `✅ ${t('reviews.btn_submit')}`, description: t('reviews.write_review_desc'), className: 'bg-green-600 text-white border-none shadow-2xl' });
            loadReviews();
        } catch (err: any) {
            toast({ title: 'Error', description: err?.response?.data?.detail || t('reviews.no_reviews'), className: 'bg-red-600 text-white border-none shadow-2xl' });
        } finally {
            setSubmitting(false);
        }
    };

    const currentStats = activeTab === 'pandit' ? panditStats : siteStats;

    return (
        <section className="py-20 bg-gradient-to-b from-orange-50/30 to-white overflow-hidden">
            <div className="container mx-auto max-w-7xl px-4">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 bg-orange-100 rounded-full px-4 py-2 mb-4"
                    >
                        <Star className="w-4 h-4 text-orange-600 fill-orange-600" />
                        <span className="text-sm font-semibold text-orange-700">{t('reviews.title_main')}</span>
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl md:text-4xl font-bold text-slate-900 mb-3"
                    >
                        {t('reviews.title_whats_people')} <span className="text-orange-600">{t('reviews.title_saying')}</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="text-slate-600 max-w-2xl mx-auto"
                    >
                        {t('reviews.subtitle')}
                    </motion.p>
                </div>

                {/* Tab Switcher */}
                <div className="flex justify-center mb-10">
                    <div className="inline-flex bg-white rounded-full p-1.5 shadow-sm border border-slate-100">
                        <button
                            onClick={() => { setActiveTab('pandit'); setPage(0); }}
                            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${activeTab === 'pandit'
                                ? 'bg-orange-600 text-white shadow-md'
                                : 'text-slate-600 hover:text-orange-600'
                                }`}
                        >
                            {t('reviews.tab_pandit')}
                        </button>
                        <button
                            onClick={() => { setActiveTab('site'); setPage(0); }}
                            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${activeTab === 'site'
                                ? 'bg-orange-600 text-white shadow-md'
                                : 'text-slate-600 hover:text-orange-600'
                                }`}
                        >
                            {t('reviews.tab_app')}
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-4 gap-8">
                        {/* Left: Stats Panel */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            className="lg:col-span-1"
                        >
                            <Card className="border-slate-100 bg-white sticky top-24">
                                <CardContent className="p-6 space-y-6">
                                    {/* Average Rating */}
                                    <div>
                                        <h3 className="font-bold text-slate-800 mb-3">{t('reviews.avg_rating')}</h3>
                                        <div className="flex items-end gap-3 mb-2">
                                            <span className="text-5xl font-black text-slate-900">{currentStats.avg}</span>
                                            <div className="pb-1">
                                                <StarRating rating={Math.round(currentStats.avg)} size={18} />
                                                <p className="text-xs text-slate-500 mt-1">({currentStats.total} {t('reviews.total_reviews')})</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Breakdown (site tab only) */}
                                    {activeTab === 'site' && siteStats.breakdown && (
                                        <div className="space-y-2">
                                            {['5', '4', '3', '2', '1'].map((star) => (
                                                <RatingBar
                                                    key={star}
                                                    label={`${star} ${t('reviews.star')}`}
                                                    count={siteStats.breakdown[star] || 0}
                                                    total={siteStats.total}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {/* Write Review CTA */}
                                    {token && !submitted && (
                                        <div className="pt-2">
                                            <h4 className="font-bold text-slate-800 mb-2">{t('reviews.write_review')}</h4>
                                            <p className="text-xs text-slate-500 mb-3">
                                                {t('reviews.write_review_desc')}
                                            </p>
                                            <Button
                                                onClick={() => setShowForm(!showForm)}
                                                className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-full font-semibold"
                                            >
                                                {t('reviews.write_review')}
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Right: Review Cards */}
                        <div className="lg:col-span-3 space-y-6">
                            {/* Review Form */}
                            <AnimatePresence>
                                {showForm && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <Card className="border-orange-200 bg-orange-50/30">
                                            <CardContent className="p-6 space-y-4">
                                                <h4 className="font-bold text-slate-800">{t('reviews.write_a_review')}</h4>
                                                <div>
                                                    <p className="text-sm text-slate-600 mb-2">{t('reviews.click_star')}</p>
                                                    <StarSelector value={formRating} onChange={setFormRating} />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-slate-700 block mb-1.5">{t('reviews.write_a_review')}</label>
                                                    <Textarea
                                                        placeholder={t('reviews.placeholder_comment')}
                                                        value={formComment}
                                                        onChange={(e) => setFormComment(e.target.value)}
                                                        className="min-h-[100px] bg-white border-slate-200 focus:border-orange-400"
                                                        maxLength={500}
                                                    />
                                                </div>
                                                <div className="flex gap-3">
                                                    <Button
                                                        onClick={handleSubmitReview}
                                                        disabled={submitting}
                                                        className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-6"
                                                    >
                                                        {submitting ? (
                                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                        ) : (
                                                            <Send className="h-4 w-4 mr-2" />
                                                        )}
                                                        {submitting ? t('reviews.btn_submitting') : t('reviews.btn_submit')}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => setShowForm(false)}
                                                        className="text-slate-500"
                                                    >
                                                        {t('reviews.btn_cancel')}
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Reviews Grid */}
                            {currentReviews.length === 0 ? (
                                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                                    <User2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-slate-700">{t('reviews.no_reviews')}</h3>
                                    <p className="text-slate-500 text-sm">{t('reviews.be_the_first')}</p>
                                </div>
                            ) : (
                                <>
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={`${activeTab}-${page}`}
                                            initial={{ opacity: 0, x: 30 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -30 }}
                                            transition={{ duration: 0.3 }}
                                            className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
                                        >
                                            {visibleReviews.map((review) => (
                                                <ReviewCard
                                                    key={review.id}
                                                    name={activeTab === 'pandit' ? (review as PanditReviewData).customer_name : (review as SiteReviewData).user_name}
                                                    avatar={activeTab === 'pandit' ? (review as PanditReviewData).customer_avatar : (review as SiteReviewData).user_avatar}
                                                    rating={review.rating}
                                                    comment={review.comment}
                                                    date={review.created_at}
                                                    badge={
                                                        activeTab === 'pandit'
                                                            ? t('reviews.for_pandit', { panditName: (review as PanditReviewData).pandit_name })
                                                            : (review as SiteReviewData).role === 'pandit'
                                                                ? t('reviews.pandit_badge')
                                                                : (review as SiteReviewData).role === 'vendor'
                                                                    ? t('reviews.vendor_badge')
                                                                    : undefined
                                                    }
                                                    badgeColor={
                                                        activeTab === 'pandit'
                                                            ? 'bg-blue-50 text-blue-600'
                                                            : (review as SiteReviewData).role === 'pandit'
                                                                ? 'bg-purple-50 text-purple-600'
                                                                : (review as SiteReviewData).role === 'vendor'
                                                                    ? 'bg-blue-50 text-blue-600'
                                                                    : undefined
                                                    }
                                                />
                                            ))}
                                        </motion.div>
                                    </AnimatePresence>

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="flex justify-center items-center gap-4 pt-4">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="rounded-full border-slate-200 hover:bg-orange-50 hover:border-orange-300"
                                                onClick={() => setPage(Math.max(0, page - 1))}
                                                disabled={page === 0}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <div className="flex gap-1.5">
                                                {Array.from({ length: totalPages }).map((_, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setPage(i)}
                                                        className={`w-2.5 h-2.5 rounded-full transition-all ${i === page ? 'bg-orange-600 scale-125' : 'bg-slate-300 hover:bg-slate-400'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="rounded-full border-slate-200 hover:bg-orange-50 hover:border-orange-300"
                                                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                                                disabled={page === totalPages - 1}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default ReviewsSection;
