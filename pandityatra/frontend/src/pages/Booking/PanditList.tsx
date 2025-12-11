// In frontend/src/pages/Booking/PanditList.tsx

import { useEffect, useState } from 'react';
import { fetchPandits } from '../../lib/api';
import type { Pandit } from '../../lib/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner'; 
import { Button } from '@/components/ui/button';
import { PanditServicesModal } from '@/components/PanditServicesModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export const PanditList = () => {
    const [pandits, setPandits] = useState<Pandit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    if (isLoading) {
        return <div className="flex justify-center p-8"><LoadingSpinner /></div>;
    }

    if (error) {
        return <div className="text-red-500 text-center p-8">Error: {error}</div>;
    }
    
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Available Pandits ({pandits.length})</h1>
                        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            initial="hidden"
                            animate="visible"
                            variants={{
                                hidden: {},
                                visible: { transition: { staggerChildren: 0.06 } }
                            }}
                        >
                                {pandits.map((pandit) => (
                                        <motion.div key={pandit.id} className=""
                                            variants={{
                                                hidden: { opacity: 0, y: 6 },
                                                visible: { opacity: 1, y: 0, transition: { duration: 0.28 } }
                                            }}
                                            whileHover={{ scale: 1.01 }}
                                        >
                                            <Card className="border-t-4 border-t-primary">
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
                                                                        </div>
                                                                </div>
                                                        </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                ))}
                        </motion.div>
        </div>
    );
};