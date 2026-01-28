

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchPandit } from "@/lib/api";
import type { Pandit } from "@/lib/api";
import { Loader2, ArrowLeft, ShieldCheck, Star, Users, Clock, Video, MapPin, Languages, Calendar, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


const PanditProfile = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [pandit, setPandit] = useState<Pandit | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadProfile = async () => {
            if (!id) return;
            try {
                const data = await fetchPandit(parseInt(id));
                setPandit(data);
            } catch (err: any) {
                setError("Failed to load pandit profile");
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-orange-600 w-10 h-10" />
            </div>
        );
    }
    if (error || !pandit) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Found</h2>
                <p className="text-gray-500 mb-6">The pandit profile you are looking for does not exist or is unavailable.</p>
                <Button onClick={() => navigate(-1)} variant="outline">
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 pb-16">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-orange-600 to-amber-500 py-12 px-4 md:px-0 mb-10 shadow-lg">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8">
                    {/* Avatar */}
                    <div className="flex-shrink-0 flex flex-col items-center">
                        <Avatar className="w-36 h-36 border-4 border-white shadow-xl">
                            <AvatarImage src={pandit.user_details.profile_pic_url || ''} />
                            <AvatarFallback className="text-5xl bg-orange-100 text-orange-600">
                                {pandit.user_details.full_name?.charAt(0) || 'P'}
                            </AvatarFallback>
                        </Avatar>
                        {pandit.is_verified && (
                            <Badge variant="secondary" className="mt-3 bg-blue-50 text-blue-700 border-blue-200 px-3 py-1 flex items-center gap-1">
                                <ShieldCheck size={16} /> Verified
                            </Badge>
                        )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{pandit.user_details.full_name}</h1>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                            <span className="flex items-center gap-1 text-orange-100 text-lg font-semibold">
                                <Star className="w-5 h-5 text-yellow-300" />
                                {pandit.rating?.toFixed(2) || '0.00'} / 5.0
                            </span>
                            <span className="flex items-center gap-1 text-orange-100">
                                <Users className="w-4 h-4" /> {pandit.experience_years}+ yrs exp
                            </span>
                            <span className="flex items-center gap-1 text-orange-100">
                                <Languages className="w-4 h-4" /> {pandit.language}
                            </span>
                        </div>
                        <p className="text-orange-50 text-lg max-w-2xl mx-auto mb-4">
                            {pandit.bio || `Specialist in ${pandit.expertise} with over ${pandit.experience_years} years of experience practicing vedic rituals.`}
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-2">
                            {pandit.expertise.split(',').map((skill, idx) => (
                                <Badge key={idx} variant="outline" className="bg-white/20 border-white/30 text-white font-medium">
                                    {skill.trim()}
                                </Badge>
                            ))}
                        </div>
                        <div className="mt-6 flex flex-wrap gap-4 justify-center md:justify-start">
                            {pandit.is_available && (
                                <Button className="bg-white text-orange-600 font-bold shadow hover:bg-orange-50 transition-all">
                                    <Calendar className="w-4 h-4 mr-2" /> Book Now
                                </Button>
                            )}
                            <Button variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                                <Video className="w-4 h-4 mr-2" /> Request Video Call
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Services */}
                <div className="md:col-span-2 space-y-8">
                    <Card className="shadow-md border border-orange-100">
                        <CardContent className="py-6">
                            <h2 className="text-2xl font-bold text-orange-700 mb-6 flex items-center gap-2">
                                <span className="bg-orange-100 text-orange-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">₹</span>
                                Services & Pricing
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {(pandit.services && pandit.services.length > 0) ? (
                                    pandit.services.map((service) => (
                                        <Card key={service.id} className="border border-orange-50 shadow-sm hover:shadow-lg transition-all duration-300">
                                            <CardContent className="p-4 flex flex-col gap-2">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {service.duration_minutes} min
                                                    </Badge>
                                                </div>
                                                <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">
                                                    {service.puja_details?.name || 'Puja Service'}
                                                </h3>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-sm text-gray-500">{service.puja_details?.description}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-auto">
                                                    <span className="text-lg font-bold text-orange-700">
                                                        ₹{Number(service.custom_price || service.puja_details?.base_price || 0).toLocaleString('en-IN')}
                                                    </span>
                                                    <Button size="sm" className="ml-auto bg-orange-600 hover:bg-orange-700 text-white font-medium">
                                                        <Calendar className="w-4 h-4 mr-1" /> Book
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <div className="p-6 bg-white rounded-xl border border-dashed border-gray-300 text-center text-gray-500 col-span-2">
                                        No services listed yet.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Reviews */}
                    <Card className="shadow-md border border-orange-100">
                        <CardContent className="py-6">
                            <h2 className="text-2xl font-bold text-orange-700 mb-6 flex items-center gap-2">
                                <Star className="w-6 h-6 text-yellow-400" />
                                Reviews & Ratings
                            </h2>
                            <div className="space-y-4">
                                {(pandit.reviews && pandit.reviews.length > 0) ? (
                                    pandit.reviews.map((review) => (
                                        <div key={review.id} className="bg-orange-50/50 rounded-lg p-4 border border-orange-100 flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="w-8 h-8">
                                                    <AvatarImage src={review.customer_avatar || ''} />
                                                    <AvatarFallback>{review.customer_name?.charAt(0) || 'U'}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-semibold text-gray-800">{review.customer_name}</span>
                                                <span className="flex items-center gap-1 text-yellow-500 ml-2">
                                                    <Star className="w-4 h-4" /> {review.rating}
                                                </span>
                                            </div>
                                            <div className="text-gray-700 text-sm">{review.comment}</div>
                                            <div className="text-xs text-gray-400 mt-1">{new Date(review.created_at).toLocaleDateString()}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-6 bg-white rounded-xl border border-dashed border-gray-300 text-center text-gray-500">
                                        No reviews yet.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Availability & Info */}
                <div className="md:col-span-1 space-y-8">
                    <Card className="shadow-md border border-orange-100">
                        <CardContent className="py-6">
                            <h3 className="font-semibold text-orange-700 mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5" /> Availability
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Status</span>
                                    {pandit.is_available ? (
                                        <span className="text-green-600 font-medium flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                            Available Today
                                        </span>
                                    ) : (
                                        <span className="text-red-500 font-medium flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                            Not Available
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Video Consult</span>
                                    <span className="font-medium">Supported</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Home Visit</span>
                                    <span className="font-medium">Supported</span>
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-400 text-center">
                                Detailed calendar availability coming soon.
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default PanditProfile;
