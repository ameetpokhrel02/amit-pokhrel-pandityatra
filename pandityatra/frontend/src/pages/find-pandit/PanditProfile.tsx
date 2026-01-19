
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchPandit } from "@/lib/api";
import type { Pandit } from "@/lib/api";
import { ProfileHeader } from "./components/ProfileHeader";
import { ServiceCard } from "./components/ServiceCard";
import { ReviewsList } from "./components/ReviewsList";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

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
                console.error(err);
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
        <div className="min-h-screen bg-gray-50 py-12 px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
                <Button
                    variant="ghost"
                    className="mb-6 pl-0 hover:bg-transparent text-gray-600 hover:text-orange-600 gap-2"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft size={18} />
                    Back to Search
                </Button>

                <ProfileHeader pandit={pandit} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column: Services (Most Important) */}
                    <div className="md:col-span-2 space-y-6">
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="bg-orange-100 text-orange-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">₹</span>
                                Services & Pricing
                            </h2>
                            <div className="grid grid-cols-1 gap-4">
                                {(pandit.services && pandit.services.length > 0) ? (
                                    pandit.services.map((service) => (
                                        <ServiceCard key={service.id} service={service} panditId={pandit.id} />
                                    ))
                                ) : (
                                    <div className="p-6 bg-white rounded-xl border border-dashed border-gray-300 text-center text-gray-500">
                                        No services listed yet.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="pt-8 border-t border-gray-200">
                            <ReviewsList reviews={pandit.reviews || []} />
                        </section>
                    </div>

                    {/* Right Column: Availability & Info */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm sticky top-24">
                            <h3 className="font-semibold text-gray-900 mb-3">Availability</h3>

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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PanditProfile;
