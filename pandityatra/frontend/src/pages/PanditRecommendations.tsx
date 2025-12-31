import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchRecommendations, type RecommendedPandit } from '@/lib/api';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Languages, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

const PanditRecommendations: React.FC = () => {
    const [pandits, setPandits] = useState<RecommendedPandit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadRecommendations = async () => {
            try {
                const data = await fetchRecommendations();
                setPandits(data);
            } catch (err: any) {
                setError(err.message || 'Failed to load recommendations.');
            } finally {
                setLoading(false);
            }
        };
        loadRecommendations();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <Navbar />
                <div className="text-center mt-20">
                    <h2 className="text-2xl font-bold text-destructive mb-4">Oops!</h2>
                    <p className="text-muted-foreground">{error}</p>
                    <Button variant="outline" className="mt-6" onClick={() => window.location.reload()}>
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-8 mt-16 text-center">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-4xl font-bold text-primary mb-2">Recommended for You</h1>
                    <p className="text-lg text-muted-foreground mb-12">
                        Based on your preferences and history, here are the best Pandits for your spiritual journey.
                    </p>
                </motion.div>

                {pandits.length === 0 ? (
                    <div className="text-center text-muted-foreground py-10">
                        No specific recommendations found at this moment. Try browsing all pandits.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {pandits.map((pandit, index) => (
                            <motion.div
                                key={pandit.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-primary/20">
                                    <CardHeader className="text-left pb-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-xl font-bold mb-1">{pandit.full_name}</CardTitle>
                                                <div className="flex items-center text-yellow-500">
                                                    <Star className="h-4 w-4 fill-current mr-1" />
                                                    <span className="text-sm font-medium">{pandit.rating.toFixed(1)}</span>
                                                </div>
                                            </div>
                                            <div className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full font-semibold">
                                                {(pandit.recommendation_score * 10).toFixed(0)}% Match
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="text-left space-y-3">
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <Award className="h-4 w-4 mr-2 text-primary" />
                                            <span>{pandit.expertise}</span>
                                        </div>
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <Languages className="h-4 w-4 mr-2 text-primary" />
                                            <span>{pandit.language}</span>
                                        </div>
                                        <p className="text-sm line-clamp-3 mt-2">{pandit.bio}</p>
                                    </CardContent>
                                    <CardFooter>
                                        <Link to={`/pandits/${pandit.id}`} className="w-full">
                                            <Button className="w-full">View Profile</Button>
                                        </Link>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PanditRecommendations;
