

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
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

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
                                            <span>{email ? `${email.substring(0,3)}***@pandityatra.com` : '***@pandityatra.com'}</span>
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
                             {(!pandit.services || pandit.services.length === 0) ? (
                                 <p className="text-gray-500 italic">No specific services listed.</p>
                             ) : (
                                 <div className="grid gap-6">
                                     {pandit.services.map((service) => (
                                        <div key={service.id} className="flex flex-col md:flex-row md:items-start justify-between pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                                            <div className="md:w-3/4">
                                                <h3 className="font-semibold text-gray-900 text-lg mb-1">
                                                    {service.puja_details?.name || 'Vedic Ritual'}
                                                </h3>
                                                <p className="text-sm text-gray-600 leading-relaxed mb-2">
                                                    {service.puja_details?.description || 'A traditional Vedic ceremony performed with authentic rituals for peace and prosperity.'}
                                                </p>
                                                <Badge variant="outline" className="text-xs text-gray-500 font-normal">
                                                    Duration: ~{service.duration_minutes} mins
                                                </Badge>
                                            </div>
                                            <div className="mt-4 md:mt-0 flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-2">
                                                <span className="font-bold text-gray-900 text-lg">
                                                    NPR {parseFloat(service.custom_price).toLocaleString()}
                                                </span>
                                                {/* Hidden for now as user just wants View
                                                <Button size="sm" variant="outline" className="border-red-500 text-red-500 hover:bg-red-50 h-8">
                                                    Book
                                                </Button>
                                                */}
                                            </div>
                                        </div>
                                     ))}
                                 </div>
                             )}
                        </div>

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
