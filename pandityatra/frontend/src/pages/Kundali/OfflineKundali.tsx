import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { FaDownload, FaWifi, FaUserAstronaut, FaCalendarAlt, FaMapMarkerAlt, FaSpinner, FaHistory, FaMap, FaSave } from 'react-icons/fa';
import { ChevronRightIcon, MapPin, Check } from 'lucide-react';
import { GiStarsStack, GiSolarSystem } from 'react-icons/gi';
import { useLocation as useGeoLocation } from '@/hooks/useLocation';
import { useEffect as useNetworkEffect, useState as useNetworkState } from 'react';
import * as Astronomy from 'astronomy-engine';
import { DualDatePicker } from '@/components/ui/dual-date-picker';
import MapPicker from '@/components/kundali/MapPicker';
import CosmicOrbit from '@/components/kundali/CosmicOrbit';
import { pdf } from '@react-pdf/renderer';
import { KundaliPDF } from './KundaliPDF';
import { KundaliChart } from './KundaliChart';

// Helpers
const getZodiacSign = (longitude: number) => {
  const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  let norm = longitude % 360;
  if (norm < 0) norm += 360;
  return signs[Math.floor(norm / 30)];
};

const getNakshatra = (longitude: number) => {
  const nakshatras = ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"];
  let norm = longitude % 360;
  if (norm < 0) norm += 360;
  return nakshatras[Math.floor(norm * 27 / 360)];
};

