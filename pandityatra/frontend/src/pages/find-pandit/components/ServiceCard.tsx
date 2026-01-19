
import type { PanditService } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Clock, Video, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ServiceCardProps {
    service: PanditService;
    panditId: number;
}

export const ServiceCard = ({ service, panditId }: ServiceCardProps) => {
    const navigate = useNavigate();

    const handleBookNow = () => {
        // Navigate to booking page with pre-selected data
        navigate("/booking", {
            state: {
                panditId: panditId,
                serviceId: service.puja_details.id,
                serviceName: service.puja_details.name,
                price: service.custom_price
            }
        });
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="font-semibold text-lg text-gray-900">{service.puja_details.name}</h3>
                    {service.puja_details.description && (
                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">{service.puja_details.description}</p>
                    )}
                </div>
                <div className="text-right">
                    <span className="block font-bold text-lg text-primary">
                        ₹{parseFloat(service.custom_price).toLocaleString()}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{service.duration_minutes} mins</span>
                </div>
                {service.is_online && (
                    <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs font-medium">
                        <Video size={12} />
                        <span>Online</span>
                    </div>
                )}
                {service.is_offline && (
                    <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs font-medium">
                        <Home size={12} />
                        <span>Home/Temple</span>
                    </div>
                )}
            </div>

            <Button
                onClick={handleBookNow}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                disabled={!service.is_active}
            >
                {service.is_active ? "Book Now" : "Currently Unavailable"}
            </Button>
        </div>
    );
};
