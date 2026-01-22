import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { fetchPandit, type Pandit } from '@/lib/api';
import { Loader2, Clock, Video, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PanditServicesModalProps {
  panditId: number;
  panditName: string;
}

export const PanditServicesModal: React.FC<PanditServicesModalProps> = ({
  panditId,
  panditName,
}) => {
  const [pandit, setPandit] = useState<Pandit | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (open && panditId) {
      loadPanditData();
    }
  }, [open, panditId]);

  const loadPanditData = async () => {
    setLoading(true);
    try {
      const data = await fetchPandit(panditId);
      setPandit(data);
    } catch (error) {
      console.error("Failed to load pandit services:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = (service: any) => {
    if (!pandit) return;
    // Navigate to booking page with pre-selected data
    navigate("/booking", {
      state: {
        panditId: pandit.id,
        serviceId: service.puja_details.id,
        serviceName: service.puja_details.name,
        price: service.custom_price
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">View Services</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Services by {panditName}</DialogTitle>
          <DialogDescription>
            Select a service to book with this pandit.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : pandit?.services && pandit.services.length > 0 ? (
            pandit.services.map((service) => (
              <div
                key={service.id}
                className="border rounded-lg p-4 hover:bg-gray-50 flex flex-col gap-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-base">{service.puja_details.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {service.puja_details.description}
                    </p>
                  </div>
                  <span className="font-bold text-primary">₹{Math.floor(Number(service.custom_price))}</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {service.duration_minutes} min</span>
                  {service.is_online && <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-1.5 rounded"><Video className="h-3 w-3" /> Online</span>}
                  {service.is_offline && <span className="flex items-center gap-1 text-green-600 bg-green-50 px-1.5 rounded"><Home className="h-3 w-3" /> In-Person</span>}
                </div>

                <Button
                  size="sm"
                  className="w-full mt-2 bg-orange-600 hover:bg-orange-700"
                  onClick={() => handleBookNow(service)}
                >
                  Book Now
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No services listed yet for this Pandit.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

