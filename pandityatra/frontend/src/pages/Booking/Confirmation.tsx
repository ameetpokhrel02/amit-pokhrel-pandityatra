import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
    Calendar,
    Clock,
    MapPin,
    User,
    FileText,
    Package,
    ArrowLeft,
    CreditCard,
    CheckCircle2,
    Loader2,
    AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import apiClient from '@/lib/api-client';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface ConfirmationDetails {
    bookingData: any;
    displayDetails: {
        panitName: string;
        serviceName: string;
        servicePrice: number;
        samagriFee: number;
        totalFee: number;
        samagriItems: any[];
    };
}

const Confirmation = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const state = location.state as ConfirmationDetails;

    if (!state || !state.bookingData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold mb-4">No booking details found</h2>
                <Button onClick={() => navigate('/booking')}>Go back to booking</Button>
            </div>
        );
    }

    const { bookingData, displayDetails } = state;

    const handleProceedToPayment = async () => {
        setLoading(true);
        try {
            const response = await apiClient.post('/bookings/', bookingData);
            const bookingId = response.data.id;

            toast({
                title: "Booking Created!",
                description: "Redirecting to payment gateway...",
            });

            // Store reference for success page
            sessionStorage.setItem('pending_booking_id', bookingId);

            // Navigate to payment page
            navigate(`/payment/${bookingId}`);
        } catch (err: any) {
            console.error('Booking creation failed:', err);
            console.error('Error response:', err.response?.data);
            console.error('Booking data sent:', bookingData);

            const errorMessage = err.response?.data?.detail
                || JSON.stringify(err.response?.data)
                || "Something went wrong while creating your booking.";

            toast({
                title: "Booking Failed",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50/50 py-12 px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-3xl mx-auto"
                >
                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="mb-6 hover:bg-orange-50 text-gray-600 gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Form
                    </Button>

                    <Card className="border-none shadow-2xl overflow-hidden bg-white/80 backdrop-blur-sm">
                        <CardHeader className="bg-gradient-to-r from-orange-600 to-amber-600 text-white p-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-3xl font-playfair font-bold">Review Your Journey</CardTitle>
                                    <CardDescription className="text-orange-50/80 mt-2 text-base">
                                        Please verify your sacred booking details before proceeding to payment.
                                    </CardDescription>
                                </div>
                                <CheckCircle2 className="w-16 h-16 text-white/20" />
                            </div>
                        </CardHeader>

                        <CardContent className="p-8 space-y-10">
                            {/* Primary Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-orange-100 rounded-xl text-orange-600">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Puja Service</p>
                                            <p className="text-xl font-bold text-gray-900">{displayDetails.serviceName}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-orange-100 rounded-xl text-orange-600">
                                            <User className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Selected Pandit</p>
                                            <p className="text-xl font-bold text-gray-900">{displayDetails.panitName}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                                            <Calendar className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Date & Time</p>
                                            <p className="text-xl font-bold text-gray-900">
                                                {new Date(bookingData.booking_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                            <p className="text-lg text-blue-800 font-medium">{bookingData.booking_time}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-green-50 rounded-xl text-green-600">
                                            <MapPin className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Service Location</p>
                                            <Badge variant="secondary" className="mt-1 bg-green-100 text-green-800 border-green-200">
                                                {bookingData.service_location}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Samagri & Items */}
                            {bookingData.samagri_required && (
                                <div className="bg-orange-50/30 rounded-2xl p-6 border border-orange-100">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Package className="w-5 h-5 text-orange-600" />
                                        <h3 className="font-bold text-orange-900 uppercase tracking-wider text-sm">Ritual Pack (Samagri)</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {displayDetails.samagriItems.map((item, i) => (
                                            <Badge key={i} variant="outline" className="bg-white border-orange-100 px-3 py-1 font-medium italic">
                                                {item.name} x {item.quantity}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            {bookingData.notes && (
                                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                    <div className="flex items-center gap-2 mb-2 italic">
                                        <FileText className="w-4 h-4 text-gray-400" />
                                        <h3 className="text-sm font-bold text-gray-500 uppercase">Special Instructions</h3>
                                    </div>
                                    <p className="text-gray-700 leading-relaxed font-playfair italic">"{bookingData.notes}"</p>
                                </div>
                            )}

                            {/* Financial Summary */}
                            <div className="space-y-4 pt-6">
                                <div className="flex justify-between items-center text-gray-600">
                                    <span className="font-medium">Ritual Service Fee</span>
                                    <span className="font-mono font-bold">NPR {displayDetails.servicePrice}</span>
                                </div>
                                {bookingData.samagri_required && (
                                    <div className="flex justify-between items-center text-gray-600">
                                        <span className="font-medium">Sacred Samagri Items</span>
                                        <span className="font-mono font-bold">NPR {displayDetails.samagriFee}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-6 border-t border-orange-100">
                                    <span className="text-2xl font-bold text-gray-900">Total Investment</span>
                                    <div className="text-right">
                                        <p className="text-4xl font-playfair font-black text-orange-600">NPR {displayDetails.totalFee}</p>
                                        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-1">Approx. USD {(displayDetails.totalFee * 0.0075).toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="bg-gray-50/80 p-8 gap-4">
                            <Button
                                variant="outline"
                                size="lg"
                                className="flex-1 h-14 text-lg border-2"
                                onClick={() => navigate(-1)}
                            >
                                Edit Details
                            </Button>
                            <Button
                                size="lg"
                                className="flex-[2] h-14 text-xl font-bold bg-[#15803d] hover:bg-[#166534] text-white shadow-xl shadow-green-100 gap-2"
                                onClick={handleProceedToPayment}
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    <>
                                        <CreditCard className="w-6 h-6" />
                                        Proceed to Payment
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </motion.div>
            </div>
            <Footer />
        </>
    );
};

export default Confirmation;
