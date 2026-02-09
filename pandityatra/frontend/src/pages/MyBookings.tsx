import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { fetchBookings, updateBookingStatus, type Booking } from '@/lib/api';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Calendar, User, Clock, CheckCircle, XCircle, AlertCircle, Video, PlayCircle } from 'lucide-react';
import { format, isAfter, isBefore, subMinutes, addMinutes } from 'date-fns';

const MyBookings: React.FC = () => {
    const navigate = useNavigate();
    const { role } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [now, setNow] = useState(new Date());

    // Update current time every minute to refresh join buttons
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Fetch bookings on mount
    const loadBookings = async () => {
        try {
            setLoading(true);
            const data = await fetchBookings();
            setBookings(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load bookings.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBookings();
    }, []);

    const handleStatusUpdate = async (id: number, newStatus: string) => {
        try {
            await updateBookingStatus(id, newStatus);
            // Optimistic update or reload
            setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus as any } : b));
        } catch (err: any) {
            alert(`Failed to update status: ${err.message}`);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACCEPTED': return 'bg-green-100 text-green-800 border-green-200';
            case 'COMPLETED': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // Pending
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'ACCEPTED': return <CheckCircle className="h-4 w-4 mr-1" />;
            case 'COMPLETED': return <CheckCircle className="h-4 w-4 mr-1" />;
            case 'CANCELLED': return <XCircle className="h-4 w-4 mr-1" />;
            default: return <Clock className="h-4 w-4 mr-1" />;
        }
    };

    const isJoinable = (booking: Booking) => {
        if (!booking.booking_date || !booking.booking_time) return false;
        if (booking.status !== 'ACCEPTED') return false;

        try {
            // Combine date and time strings
            const pujaDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);

            // Allow joining 10 minutes before and up to 2 hours after
            const joinStart = subMinutes(pujaDateTime, 10);
            const joinEnd = addMinutes(pujaDateTime, 120);

            return isAfter(now, joinStart) && isBefore(now, joinEnd);
        } catch (e) {
            return false;
        }
    };

    const handleJoinPuja = (bookingId: number) => {
        navigate(`/puja-room/${bookingId}`);
    };

    const handleViewRecording = (bookingId: number) => {
        navigate(`/recording/${bookingId}`);
    };

    if (loading) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-8 mt-16">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold text-primary mb-2">My Bookings</h1>
                    <p className="text-muted-foreground">
                        Manage your {role === 'pandit' ? 'service requests' : 'spiritual appointments'}.
                    </p>
                </motion.div>

                {error && (
                    <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6 flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        {error}
                    </div>
                )}

                {bookings.length === 0 && !error ? (
                    <div className="text-center py-20 bg-card rounded-lg border border-border">
                        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-xl font-medium mb-2">No Bookings Found</h3>
                        <p className="text-muted-foreground">
                            {role === 'pandit'
                                ? "You haven't received any booking requests yet."
                                : "You haven't booked any pujas yet."}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {bookings.map((booking, index) => (
                            <motion.div
                                key={booking.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                            >
                                <Card className="hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-lg font-semibold">
                                                    Booking #{booking.id}
                                                </CardTitle>
                                                <CardDescription className="flex items-center mt-1">
                                                    <Calendar className="h-3 w-3 mr-1" />
                                                    {booking.booking_date
                                                        ? format(new Date(booking.booking_date), 'PPP p')
                                                        : 'Date N/A'}
                                                </CardDescription>
                                            </div>
                                            <div className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center ${getStatusColor(booking.status)}`}>
                                                {getStatusIcon(booking.status)}
                                                {booking.status}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="text-sm space-y-3 pt-4">
                                        <div className="flex items-start">
                                            <User className="h-4 w-4 mr-2 text-primary mt-0.5" />
                                            <div>
                                                <span className="font-medium">
                                                    {role === 'pandit' ? 'Client' : 'Pandit'}:
                                                </span>{' '}
                                                {/* In a real scenario, you'd resolve the ID to a name via another fetch or serializer expansion */}
                                                {role === 'pandit' ? `User ${booking.user}` : `Pandit ${booking.pandit}`}
                                            </div>
                                        </div>
                                        {booking.notes && (
                                            <div className="bg-muted p-3 rounded-md text-muted-foreground italic text-xs">
                                                "{booking.notes}"
                                            </div>
                                        )}
                                    </CardContent>

                                    {/* Pandit Actions */}
                                    {role === 'pandit' && booking.status === 'PENDING' && (
                                        <CardFooter className="gap-2 pt-2">
                                            <Button
                                                size="sm"
                                                className="w-full bg-green-600 hover:bg-green-700"
                                                onClick={() => handleStatusUpdate(booking.id, 'ACCEPTED')}
                                            >
                                                Accept
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                className="w-full"
                                                onClick={() => handleStatusUpdate(booking.id, 'CANCELLED')}
                                            >
                                                Decline
                                            </Button>
                                        </CardFooter>
                                    )}

                                    {role === 'pandit' && booking.status === 'ACCEPTED' && (
                                        <CardFooter className="flex-col gap-2 pt-2">
                                            <Button
                                                size="sm"
                                                className={`w-full ${isJoinable(booking) ? 'bg-green-600 hover:bg-green-700' : 'opacity-50'}`}
                                                disabled={!isJoinable(booking)}
                                                onClick={() => handleJoinPuja(booking.id)}
                                            >
                                                <Video className="h-4 w-4 mr-2" />
                                                Start Puja
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="w-full"
                                                onClick={() => handleStatusUpdate(booking.id, 'COMPLETED')}
                                            >
                                                Mark as Completed
                                            </Button>
                                        </CardFooter>
                                    )}

                                    {/* Customer Actions */}
                                    {role === 'user' && booking.status === 'ACCEPTED' && (
                                        <CardFooter className="pt-2">
                                            <Button
                                                size="sm"
                                                className={`w-full ${isJoinable(booking) ? 'bg-[#f97316] hover:bg-[#ea580c]' : 'opacity-50'}`}
                                                disabled={!isJoinable(booking)}
                                                onClick={() => handleJoinPuja(booking.id)}
                                            >
                                                <Video className="h-4 w-4 mr-2" />
                                                Join Puja
                                            </Button>
                                        </CardFooter>
                                    )}

                                    {/* Recording Action */}
                                    {booking.recording_available && booking.recording_url && (
                                        <CardFooter className="pt-2">
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                                                onClick={() => handleViewRecording(booking.id)}
                                            >
                                                <PlayCircle className="h-4 w-4 mr-2" />
                                                View Recording
                                            </Button>
                                        </CardFooter>
                                    )}
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyBookings;
