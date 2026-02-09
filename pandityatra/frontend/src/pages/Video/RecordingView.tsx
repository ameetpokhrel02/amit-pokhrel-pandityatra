import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, Play, Info } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';

const RecordingView: React.FC = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchBookingData = async () => {
            try {
                // We'll use the existing fetchBookings or create a single fetch if needed
                // For efficiency, let's assume we can fetch by ID
                const response = await fetch(`/api/bookings/${bookingId}/`);
                const data = await response.json();
                setBooking(data);
            } catch (err) {
                console.error("Failed to fetch recording:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchBookingData();
    }, [bookingId]);

    if (loading) return <div className="p-10 text-center">Loading recording...</div>;

    const recordingUrl = booking?.recording_url;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-8 mt-16">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/my-bookings')}
                    className="mb-6"
                >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back to My Bookings
                </Button>

                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <Card className="aspect-video bg-black overflow-hidden relative flex items-center justify-center border-none shadow-xl">
                            {recordingUrl ? (
                                <iframe
                                    src={recordingUrl}
                                    className="w-full h-full"
                                    allow="autoplay; fullscreen"
                                    title="Puja Recording"
                                />
                            ) : (
                                <div className="text-center text-white p-8">
                                    <Play className="h-16 w-16 mx-auto mb-4 text-orange-500 opacity-50" />
                                    <h3 className="text-xl font-medium mb-2">Recording is being processed</h3>
                                    <p className="text-slate-400 max-w-sm mx-auto">
                                        Daily.co is preparing your sacred session recording. Please check back in a few minutes.
                                    </p>
                                    <Button
                                        variant="outline"
                                        className="mt-6 border-white/20 text-white hover:bg-white/10"
                                        onClick={() => window.location.reload()}
                                    >
                                        Refresh Status
                                    </Button>
                                </div>
                            )}
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="p-6 border-orange-100 bg-orange-50/30">
                            <h2 className="text-xl font-bold text-orange-800 mb-4 flex items-center">
                                <Info className="h-5 w-5 mr-2" />
                                Puja Summary
                            </h2>
                            <div className="space-y-4 text-sm">
                                <div className="flex justify-between border-b border-orange-100 pb-2">
                                    <span className="text-orange-900/60 font-medium">Puja Type</span>
                                    <span className="font-semibold">Bratabandha</span>
                                </div>
                                <div className="flex justify-between border-b border-orange-100 pb-2">
                                    <span className="text-orange-900/60 font-medium">Pandit</span>
                                    <span className="font-semibold">Pandit Ramesh</span>
                                </div>
                                <div className="flex justify-between border-b border-orange-100 pb-2">
                                    <span className="text-orange-900/60 font-medium">Date</span>
                                    <span className="font-semibold">15 Jan 2026</span>
                                </div>
                                <div className="flex justify-between border-b border-orange-100 pb-2">
                                    <span className="text-orange-900/60 font-medium">Duration</span>
                                    <span className="font-semibold">45 Minutes</span>
                                </div>
                            </div>
                        </Card>

                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-blue-800 text-sm">
                            <p className="font-semibold mb-1">Notice:</p>
                            <p>Recordings are available for 30 days. You can download this video for your personal archives.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecordingView;
