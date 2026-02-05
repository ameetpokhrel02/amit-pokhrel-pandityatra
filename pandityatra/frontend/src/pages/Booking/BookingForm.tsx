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
import {
  Loader2,
  MapPin,
  Clock,
  Sparkles,
  Bot,
  X,
  ShoppingCart,
  ChevronRight,
  AlertTriangle,
  Calendar as CalendarIcon,
  XCircle,
  Video,
  Home,
  Building2
} from 'lucide-react';
import { motion } from 'framer-motion';
import apiClient from '@/lib/api-client';
import { useLocation } from '@/hooks/useLocation';
import { DateTime } from 'luxon';
import { useCart } from '@/hooks/useCart';
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
  base_duration_minutes: number;
  base_price: number;
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
    const serviceFee = customPrice !== null ? customPrice : (selectedService?.base_price || 0);
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
      const token = localStorage.getItem('token');
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

      navigate('/booking/confirmation', {
        state: {
          bookingData: submitData,
          displayDetails: {
            panitName: pandits.find(p => p.id === Number(formData.pandit))?.full_name || 'Selected Pandit',
            serviceName: selectedService?.name || 'Selected Service',
            servicePrice: selectedService?.base_price || 0,
            samagriFee: fees.sammagriFee,
            totalFee: fees.total,
            samagriItems: samagriRequirements
          }
        }
      });
    } catch (err: any) {
      console.error('Booking preview failed:', err);
      setError('Failed to prepare booking preview');
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
      <Card className="border-orange-100 shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-b border-orange-100">
          <CardTitle className="text-2xl font-playfair text-orange-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-orange-600" />
            Book a Pandit
          </CardTitle>
          <p className="text-sm text-orange-700/70 mt-1">Schedule your sacred ceremony with Anita's guidance</p>
        </CardHeader>

        <CardContent className="pt-8 px-6 sm:px-10">
          {error && (
            <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200 text-red-800">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Pandit Selection */}
            <div className="space-y-2">
              <Label htmlFor="pandit" className="text-orange-900 font-medium">Select Pandit *</Label>
              <Select
                value={String(formData.pandit)}
                onValueChange={(value) => handleInputChange('pandit', value)}
              >
                <SelectTrigger className="h-12 border-orange-100 focus:ring-orange-500 rounded-xl">
                  <SelectValue placeholder="Choose a verified pandit" />
                </SelectTrigger>
                <SelectContent>
                  {pandits.map((pandit) => (
                    <SelectItem key={pandit.id} value={String(pandit.id)} className="focus:bg-orange-50">
                      <div>
                        <p className="font-semibold text-gray-900">{pandit.full_name}</p>
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
                <Label htmlFor="service" className="text-orange-900 font-medium">Select Service *</Label>
                {services.filter(s => s.is_available).length === 0 ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">No services available</p>
                      <p className="text-amber-700/70 mt-0.5">Try selecting another pandit or contact support for help.</p>
                    </div>
                  </div>
                ) : (
                  <Select
                    value={String(formData.service)}
                    onValueChange={(value) => handleInputChange('service', value)}
                  >
                    <SelectTrigger className="h-12 border-orange-100 focus:ring-orange-500 rounded-xl">
                      <SelectValue placeholder="Choose a puja service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.filter(s => s.is_available).map((service) => (
                        <SelectItem key={service.id} value={String(service.id)} className="focus:bg-orange-50">
                          <div>
                            <p className="font-semibold text-gray-900">{service.name}</p>
                            <p className="text-xs text-gray-500">
                              NPR {service.base_price} • {service.base_duration_minutes} mins
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
              <Label htmlFor="booking_date" className="text-orange-900 font-medium">Booking Date *</Label>
              <div className="relative">
                <Input
                  id="booking_date"
                  type="date"
                  value={formData.booking_date}
                  onChange={(e) => handleInputChange('booking_date', e.target.value)}
                  min={minDate}
                  className="h-12 border-orange-100 focus:ring-orange-500 rounded-xl pl-10"
                  required
                />
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-400 pointer-events-none" />
              </div>
            </div>

            {/* Time Selection */}
            {formData.booking_date && formData.pandit && (
              <div className="space-y-2">
                <Label htmlFor="booking_time" className="text-orange-900 font-medium">Booking Time *</Label>
                {slotsLoading ? (
                  <div className="flex items-center justify-center p-6 bg-orange-50/50 rounded-xl border border-dashed border-orange-200">
                    <Loader2 className="h-5 w-5 animate-spin mr-3 text-orange-600" />
                    <span className="text-sm text-orange-800">Finding best auspicious moments...</span>
                  </div>
                ) : availableSlots.length > 0 ? (
                  <Select
                    value={formData.booking_time}
                    onValueChange={(value) => handleInputChange('booking_time', value)}
                  >
                    <SelectTrigger className="h-12 border-orange-100 focus:ring-orange-500 rounded-xl">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSlots.map((slot) => (
                        <SelectItem key={slot} value={slot} className="focus:bg-orange-50">
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 text-sm">
                    <XCircle className="w-5 h-5" />
                    No available slots for this date
                  </div>
                )}
              </div>
            )}

            {/* Timezone Info */}
            {formData.booking_date && formData.booking_time && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs bg-orange-50/50 p-4 rounded-xl text-orange-800 border border-orange-100 shadow-sm"
              >
                <div className="flex items-center gap-2 font-semibold mb-1">
                  <Clock className="w-4 h-4 text-orange-600" />
                  Nepal Mean Time (NMT)
                </div>
                <p className="pl-6 text-orange-900/70">
                  Scheduled for: {formatWithNepalTime(DateTime.fromISO(`${formData.booking_date}T${formData.booking_time}`).toISO()!)}
                </p>
                {country && (
                  <div className="mt-2 pl-6 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Booking from {country} ({currency})
                  </div>
                )}
              </motion.div>
            )}

            {/* Service Location */}
            <div className="space-y-2">
              <Label htmlFor="service_location" className="text-orange-900 font-medium">Service Location *</Label>
              <Select
                value={formData.service_location}
                onValueChange={(value) => handleInputChange('service_location', value)}
              >
                <SelectTrigger className="h-12 border-orange-100 focus:ring-orange-500 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONLINE" className="focus:bg-orange-50">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-orange-600" />
                      <span>Online (Video Call)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="HOME" className="focus:bg-orange-50">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-orange-600" />
                      <span>My Home</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="TEMPLE" className="focus:bg-orange-50">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-orange-600" />
                      <span>Temple</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="PANDIT_LOCATION" className="focus:bg-orange-50">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-orange-600" />
                      <span>Pandit's Location</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Samagri & AI Suggestions */}
            <div className="bg-orange-50/30 p-6 rounded-2xl border border-orange-100 space-y-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="samagri"
                  checked={formData.samagri_required}
                  onCheckedChange={(checked) => handleInputChange('samagri_required', checked)}
                  className="data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="samagri" className="text-sm font-bold text-orange-900">
                    Include Samagri Kit (+NPR 500)
                  </Label>
                  <p className="text-xs text-orange-800/60 font-medium">
                    Anita recommends including the ritual kit for a complete experience.
                  </p>
                </div>
              </div>

              {formData.samagri_required && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4 pt-2"
                >
                  <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl border border-orange-100 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-bold text-orange-900 flex items-center gap-2">
                        <Bot className="w-5 h-5 text-orange-600" />
                        AI Recommended Samagri
                      </p>
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 font-sans tracking-wide">
                        SMART CHOICE
                      </Badge>
                    </div>

                    {aiSamagriLoading ? (
                      <div className="flex flex-col items-center justify-center p-8 gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                        <span className="text-xs text-orange-800 font-medium animate-pulse">Consulting Vedic experts...</span>
                      </div>
                    ) : samagriRequirements.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {samagriRequirements.map((req: any, idx: number) => (
                          <div key={req.id || req.name || idx} className="flex items-center justify-between bg-white p-3 rounded-xl border border-orange-50 hover:border-orange-200 transition-all shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl flex items-center justify-center shadow-inner">
                                <span className="text-orange-600 font-bold text-sm tracking-tighter">{req.name?.slice(0, 2).toUpperCase()}</span>
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900 leading-none mb-1">{req.name}</p>
                                <p className="text-[11px] text-gray-500 font-medium">{req.quantity} {req.unit} {req.price ? `• NPR ${req.price}` : ''}</p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSamagriRequirements(prev => prev.filter((r, i) => (r.id || r.name || i) !== (req.id || req.name || idx)));
                              }}
                              className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-orange-800/40 italic text-sm">No items found in our sacred database.</div>
                    )}

                    <div className="pt-4 border-t border-orange-50 mt-4 flex flex-col gap-3">
                      <Button
                        type="button"
                        onClick={handleAddAllToCart}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold h-11 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add Missing to Cart
                      </Button>
                      <p className="text-[10px] text-center text-orange-900/40 italic font-medium">
                        Anita's Journey: We'll add only the items you don't already have.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-orange-900 font-medium">Special Requests & Notes (Optional)</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Share any specific family traditions or ritual requirements..."
                className="w-full h-32 border border-orange-100 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all placeholder:text-gray-300 resize-none"
              />
            </div>

            {/* Fee Summary */}
            {formData.service && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-orange-50/50 p-6 rounded-2xl border-2 border-dashed border-orange-200 space-y-3"
              >
                <div className="flex justify-between text-sm font-medium text-orange-900/70">
                  <span>Ritual Service:</span>
                  <span>NPR {fees.serviceFee}</span>
                </div>
                {formData.samagri_required && (
                  <div className="flex justify-between text-sm font-medium text-orange-900/70">
                    <span>Sacred Samagri Kit:</span>
                    <span>NPR {fees.sammagriFee}</span>
                  </div>
                )}
                <div className="border-t border-orange-200 pt-3 flex justify-between items-center">
                  <span className="text-lg font-bold text-orange-950">Investment Total</span>
                  <span className="text-2xl font-playfair font-bold text-orange-600">NPR {fees.total}</span>
                </div>
              </motion.div>
            )}

            {/* Submit Button - Enhanced as per "Review & Confirm" CTA */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={
                  loading ||
                  !formData.pandit ||
                  !formData.service ||
                  !formData.booking_date ||
                  !formData.booking_time
                }
                className="w-full h-14 text-lg font-bold bg-[#f97316] hover:bg-[#ea580c] text-white rounded-2xl shadow-lg shadow-orange-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                ) : (
                  <>
                    Review & Confirm
                    <ChevronRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
              <p className="text-center text-[10px] text-gray-400 mt-4 italic font-medium">
                Verify choices in the next step before finalizing your sacred journey.
              </p>
            </div>
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