// Sub-component for the list
const SavedChartsList = ({ onSelectChart }: { onSelectChart: (c: any) => void }) => {
  const [charts, setCharts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    import('@/lib/api').then(({ getSavedKundalis }) => {
      getSavedKundalis()
        .then(setCharts)
        .catch(console.error)
        .finally(() => setLoading(false));
    });
  }, []);

  if (loading) return <div className="p-8 text-center"><FaSpinner className="animate-spin inline mr-2" /> Loading history...</div>;
  if (charts.length === 0) return <div className="text-center p-8 text-[#3E2723]/60 bg-background rounded-lg border border-dashed border-orange-200">No saved charts found. Generate one online to save it!</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {charts.map((c, i) => (
        <Card key={i} className="cursor-pointer hover:border-[#FF6F00] hover:shadow-md transition-all group" onClick={() => onSelectChart(c)}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex justify-between">
              <span>Chart #{c.id}</span>
              <span className="text-xs font-normal text-[#3E2723]/60 bg-orange-100/50 px-2 py-1 rounded">{new Date(c.created_at).toLocaleDateString()}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm text-[#3E2723]/70">
              <div className="flex items-center gap-2"><FaCalendarAlt className="text-[#FF6F00] w-3 h-3" /> {c.dob}</div>
              <div className="flex items-center gap-2"><GiSolarSystem className="text-[#FF6F00] w-3 h-3" /> {c.time}</div>
              <div className="flex items-center gap-2"><FaMapMarkerAlt className="text-[#FF6F00] w-3 h-3" /> {c.place}</div>
            </div>
            <Button variant="ghost" className="w-full mt-3 text-[#FF6F00] text-xs font-semibold group-hover:bg-orange-50 h-8">
              Load Chart <ChevronRightIcon className="ml-1 w-3 h-3" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Generator Form Component
const KundaliGeneratorForm = ({ initialData, setFormData, isOnline, geo, isAuthenticated, onRequireLogin }: any) => {
  const { latitude, longitude } = geo;
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [pdfSyncStatus, setPdfSyncStatus] = useState<'idle' | 'queued' | 'synced'>('idle');
  const [queuedPDF, setQueuedPDF] = useState<any>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedId, setLastSavedId] = useState<number | null>(null);

  const formData = initialData;

  useNetworkEffect(() => {
    const handleOnline = () => {
      if (queuedPDF) {
        setPdfSyncStatus('synced');
        setQueuedPDF(null);
        setTimeout(() => setPdfSyncStatus('idle'), 2000);
      }
    };
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [queuedPDF]);

  const generateChart = async () => {
    if (!formData.day || !formData.month || !formData.year || !formData.hour || !formData.minute) {
      alert("Please enter valid birth details.");
      return;
    }
    setLoading(true);
    setSaveStatus('idle');
    setLastSavedId(null);

    // 1. ONLINE MODE
    if (isOnline && isAuthenticated) {
      try {
        const { generateKundali } = await import('@/lib/api');
        const payload = {
          dob: `${formData.year}-${formData.month}-${formData.day}`,
          time: `${formData.hour}:${formData.minute}`,
          latitude: formData.latitude || latitude || 27.7172,
          longitude: formData.longitude || longitude || 85.3240,
          timezone: 'Asia/Kathmandu',
          place: formData.place || ''
        };
        const data = await generateKundali(payload);

        const planetsWithHouses = data.planets.map((p: any) => ({
          planet: p.planet,
          longitude: p.longitude,
          rashi: p.rashi,
          nakshatra: p.nakshatra,
          house: p.house
        }));
        setResult({
          planets: planetsWithHouses,
          lagna: data.lagna,
          ai_prediction: data.ai_prediction,
          source: 'online'
        });
        setLastSavedId(data.kundali_id);
        setSaveStatus('saved');
        setLoading(false);
        return;
      } catch (e) {
        console.error("Online generation failed, falling back to offline", e);
      }
    }

    // 2. OFFLINE MODE (Fallback or Primary)
    try {
      const date = new Date(parseInt(formData.year), parseInt(formData.month) - 1, parseInt(formData.day), parseInt(formData.hour), parseInt(formData.minute));
      const finalLat = formData.latitude || latitude || 27.7172;
      const finalLng = formData.longitude || longitude || 85.3240;
      const observer = new Astronomy.Observer(finalLat, finalLng, 1350);
      const bodies = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"];

      const planetsData = bodies.map(bodyName => {
        const body = (Astronomy.Body as any)[bodyName];
        const equator = Astronomy.Equator(body, date, observer, true, true);
        const ecliptic = Astronomy.Ecliptic(equator.vec);

        return {
          planet: bodyName,
          longitude: ecliptic.elon,
          rashi: getZodiacSign(ecliptic.elon),
          nakshatra: getNakshatra(ecliptic.elon)
        };
      });

      const planetsWithHouses = planetsData.map(p => ({
        ...p,
        house: Math.floor(p.longitude / 30) + 1
      }));

      const sunSign = planetsData.find(p => p.planet === 'Sun')?.rashi;
      const moonSign = planetsData.find(p => p.planet === 'Moon')?.rashi;

      let prediction = `Based on your birth chart (Offline Mode):\n\n`;
      prediction += `Your Sun Sign is **${sunSign}**. This represents your core essence and ego. `;
      prediction += `\nYour Moon Sign is **${moonSign}**. This governs your emotions and inner self.`;

      setResult({
        planets: planetsWithHouses,
        lagna: 0,
        ai_prediction: prediction,
        source: 'offline'
      });

    } catch (err) {
      console.error("Calculation failed", err);
      alert("Failed to generate chart. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Form */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          generateChart();
        }}
        className="lg:col-span-1 space-y-6"
      >
        {/* Inputs */}
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter name" />
        </div>
        <div className="space-y-2">
          <Label>Gender</Label>
          <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Date of Birth</Label>
          <DualDatePicker
            date={{ day: formData.day, month: formData.month, year: formData.year, type: 'AD' }}
            onDateChange={(d) => setFormData({ ...formData, day: d.day, month: d.month, year: d.year })}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label>Hour</Label>
            <Input type="number" min="0" max="23" value={formData.hour} onChange={(e) => setFormData({ ...formData, hour: e.target.value })} placeholder="HH" />
          </div>
          <div className="space-y-2">
            <Label>Minute</Label>
            <Input type="number" min="0" max="59" value={formData.minute} onChange={(e) => setFormData({ ...formData, minute: e.target.value })} placeholder="MM" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Place</Label>
          <div className="flex gap-2">
            <Input value={formData.place} onChange={(e) => setFormData({ ...formData, place: e.target.value })} placeholder="City" className="flex-1" />
            <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="icon" className="shrink-0 border-[#FF6F00] text-[#FF6F00] hover:bg-orange-50">
                  <MapPin className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] bg-white">
                <DialogHeader>
                  <DialogTitle>Select Birth Location</DialogTitle>
                  <DialogDescription>
                    Pinpoint your exact birth place for accurate astrological calculations.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <MapPicker
                    initialLat={formData.latitude || latitude || 27.7172}
                    initialLng={formData.longitude || longitude || 85.3240}
                    initialAddress={formData.place}
                    onLocationSelect={(loc) => {
                      setFormData({
                        ...formData,
                        place: loc.address,
                        latitude: loc.lat,
                        longitude: loc.lng
                      });
                    }}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" onClick={() => setIsMapOpen(false)} className="bg-[#FF6F00] text-white">Done</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          {(formData.latitude || formData.longitude) && (
            <div className="flex gap-4 text-[10px] text-[#3E2723]/50 font-medium px-1">
              <span>Lat: {Number(formData.latitude).toFixed(4)}</span>
              <span>Lng: {Number(formData.longitude).toFixed(4)}</span>
            </div>
          )}
        </div>

        <Button type="submit" disabled={loading} className="w-full bg-[#FF6F00] hover:bg-[#E65100] text-white">
          {loading ? <FaSpinner className="animate-spin mr-2" /> : <GiStarsStack className="mr-2" />} Generate Kundali
        </Button>
      </form>

      {/* Right Column: Results */}
      <div className="lg:col-span-2">
        {result ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GiSolarSystem className="text-[#FF6F00]" /> Birth Chart Details
                  {result.source === 'online' ?
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full ml-auto">High Precision</span> :
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full ml-auto">Approximate</span>
                  }
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-8 flex flex-col items-center">
                    <h4 className="font-bold text-[#E65100] mb-4 text-center text-lg uppercase tracking-widest">Lagna Chart (D1)</h4>
                    < KundaliChart 
                        planets={result.planets} 
                        lagna={result.lagna || 1} 
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-[#3E2723] mb-2">Planetary Positions</h4>
                    <div className="space-y-2 text-sm">
                      {result.planets.map((p: any) => (
                        <div key={p.planet} className="flex justify-between border-b pb-1">
                          <span>{p.planet}</span>
                          <span className="text-[#3E2723]/70">{p.rashi} ({Number(p.longitude).toFixed(2)}°)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#3E2723] mb-2">AI Prediction</h4>
                    <div className="bg-orange-50/50 p-4 rounded-lg text-sm text-[#3E2723]/80 whitespace-pre-line border border-orange-100">{result.ai_prediction}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={async () => {
                try {
                  setPdfDownloading(true);
                  const pdfDoc = <KundaliPDF formData={formData} result={result} />;
                  const blob = await pdf(pdfDoc).toBlob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${(formData.name || 'User').replace(/\s+/g, '_')}_Kundali.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  window.URL.revokeObjectURL(url);
                } catch (error) {
                  console.error("PDF download failed:", error);
                  alert("Failed to download PDF. Please try again.");
                } finally {
                  setPdfDownloading(false);
                }
              }}
              disabled={pdfDownloading}
              className="mt-4 w-full bg-[#FF6F00] hover:bg-[#E65100] text-white font-bold py-3"
            >
              {pdfDownloading ? (
                <FaSpinner className="animate-spin mr-2" />
              ) : (
                <FaDownload className="mr-2" />
              )}
              {pdfDownloading ? 'Generating PDF...' : 'Download Chart Summary'}
            </Button>

            {/* Save to Dashboard Button */}
            {result.source === 'online' && lastSavedId ? (
              <div className="mt-2 flex items-center justify-center gap-2 text-sm text-green-600 font-medium py-2">
                <Check className="w-4 h-4" />
                Automatically saved to your dashboard (Chart #{lastSavedId})
              </div>
            ) : result.source === 'offline' && isOnline && isAuthenticated ? (
              <Button
                onClick={async () => {
                  try {
                    setSaveStatus('saving');
                    const { generateKundali } = await import('@/lib/api');
                    const payload = {
                      dob: `${formData.year}-${formData.month}-${formData.day}`,
                      time: `${formData.hour}:${formData.minute}`,
                      latitude: formData.latitude || latitude || 27.7172,
                      longitude: formData.longitude || longitude || 85.3240,
                      timezone: 'Asia/Kathmandu',
                      place: formData.place || ''
                    };
                    const data = await generateKundali(payload);
                    setLastSavedId(data.kundali_id);
                    setSaveStatus('saved');
                  } catch (error) {
                    console.error("Save failed:", error);
                    setSaveStatus('error');
                    setTimeout(() => setSaveStatus('idle'), 3000);
                  }
                }}
                disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                variant="outline"
                className={`mt-2 w-full font-bold py-3 ${
                  saveStatus === 'saved'
                    ? 'border-green-500 text-green-600 bg-green-50'
                    : saveStatus === 'error'
                    ? 'border-red-500 text-red-600'
                    : 'border-[#FF6F00] text-[#FF6F00] hover:bg-orange-50'
                }`}
              >
                {saveStatus === 'saving' ? (
                  <><FaSpinner className="animate-spin mr-2" /> Saving...</>
                ) : saveStatus === 'saved' ? (
                  <><Check className="w-4 h-4 mr-2" /> Saved to Dashboard (Chart #{lastSavedId})</>
                ) : saveStatus === 'error' ? (
                  <>Save Failed — Try Again</>
                ) : (
                  <><FaSave className="mr-2" /> Save to Dashboard</>
                )}
              </Button>
            ) : result.source === 'offline' && isOnline && !isAuthenticated ? (
              <Button
                onClick={onRequireLogin}
                variant="outline"
                className="mt-2 w-full font-bold py-3 border-[#FF6F00] text-[#FF6F00] hover:bg-orange-50"
              >
                <FaSave className="mr-2" /> Login to Save to Dashboard
              </Button>
            ) : result.source === 'offline' && !isOnline ? (
              <div className="mt-2 text-center text-xs text-amber-600 font-medium bg-amber-50 p-2 rounded-lg border border-amber-200">
                ⚠ You're offline. Connect to the internet to save this chart to your dashboard.
              </div>
            ) : null}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-12 bg-background rounded-xl border-2 border-dashed border-orange-200/50 text-center">
            <GiSolarSystem className="w-16 h-16 text-orange-200 mb-4" />
            <h3 className="text-xl font-bold text-[#3E2723]/80">No Chart Generated</h3>
            <p className="text-[#3E2723]/60 max-w-sm mt-2 font-medium">Enter details to generate chart.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const KundaliGuarantee = () => {
  return (
    <section className="py-20 px-4 md:px-8 bg-gradient-to-b from-orange-50/50 to-white overflow-hidden border-t border-orange-100">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8 order-2 md:order-1 text-center md:text-left">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-orange-100 text-orange-700 font-bold text-sm tracking-wide uppercase">
              <GiStarsStack className="w-5 h-5" />
              Sacred Promise
            </div>

            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#3E2723] leading-tight">
                अब कुण्डलीको ग्यारेन्टी <br />
                <span className="text-orange-600">पण्डितयात्राले लिन्छ !</span>
              </h2>
              <p className="text-xl md:text-2xl text-[#3E2723]/70 font-medium">
                Now PanditYatra guarantees your Kundali!
              </p>
            </div>

            <p className="text-lg text-[#3E2723]/60 leading-relaxed max-w-xl mx-auto md:mx-0">
              Our charts are crafted with divine precision, blending ancient Vedic wisdom with modern accuracy. We ensure that every calculation reflects the true cosmic alignment of your birth.
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 pt-4">
              <div className="flex flex-col items-center md:items-start gap-1">
                <span className="text-3xl font-black text-orange-600">100%</span>
                <span className="text-xs font-bold text-[#3E2723]/40 uppercase tracking-widest text-[10px]">Accuracy</span>
              </div>
              <div className="w-px h-12 bg-orange-200 hidden sm:block"></div>
              <div className="flex flex-col items-center md:items-start gap-1">
                <span className="text-3xl font-black text-orange-600">Verified</span>
                <span className="text-xs font-bold text-[#3E2723]/40 uppercase tracking-widest text-[10px]">Calculations</span>
              </div>
              <div className="w-px h-12 bg-orange-200 hidden sm:block"></div>
              <div className="flex flex-col items-center md:items-start gap-1">
                <span className="text-3xl font-black text-orange-600">Trusted</span>
                <span className="text-xs font-bold text-[#3E2723]/40 uppercase tracking-widest text-[10px]">by Thousands</span>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative order-1 md:order-2 flex justify-center items-center">
            <div className="absolute w-[120%] h-[120%] bg-orange-100/10 rounded-full blur-3xl -z-10"></div>
            <div className="relative group">
              <img
                src="/images/kundali.png"
                alt="Authentic Kundali"
                className="relative z-10 w-full max-w-[450px] h-auto transition-transform duration-500 rounded-none group-hover:scale-105"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};


const OfflineKundali: React.FC = () => {
  const { token } = useAuth();
  const isAuthenticated = !!token;
  const navigate = useNavigate();
  const geo = useGeoLocation();
  const { latitude, longitude, error: geoError, isNepalTime } = geo;

  const [isOnline, setIsOnline] = useNetworkState(navigator.onLine);

  const [activeTab, setActiveTab] = useState("generator");

  const [formData, setFormData] = useState({
    name: '',
    gender: 'male',
    day: '',
    month: '',
    year: '',
    hour: '',
    minute: '',
    place: '',
    latitude: null as number | null,
    longitude: null as number | null
  });

  const handleLoadChart = (chart: any) => {
    const dobDate = new Date(chart.dob);
    const timeParts = chart.time.split(':');

    setFormData(prev => ({
      ...prev,
      name: `Chart #${chart.id}`,
      day: dobDate.getDate().toString(),
      month: (dobDate.getMonth() + 1).toString(),
      year: dobDate.getFullYear().toString(),
      hour: timeParts[0],
      minute: timeParts[1],
      place: chart.place,
      latitude: chart.latitude,
      longitude: chart.longitude
    }));
    setActiveTab("generator");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useNetworkEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-background pt-24">
        <CosmicOrbit />

        <div className="max-w-4xl mx-auto mb-4 px-4 md:px-8 pt-8">
          <div className="flex items-center gap-4 justify-center md:justify-start">
            <span className={isOnline ? 'text-green-700 font-medium px-3 py-1 bg-green-100 rounded-full text-sm' : 'text-red-600 font-medium px-3 py-1 bg-red-100 rounded-full text-sm'}>
              <FaWifi className="inline mr-1" /> {isOnline ? 'Online Mode' : 'Offline Mode'}
            </span>
            {!isAuthenticated && (
              <Button
                size="sm"
                variant="outline"
                className="border-[#FF6F00] text-[#FF6F00] hover:bg-orange-50"
                onClick={() => navigate('/login')}
              >
                Login for cloud save
              </Button>
            )}
          </div>
        </div>

        <div id="generator-form" className="max-w-6xl mx-auto pb-12 px-4 md:px-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {isOnline && isAuthenticated && (
              <TabsList className="grid w-full grid-cols-2 mb-8 max-w-md mx-auto">
                <TabsTrigger value="generator">New Chart</TabsTrigger>
                <TabsTrigger value="history">Saved Charts</TabsTrigger>
              </TabsList>
            )}

            <TabsContent value="generator" className="mt-0">
              <KundaliGeneratorForm
                initialData={formData}
                setFormData={setFormData}
                isOnline={isOnline}
                isAuthenticated={isAuthenticated}
                onRequireLogin={() => navigate('/login')}
                geo={{ latitude, longitude, isNepalTime, error: geoError }}
              />
            </TabsContent>

            <TabsContent value="history">
              <SavedChartsList onSelectChart={handleLoadChart} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <KundaliGuarantee />
      <Footer />
    </div>
  );
};

export default OfflineKundali;
