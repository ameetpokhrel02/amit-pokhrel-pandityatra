import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, MapPin, Clock, DollarSign, Sparkles, Bot, X } from 'lucide-react';
import { motion } from 'framer-motion';
import apiClient from '@/lib/api-client';
import { useLocation } from '@/hooks/useLocation';
import { DateTime } from 'luxon';
import { useCart } from '@/hooks/useCart';
import { ShoppingCart } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

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
  embedded?: boolean;
}

const BookingForm: React.FC<BookingFormProps> = ({ panditId, serviceId, onBookingSuccess, embedded = false }) => {
  const navigate = useNavigate();
  const location = useRouterLocation();
  const { timezone, latitude, longitude, formatWithNepalTime, country, currency } = useLocation();
  const { addItem, openDrawer } = useCart();
  const state = location.state as { panditId?: number; serviceId?: number; serviceName?: string; price?: string } | null;

  const [pandits, setPandits] = useState<Pandit[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [samagriRequirements, setSamagriRequirements] = useState<any[]>([]);
  const [aiSamagriLoading, setAiSamagriLoading] = useState(false);

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
    fetchPandits(state?.serviceId);
  }, [state?.serviceId]);

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

  useEffect(() => {
    if (formData.service) {
      fetchAIRecommendations(Number(formData.service));
    }
  }, [formData.service]);

  const fetchPandits = async (serviceId?: number) => {
    try {
      const response = await apiClient.get('/pandits/', {
        params: {
          is_verified: true,
          service_id: serviceId
        }
      });
      const data = response.data.results || response.data;
      setPandits(data);

      // Auto-select pandit if only one is available for this service
      if (serviceId && data.length === 1 && !formData.pandit) {
        handleInputChange('pandit', data[0].id);
      }
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


  // Enhanced AI-based samagri recommendations with location context
  const fetchAIRecommendations = async (serviceId: number) => {
    setAiSamagriLoading(true);
    try {
      const response = await apiClient.post('/samagri/ai_recommend/', {
        puja_id: serviceId,
        user_notes: formData.notes || '',
        location: formData.service_location,
        customer_timezone: timezone,
        customer_location: latitude && longitude ? `${latitude},${longitude}` : null,
        budget_preference: 'standard' // Could be made dynamic
      });
      
      // Enhanced recommendations with auto-selection logic
      const recommendations = response.data.recommendations || [];
      const enhancedRecommendations = recommendations.map((item: any) => ({
        ...item,
        isAutoSelected: item.is_essential || item.confidence > 0.8,
        reason: item.reason || `Recommended for ${formData.service_location} puja`,
        confidence: item.confidence || 0.7
      }));
      
      setSamagriRequirements(enhancedRecommendations);
      
      // Auto-add essential items to cart
      const essentialItems = enhancedRecommendations.filter((item: any) => item.isAutoSelected);
      if (essentialItems.length > 0) {
        essentialItems.forEach((item: any) => {
          addItem({
            id: item.id ? `samagri-${item.id}` : `samagri-${item.name}`,
            title: item.name,
            price: item.price ? parseFloat(item.price) : 0,
            meta: { 
              type: 'samagri', 
              pujaId: serviceId,
              isEssential: true,
              aiRecommended: true,
              confidence: item.confidence
            }
          }, item.quantity);
        });
      }
    } catch (err) {
      console.error("Failed to load AI samagri recommendations", err);
      setSamagriRequirements([]);
    } finally {
      setAiSamagriLoading(false);
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
            service_id: formData.service,
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

  const handleAddAllToCart = () => {
    if (samagriRequirements.length === 0) return;
    samagriRequirements.forEach((req: any) => {
      addItem({
        id: req.id ? `samagri-${req.id}` : `samagri-${req.name}`,
        title: req.name,
        price: req.price ? parseFloat(req.price) : 0,
        meta: { type: 'samagri', pujaId: formData.service }
      }, req.quantity);
    });
    openDrawer();
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
        customer_timezone: timezone,
        customer_location: latitude && longitude ? `${latitude},${longitude}` : null,
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

  const MainContent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8"
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
                {services.filter(s => s.is_available).length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-yellow-800 text-sm">
                    No services are currently available for this pandit.<br />
                    <span className="text-gray-500">Try selecting another pandit or <a href="/contact" className="text-primary underline">contact support</a> for help.</span>
                  </div>
                ) : (
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
                )}
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

            {/* Timezone Info with Enhanced Location Context */}
            {formData.booking_date && formData.booking_time && (
              <div className="text-xs bg-blue-50 p-3 rounded-md text-blue-700 border border-blue-100 italic">
                <Clock className="w-3 h-3 inline-block mr-1 mb-0.5" />
                Selected: {formatWithNepalTime(DateTime.fromISO(`${formData.booking_date}T${formData.booking_time}`).toISO()!)}
                {country && (
                  <div className="mt-1 flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    <span>Detected location: {country}</span>
                    <Badge variant="outline" className="text-xs">
                      {currency} recommended
                    </Badge>
                  </div>
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
            {/* Samagri & Requirements */}
            <div className="bg-orange-50 p-4 rounded-lg space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="samagri"
                  checked={formData.samagri_required}
                  onCheckedChange={(checked) => handleInputChange('samagri_required', checked)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="samagri" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Include Samagri Kit (+₹500)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    We will arrange all necessary items for the puja.
                  </p>
                </div>
              </div>

              {/* AI Samagri Suggestions */}
              {formData.samagri_required && (
                <div className="mt-4 space-y-3 bg-white/50 p-4 rounded-xl border border-orange-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Sparkles className="w-12 h-12 text-orange-500" />
                  </div>

                  <div className="flex items-center justify-between relative z-10">
                    <p className="text-sm font-bold text-orange-900 flex items-center gap-2">
                      <Bot className="w-4 h-4 text-orange-600" />
                      AI Recommended Samagri
                    </p>
                    <Badge variant="outline" className="bg-orange-100/50 text-orange-700 border-orange-200">
                      Smart Selection
                    </Badge>
                  </div>
                  {aiSamagriLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Loading AI recommendations...
                    </div>
                  ) : samagriRequirements.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2 relative z-10">
                      {samagriRequirements.map((req: any, idx: number) => (
                        <div key={req.id || req.name || idx} className="flex items-center justify-between bg-white p-2 rounded-lg border border-orange-50 hover:border-orange-200 transition-colors shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                              <span className="text-orange-600 font-bold text-xs">{req.name?.charAt(0)}</span>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-800">{req.name}</p>
                              <p className="text-[10px] text-gray-500">{req.quantity} {req.unit} {req.price ? `• ₹${req.price}` : ''}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSamagriRequirements(prev => prev.filter((r, i) => (r.id || r.name || i) !== (req.id || req.name || idx)));
                            }}
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                            title="I have this item"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 italic">No recommendations found.</div>
                  )}
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleAddAllToCart}
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold h-10 shadow-lg shadow-orange-200 mt-2 flex items-center justify-center gap-2 group"
                  >
                    <ShoppingCart className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Add All to Cart
                  </Button>
                  <p className="text-[10px] text-center text-gray-400 italic">Anita's Journey: Remove items you already have. Everything else goes to your cart.</p>
                </div>
              )}
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

  return embedded ? MainContent : (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        {MainContent}
      </div>
      <Footer />
    </>
  );
};

export default BookingForm;
