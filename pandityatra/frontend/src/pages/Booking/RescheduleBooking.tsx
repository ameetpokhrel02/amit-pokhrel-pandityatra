import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar as CalendarIcon, Clock, Sparkles, Bot, CheckCircle2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import apiClient from '@/lib/api-client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useCart } from '@/hooks/useCart';

interface Booking {
  id: number;
  pandit_full_name: string;
  service_name: string;
  service_image?: string;
  booking_date: string;
  booking_time: string;
  pandit: number;
  service: number;
}

const RescheduleBooking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem, openDrawer } = useCart();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    booking_date: '',
    booking_time: '',
  });

  useEffect(() => {
    fetchBookingDetails();
  }, [id]);

  useEffect(() => {
    if (booking && formData.booking_date) {
      fetchAvailableSlots();
    }
  }, [booking, formData.booking_date]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/bookings/${id}/`);
      setBooking(response.data);
      // Pre-fill with original date if it's in the future, otherwise leave blank
      const today = new Date().toISOString().split('T')[0];
      if (response.data.booking_date >= today) {
        setFormData(prev => ({ ...prev, booking_date: response.data.booking_date }));
      }
    } catch (err) {
      setError('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!booking) return;
    try {
      setSlotsLoading(true);
      const response = await apiClient.get('/bookings/available_slots/', {
        params: {
          pandit_id: booking.pandit,
          date: formData.booking_date,
          service_id: booking.service,
        },
      });
      setAvailableSlots(response.data.available_slots || []);
    } catch (err) {
      console.error('Failed to fetch slots:', err);
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.booking_date || !formData.booking_time) {
      setError('Please select a new date and time');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const response = await apiClient.post(`/bookings/${id}/reschedule/`, formData);
      
      // Success! Anita's flow says "AI recommendations etc"
      // But for the simple API call, we can redirect to confirmation or my-bookings
      navigate('/my-bookings', { 
        state: { message: 'Puja rescheduled successfully! Pandit has been notified.' } 
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reschedule booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout userRole="user">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!booking) {
    return (
      <DashboardLayout userRole="user">
        <Alert variant="destructive">
          <AlertDescription>Booking not found or unavailable for rescheduling.</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="user">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="mb-6 hover:bg-orange-50 text-orange-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to My Bookings
        </Button>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Left: Original Booking Info */}
          <div className="md:col-span-1 space-y-6">
            <Card className="border-orange-100 shadow-sm overflow-hidden">
               <div className="aspect-video relative">
                 {booking.service_image ? (
                   <img src={booking.service_image} alt={booking.service_name} className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full bg-orange-100 flex items-center justify-center text-orange-500 font-bold">
                     Puja
                   </div>
                 )}
                 <div className="absolute top-2 right-2">
                   <Badge className="bg-orange-500">Original Choice</Badge>
                 </div>
               </div>
               <CardContent className="pt-4">
                 <h3 className="font-bold text-gray-900">{booking.service_name}</h3>
                 <p className="text-sm text-gray-500">With {booking.pandit_full_name}</p>
                 <div className="mt-4 pt-4 border-t border-orange-50 space-y-2 text-xs">
                    <p className="text-gray-400 uppercase tracking-wider font-bold">Previous Schedule</p>
                    <div className="flex items-center gap-2 text-gray-600">
                      <CalendarIcon className="w-3 h-3" /> {new Date(booking.booking_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-3 h-3" /> {booking.booking_time}
                    </div>
                 </div>
               </CardContent>
            </Card>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
              <div className="flex gap-3">
                <Bot className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="text-xs text-amber-900">
                  <p className="font-bold mb-1">Anita's Note</p>
                  <p>Don't worry! You can reschedule your puja once for free within 7 days. I'll help you pick the best next available slot.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Reschedule Form */}
          <div className="md:col-span-2">
            <Card className="border-orange-100 shadow-lg">
              <CardHeader className="bg-orange-50/50">
                <CardTitle className="text-xl font-playfair flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-orange-500" />
                  Pick New Auspicious Slot
                </CardTitle>
                <CardDescription>Select a new date and time for your ceremony.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-orange-900">New Date</Label>
                      <div className="relative">
                        <Input 
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          value={formData.booking_date}
                          onChange={(e) => setFormData(prev => ({ ...prev, booking_date: e.target.value, booking_time: '' }))}
                          className="pl-10 h-11 border-orange-100 focus:ring-orange-500"
                        />
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-orange-900">New Time Slot</Label>
                      {slotsLoading ? (
                        <div className="h-11 flex items-center px-4 bg-orange-50 rounded-md border border-orange-100">
                          <Loader2 className="w-4 h-4 animate-spin mr-2 text-orange-600" />
                          <span className="text-xs">Finding slots...</span>
                        </div>
                      ) : (
                        <Select 
                          value={formData.booking_time} 
                          onValueChange={(val) => setFormData(prev => ({ ...prev, booking_time: val }))}
                          disabled={!formData.booking_date}
                        >
                          <SelectTrigger className="h-11 border-orange-100">
                            <SelectValue placeholder={!formData.booking_date ? "Select date first" : "Pick a time"} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSlots.map(slot => (
                              <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-orange-50">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100 mb-6">
                       <div className="flex items-center gap-3">
                         <CheckCircle2 className="w-6 h-6 text-green-600" />
                         <div>
                           <p className="text-sm font-bold text-green-900">Free Reschedule Applied</p>
                           <p className="text-xs text-green-700">No additional payment required for this change.</p>
                         </div>
                       </div>
                       <Badge className="bg-green-600">NPR 0</Badge>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-orange-200"
                      disabled={submitting || !formData.booking_time}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Rescheduling...
                        </>
                      ) : (
                        "Confirm Reschedule"
                      )}
                    </Button>
                    <p className="text-[10px] text-center text-gray-400 mt-4 leading-relaxed uppercase tracking-widest">
                      By confirming, you agree to the PanditYatra terms of service.
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RescheduleBooking;
