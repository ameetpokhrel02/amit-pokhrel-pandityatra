
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Star, Loader2, ArrowLeft } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { motion } from 'framer-motion';

const ReviewForm = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            setError("Please select a star rating.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await apiClient.post('/reviews/create/', {
                booking: id,
                rating,
                comment
            });
            // Success!
            navigate('/my-bookings');
        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.detail || "Failed to submit review.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full"
            >
                <Button
                    variant="ghost"
                    className="mb-4 pl-0 hover:bg-transparent text-gray-600 hover:text-orange-600 gap-2"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft size={18} />
                    Back
                </Button>

                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Rate your Experience</CardTitle>
                        <CardDescription>How was your puja service?</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <Alert variant="destructive" className="mb-6">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Star Rating */}
                            <div className="flex justify-center flex-col items-center gap-2">
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            className="transition-transform hover:scale-110 focus:outline-none"
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            onClick={() => setRating(star)}
                                        >
                                            <Star
                                                size={32}
                                                className={`${star <= (hoverRating || rating)
                                                        ? "fill-yellow-400 text-yellow-400"
                                                        : "text-gray-300"
                                                    } transition-colors`}
                                            />
                                        </button>
                                    ))}
                                </div>
                                <p className="text-sm font-medium text-gray-500">
                                    {rating > 0 ? `${rating} Stars` : "Select a rating"}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="comment">Your Review</Label>
                                <Textarea
                                    id="comment"
                                    placeholder="Share your experience with the pandit..."
                                    className="min-h-[120px]"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-orange-600 hover:bg-orange-700"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                                Submit Review
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default ReviewForm;
