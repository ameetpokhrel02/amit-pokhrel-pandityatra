import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, MapPin, Clock, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import apiClient from '@/lib/api-client';

interface Pandit {
  id: number;
  full_name: string;
  expertise: string;
  language: string;
  rating: number;
}

interface Service {
  id: number;
  pandit: number;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  is_available: boolean;
}

interface BookingFormProps {
  panditId?: number;
  serviceId?: number;
  onBookingSuccess?: () => void;
}

const BookingForm: React.FC<BookingFormProps> = ({ panditId, serviceId, onBookingSuccess }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { panditId?: number; serviceId?: number; serviceName?: string; price?: string } | null;

  const [pandits, setPandits] = useState<Pandit[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  // State for custom price if passed from service card
  const [customPrice, setCustomPrice] = useState<number | null>(state?.price ? parseFloat(state.price) : null);

  const [formData, setFormData] = useState({
    pandit: panditId || state?.panditId || '',
    service: serviceId || state?.serviceId || '',
    booking_date: '',
    booking_time: '',
    service_location: 'ONLINE',
    samagri_required: true,
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch pandits
  useEffect(() => {
    fetchPandits();
  }, []);

  // Fetch services when pandit changes
  useEffect(() => {
    if (formData.pandit) {
      fetchServices(Number(formData.pandit));
    }
  }, [formData.pandit]);

  // Fetch available slots when date changes
  useEffect(() => {
    if (formData.pandit && formData.booking_date) {
      fetchAvailableSlots();
    }
  }, [formData.pandit, formData.booking_date]);

  const fetchPandits = async () => {
    try {
      const response = await apiClient.get('/pandits/', {
        params: { is_verified: true }
      });
      setPandits(response.data.results || response.data);
    } catch (err) {
      console.error('Failed to fetch pandits:', err);
      setError('Failed to load pandits');
    }
  };

  const fetchServices = async (panditId: number) => {
    try {
      const response = await apiClient.get(`/services/`, {
        params: { pandit: panditId }
      });
      setServices(response.data.results || response.data);
    } catch (err) {
      console.error('Failed to fetch services:', err);
      setError('Failed to load services');
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      setSlotsLoading(true);
      const response = await apiClient.get(
        '/bookings/available_slots/',
        {
          params: {
            pandit_id: formData.pandit,
            date: formData.booking_date,
          },
        }
      );
      setAvailableSlots(response.data.available_slots || []);
      setFormData(prev => ({ ...prev, booking_time: '' }));
    } catch (err) {
      console.error('Failed to fetch slots:', err);
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const calculateFees = () => {
    const selectedService = services.find(s => s.id === Number(formData.service));
    // Use customPrice if available (from PanditProfile), otherwise fallback to service base price
    const serviceFee = customPrice !== null ? customPrice : (selectedService?.price || 0);
    const sammagriFee = formData.samagri_required ? 500 : 0;
    return { serviceFee, sammagriFee, total: serviceFee + sammagriFee };
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }

      const selectedService = services.find(s => s.id === Number(formData.service));
      const submitData = {
        pandit: Number(formData.pandit),
        service: Number(formData.service),
        service_name: selectedService?.name || '',
        service_location: formData.service_location,
        booking_date: formData.booking_date,
        booking_time: formData.booking_time,
        samagri_required: formData.samagri_required,
        notes: formData.notes,
      };

      await apiClient.post('/bookings/', submitData);

      setSuccess('Booking created successfully! Waiting for pandit confirmation.');
      setTimeout(() => {
        onBookingSuccess?.();
        navigate('/my-bookings');
      }, 2000);
    } catch (err: any) {
      console.error('Booking failed:', err);
      const errorMsg =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        (typeof err.response?.data === 'string' ? err.response?.data : null) ||
        err.message ||
        'Booking failed';

      // Handle array of errors
      if (typeof errorMsg === 'object') {
        setError(Object.values(errorMsg).flat().join(', '));
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const fees = calculateFees();
  const minDate = new Date().toISOString().split('T')[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto p-4"
    >
      <Card>
        <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50">
          <CardTitle className="text-2xl">Book a Pandit</CardTitle>
          <p className="text-sm text-gray-600 mt-2">Schedule your sacred ceremony</p>
        </CardHeader>

        <CardContent className="pt-6">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Pandit Selection */}
            <div className="space-y-2">
              <Label htmlFor="pandit">Select Pandit *</Label>
              <Select
                value={String(formData.pandit)}
                onValueChange={(value) => handleInputChange('pandit', value)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Choose a verified pandit" />
                </SelectTrigger>
                <SelectContent>
                  {pandits.map((pandit) => (
                    <SelectItem key={pandit.id} value={String(pandit.id)}>
                      <div>
                        <p className="font-semibold">{pandit.full_name}</p>
                        <p className="text-xs text-gray-500">{pandit.expertise}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Service Selection */}
            {formData.pandit && (
              <div className="space-y-2">
                <Label htmlFor="service">Select Service *</Label>
                <Select
                  value={String(formData.service)}
                  onValueChange={(value) => handleInputChange('service', value)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Choose a puja service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.filter(s => s.is_available).map((service) => (
                      <SelectItem key={service.id} value={String(service.id)}>
                        <div>
                          <p className="font-semibold">{service.name}</p>
                          <p className="text-xs text-gray-500">
                            ₹{service.price} • {service.duration_minutes} mins
                          </p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date Selection */}
            <div className="space-y-2">
              <Label htmlFor="booking_date">Booking Date *</Label>
              <Input
                id="booking_date"
                type="date"
                value={formData.booking_date}
                onChange={(e) => handleInputChange('booking_date', e.target.value)}
                min={minDate}
                className="h-10"
                required
              />
            </div>

            {/* Time Selection */}
            {formData.booking_date && formData.pandit && (
              <div className="space-y-2">
                <Label htmlFor="booking_time">Booking Time *</Label>
                {slotsLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Loading available slots...
                  </div>
                ) : availableSlots.length > 0 ? (
                  <Select
                    value={formData.booking_time}
                    onValueChange={(value) => handleInputChange('booking_time', value)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-red-500">No available slots for this date</p>
                )}
              </div>
            )}

            {/* Service Location */}
            <div className="space-y-2">
              <Label htmlFor="service_location">Service Location *</Label>
              <Select
                value={formData.service_location}
                onValueChange={(value) => handleInputChange('service_location', value)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONLINE">
                    <div className="flex items-center gap-2">
                      <span>Online (Video Call)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="HOME">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>My Home</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="TEMPLE">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>Temple</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="PANDIT_LOCATION">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>Pandit's Location</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Samagri Checkbox */}
            <div className="flex items-center space-x-2 bg-orange-50 p-4 rounded-lg">
              <Checkbox
                id="samagri_required"
                checked={formData.samagri_required}
                onCheckedChange={(checked) => handleInputChange('samagri_required', checked)}
              />
              <Label htmlFor="samagri_required" className="text-sm cursor-pointer">
                Include Samagri (Puja Materials) - ₹500
              </Label>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Special Requests (Optional)</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any special requirements or preferences..."
                className="w-full h-24 border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Fee Summary */}
            {formData.service && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Service Fee:</span>
                  <span className="font-semibold">₹{fees.serviceFee}</span>
                </div>
                {formData.samagri_required && (
                  <div className="flex justify-between text-sm">
                    <span>Samagri Fee:</span>
                    <span className="font-semibold">₹{fees.sammagriFee}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between text-base font-bold">
                  <span>Total Amount:</span>
                  <span className="text-orange-600">₹{fees.total}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={
                loading ||
                !formData.pandit ||
                !formData.service ||
                !formData.booking_date ||
                !formData.booking_time
              }
              className="w-full h-12 text-base bg-orange-600 hover:bg-orange-700"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                'Confirm Booking'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default BookingForm;
