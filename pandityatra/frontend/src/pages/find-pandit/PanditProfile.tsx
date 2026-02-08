

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchPandit } from "@/lib/api";
import type { Pandit } from "@/lib/api";
import { Loader2, MapPin, Briefcase, Star, Phone, Mail, Facebook, Instagram, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog";
import { Check, Clock } from "lucide-react";
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const PanditProfile = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [pandit, setPandit] = useState<Pandit | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedService, setSelectedService] = useState<any>(null);

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
            <div className="flex flex-col min-h-screen">
                <Navbar />
                <div className="flex-grow flex items-center justify-center bg-gray-50">
                    <Loader2 className="animate-spin text-orange-600 w-10 h-10" />
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !pandit) {
        return (
            <div className="flex flex-col min-h-screen">
                <Navbar />
                <div className="flex-grow flex flex-col items-center justify-center bg-gray-50 px-4">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Found</h2>
                    <p className="text-gray-500 mb-6">The pandit profile you are looking for does not exist or is unavailable.</p>
                    <Button onClick={() => navigate(-1)} variant="outline">
                        Go Back
                    </Button>
                </div>
                <Footer />
            </div>
        );
    }

    // Dynamic Data
    // Ensure we access the nested structure correctly based on API response
    const userDetails = pandit.user_details || {};
    // Use type assertion or optional chaining to safely access potentially missing properties if the type definition is loose
    const fullName = userDetails.full_name || (pandit as any).full_name || "Pandit Ji";
    const profilePic = userDetails.profile_pic_url || (pandit as any).profile_pic_url;
    const email = userDetails.email || (pandit as any).email || "";

    const rating = pandit.rating || 0;
    const reviewCount = pandit.review_count || 0;
    const experience = pandit.experience_years || 0;
    // Location is not strictly in API yet, usually city/address. Using static fallback for demo matching UI if missing.
    const location = "Nepal";
    const bio = pandit.bio || `Experienced Vedic scholar specializing in ${pandit.expertise}.`;
    const specializations = pandit.expertise ? pandit.expertise.split(',').map(s => s.trim()) : [];

    const handleBookNow = () => {
        if (!selectedService || !pandit) return;

        navigate('/booking', {
            state: {
                panditId: pandit.id,
                serviceId: selectedService.puja_details?.id,
                serviceName: selectedService.puja_details?.name,
                price: selectedService.custom_price
            }
        });
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50/50 pt-20">
            <Navbar />

            <div className="container mx-auto px-4 py-8 flex-grow">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">

                    {/* LEFT SIDEBAR */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="border-border shadow-sm bg-white overflow-hidden">
                            <CardContent className="p-6 flex flex-col items-center text-center">
                                {/* Details */}
                                <div className="relative mb-4">
                                    <Avatar className="w-32 h-32 border-4 border-white shadow-lg ring-1 ring-gray-100">
                                        <AvatarImage src={profilePic} className="object-cover" />
                                        <AvatarFallback className="text-2xl bg-orange-100 text-orange-700">
                                            {fullName.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    {pandit.is_verified && (
                                        <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-1.5 rounded-full border-2 border-white" title="Verified Pandit">
                                            <ShieldCheck size={16} />
                                        </div>
                                    )}
                                </div>

                                <h1 className="text-2xl font-bold text-gray-900 mb-1">{fullName}</h1>

                                <div className="flex items-center gap-1 mb-4 text-sm">
                                    <div className="flex text-yellow-400">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-4 h-4 ${i < Math.round(rating) ? 'fill-current' : 'text-gray-300 fill-none'}`} />
                                        ))}
                                    </div>
                                    <span className="font-semibold text-gray-700">({rating})</span>
                                    <span className="text-gray-500">({reviewCount} Reviews)</span>
                                </div>

                                <div className="flex flex-col gap-2 w-full mb-6">
                                    <div className="flex items-center justify-center gap-2 text-gray-600 text-sm">
                                        <MapPin className="w-4 h-4 text-red-500" />
                                        <span>{location}</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-gray-600 text-sm">
                                        <Briefcase className="w-4 h-4 text-orange-500" />
                                        <span>{experience}+ years Experience</span>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-600 mb-6 italic px-2">
                                    "{bio.substring(0, 120)}{bio.length > 120 ? '...' : ''}"
                                </p>

                                <Button
                                    className="w-full bg-orange-600 hover:bg-orange-700 text-white mb-6"
                                    size="lg"
                                    onClick={() => {
                                        document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
                                        if (pandit.services && pandit.services.length > 0) {
                                            setSelectedService(pandit.services[0]);
                                        }
                                    }}
                                >
                                    View Services
                                </Button>

                                <Separator className="mb-6" />

                                {/* Contact Section */}
                                <div className="w-full">
                                    <h3 className="font-bold text-gray-900 mb-4">Contact Pandit</h3>
                                    <div className="flex justify-center gap-4 mb-4">
                                        <a href="#" className="text-gray-600 hover:text-blue-600"><Facebook className="w-5 h-5" /></a>
                                        <a href="#" className="text-gray-600 hover:text-pink-600"><Instagram className="w-5 h-5" /></a>
                                    </div>
                                    <div className="flex flex-col gap-3 text-sm">
                                        <div className="flex items-center gap-3 text-gray-600">
                                            <Phone className="w-4 h-4" />
                                            <span>+977-982XXXXXXX <span className="text-xs text-gray-400">(Hidden)</span></span>
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-600">
                                            <Mail className="w-4 h-4" />
                                            <span>{email ? `${email.substring(0, 3)}***@pandityatra.com` : '***@pandityatra.com'}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT CONTENT */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* About */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">About {fullName}</h2>
                            <p className="text-gray-600 leading-relaxed">
                                {bio}
                            </p>
                        </div>

                        {/* Specializations */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Specializations</h2>
                            <div className="flex flex-wrap gap-2">
                                {specializations.map((spec, index) => (
                                    <Badge key={index} variant="secondary" className="px-3 py-1 font-normal bg-gray-100 text-gray-700 hover:bg-gray-200">
                                        {spec}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Services Offered */}
                        <div id="services-section" className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Services Offered</h2>
                            {
                                (!pandit.services || pandit.services.length === 0) ? (
                                    <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-lg">
                                        <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-500 font-medium">No service provided</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {pandit.services.map((service) => (
                                            <Card key={service.id} className="border hover:border-orange-200 transition-colors cursor-pointer group overflow-hidden" onClick={() => setSelectedService(service)}>
                                                {service.puja_details?.image && (
                                                    <div className="w-full h-48 overflow-hidden bg-gray-100">
                                                        <img
                                                            src={service.puja_details.image}
                                                            alt={service.puja_details.name}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        />
                                                    </div>
                                                )}
                                                <CardContent className="p-4 flex flex-col h-full justify-between">
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900 text-lg mb-2 group-hover:text-orange-600 transition-colors">
                                                            {service.puja_details?.name || 'Vedic Ritual'}
                                                        </h3>
                                                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                                            {service.puja_details?.description || 'A traditional Vedic ceremony performed with authentic rituals for peace and prosperity.'}
                                                        </p>
                                                    </div>
                                                    <div className="mt-auto">
                                                        <div className="flex items-center justify-between mt-2">
                                                            <Badge variant="secondary" className="font-normal">
                                                                ~{service.duration_minutes} mins
                                                            </Badge>
                                                            <span className="font-bold text-gray-900">
                                                                NPR {parseFloat(service.custom_price).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            className="w-full mt-3 text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedService(service);
                                                            }}
                                                        >
                                                            View Details
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                        </div>

                        {/* Service Detail Modal */}

                        {/* Service Detail Modal */}
                        <Dialog open={!!selectedService} onOpenChange={(open) => !open && setSelectedService(null)}>
                            <DialogContent className="sm:max-w-md p-0 overflow-hidden">
                                {selectedService && (
                                    <>
                                        {selectedService.puja_details?.image && (
                                            <div className="w-full h-56 bg-gray-100 relative">
                                                <img
                                                    src={selectedService.puja_details.image}
                                                    alt={selectedService.puja_details.name}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                <h2 className="absolute bottom-4 left-6 text-2xl font-bold text-white shadow-sm">
                                                    {selectedService.puja_details?.name}
                                                </h2>
                                            </div>
                                        )}

                                        {!selectedService.puja_details?.image && (
                                            <DialogHeader className="px-6 pt-6">
                                                <DialogTitle className="text-2xl text-orange-700">
                                                    {selectedService.puja_details?.name || 'Service Details'}
                                                </DialogTitle>
                                            </DialogHeader>
                                        )}

                                        <div className="px-6 pb-6 pt-2 space-y-4">
                                            {!selectedService.puja_details?.image && (
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <Clock className="w-4 h-4" />
                                                    <span>Duration: ~{selectedService.duration_minutes} minutes</span>
                                                </div>
                                            )}

                                            {selectedService.puja_details?.image && (
                                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                                                    <Clock className="w-4 h-4" />
                                                    <span>Duration: ~{selectedService.duration_minutes} minutes</span>
                                                </div>
                                            )}

                                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                                                <p className="text-gray-700 leading-relaxed text-sm">
                                                    {selectedService.puja_details?.description || 'No description available for this service.'}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between px-2 border-t pt-4 border-gray-100">
                                                <span className="text-gray-600 font-medium">Service Fee</span>
                                                <span className="text-2xl font-bold text-orange-600">
                                                    NPR {parseFloat(selectedService.custom_price).toLocaleString()}
                                                </span>
                                            </div>

                                            <div className="space-y-3">
                                                <h4 className="font-semibold text-sm text-gray-900">What's Included?</h4>
                                                <ul className="text-sm text-gray-600 space-y-2">
                                                    <li className="flex items-center gap-2"><div className="bg-green-100 p-1 rounded-full"><Check className="w-3 h-3 text-green-600" /></div> Pandit Dakshina</li>
                                                    <li className="flex items-center gap-2"><div className="bg-green-100 p-1 rounded-full"><Check className="w-3 h-3 text-green-600" /></div> Full Ritual Performance</li>
                                                    <li className="flex items-center gap-2"><div className="bg-green-100 p-1 rounded-full"><Check className="w-3 h-3 text-green-600" /></div> Samagri Consultation</li>
                                                </ul>
                                            </div>
                                        </div>

                                        <DialogFooter className="px-6 pb-6 pt-2 flex-col sm:flex-row gap-3">
                                            <DialogClose asChild>
                                                <Button variant="outline" className="w-full sm:w-1/3 border-gray-300">Close</Button>
                                            </DialogClose>
                                            <Button className="w-full sm:w-2/3 bg-orange-600 hover:bg-orange-700 text-white shadow-md" onClick={handleBookNow}>
                                                Book Now
                                            </Button>
                                        </DialogFooter>
                                    </>
                                )}
                            </DialogContent>
                        </Dialog>

                        {/* Reviews */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">What Clients Say</h2>
                            {(!pandit.reviews || pandit.reviews.length === 0) ? (
                                <p className="text-gray-500 italic">No reviews yet.</p>
                            ) : (
                                <div className="space-y-6">
                                    {pandit.reviews.map((review) => (
                                        <div key={review.id} className="flex gap-4">
                                            <Avatar className="w-10 h-10 border border-gray-200">
                                                <AvatarImage src={review.customer_avatar || ''} />
                                                <AvatarFallback>{review.customer_name?.[0] || 'G'}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 bg-gray-50 p-4 rounded-lg rounded-tl-none">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-semibold text-gray-900 text-sm">{review.customer_name}</h4>
                                                    <div className="flex items-center gap-1">
                                                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                        <span className="text-xs font-medium text-gray-700">{review.rating}</span>
                                                    </div>
                                                </div>
                                                <p className="text-gray-600 text-sm italic">"{review.comment}"</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default PanditProfile;
