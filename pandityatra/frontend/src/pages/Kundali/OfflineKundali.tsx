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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { FaDownload, FaWifi, FaUserAstronaut, FaCalendarAlt, FaMapMarkerAlt, FaSpinner, FaHistory } from 'react-icons/fa';
import { ChevronRightIcon } from 'lucide-react';
import { GiStarsStack, GiSolarSystem } from 'react-icons/gi';
import { useLocation as useGeoLocation } from '@/hooks/useLocation';
import { useEffect as useNetworkEffect, useState as useNetworkState } from 'react';
import * as Astronomy from 'astronomy-engine';
import { DualDatePicker } from '@/components/ui/dual-date-picker';

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
  if (charts.length === 0) return <div className="text-center p-8 text-gray-500 bg-white rounded-lg border border-dashed">No saved charts found. Generate one online to save it!</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {charts.map((c, i) => (
        <Card key={i} className="cursor-pointer hover:border-[#FF6F00] hover:shadow-md transition-all group" onClick={() => onSelectChart(c)}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex justify-between">
              <span>Chart #{c.id}</span>
              <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">{new Date(c.created_at).toLocaleDateString()}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm text-gray-600">
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
const KundaliGeneratorForm = ({ initialData, setFormData, isOnline, geo }: any) => {
  const { latitude, longitude } = geo;
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [pdfSyncStatus, setPdfSyncStatus] = useState<'idle' | 'queued' | 'synced'>('idle');
  const [queuedPDF, setQueuedPDF] = useState<any>(null);

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

    // 1. ONLINE MODE
    if (isOnline) {
      try {
        const { generateKundali } = await import('@/lib/api');
        const payload = {
          dob: `${formData.year}-${formData.month}-${formData.day}`,
          time: `${formData.hour}:${formData.minute}`,
          latitude: latitude || 27.7172,
          longitude: longitude || 85.3240,
          timezone: 'Asia/Kathmandu'
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
        setLoading(false);
        return;
      } catch (e) {
        console.error("Online generation failed, falling back to offline", e);
      }
    }

    // 2. OFFLINE MODE (Fallback or Primary)
    try {
      const date = new Date(parseInt(formData.year), parseInt(formData.month) - 1, parseInt(formData.day), parseInt(formData.hour), parseInt(formData.minute));
      const observer = new Astronomy.Observer(latitude || 27.7172, longitude || 85.3240, 1350);
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
      <div className="lg:col-span-1 space-y-6">
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
          <Input value={formData.place} onChange={(e) => setFormData({ ...formData, place: e.target.value })} placeholder="City" />
        </div>

        <Button onClick={generateChart} disabled={loading} className="w-full bg-[#FF6F00] hover:bg-[#E65100] text-white">
          {loading ? <FaSpinner className="animate-spin mr-2" /> : <GiStarsStack className="mr-2" />} Generate Kundali
        </Button>
      </div>

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-[#3E2723] mb-2">Planetary Positions</h4>
                    <div className="space-y-2 text-sm">
                      {result.planets.map((p: any) => (
                        <div key={p.planet} className="flex justify-between border-b pb-1">
                          <span>{p.planet}</span>
                          <span className="text-gray-600">{p.rashi} ({Number(p.longitude).toFixed(2)}°)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#3E2723] mb-2">AI Prediction</h4>
                    <div className="bg-orange-50 p-4 rounded-lg text-sm text-gray-700 whitespace-pre-line border border-orange-100">{result.ai_prediction}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={() => {
                try {
                  const content = `
KUNDALI REPORT (${(result.source || 'OFFLINE').toUpperCase()} MODE)
====================================================
Name: ${formData.name || 'N/A'}
Gender: ${formData.gender || 'N/A'}
Date: ${formData.year}-${formData.month}-${formData.day}
Time: ${formData.hour}:${formData.minute}
Place: ${formData.place || 'Unknown'}

PLANETARY POSITIONS:
${result.planets ? result.planets.map((p: any) => `${p.planet}: ${p.rashi} (${Number(p.longitude).toFixed(2)})`).join('\n') : 'No planetary data available'}

PREDICTION:
${result.ai_prediction || 'No prediction available'}

Generated by PanditYatra
`.trim();
                  const blob = new Blob([content], { type: 'text/plain' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${(formData.name || 'User').replace(/\s+/g, '_')}_Kundali.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  window.URL.revokeObjectURL(url);

                  if (!isOnline) {
                    setPdfSyncStatus('queued');
                    setQueuedPDF(result);
                  }
                } catch (error) {
                  console.error("Download failed:", error);
                  alert("Failed to download chart.");
                }
              }}
              className="mt-4 w-full bg-[#FF6F00] hover:bg-[#E65100] text-white font-bold py-3"
            >
              <FaDownload className="mr-2" />
              {isOnline ? 'Download Chart Summary' : 'Download Offline Summary'}
            </Button>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-12 bg-white rounded-xl border-2 border-dashed border-gray-200 text-center">
            <GiSolarSystem className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-500">No Chart Generated</h3>
            <p className="text-gray-400 max-w-sm mt-2">Enter details to generate chart.</p>
          </div>
        )}
      </div>
    </div>
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
    place: ''
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
      place: chart.place
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

  const [showAuthDialog, setShowAuthDialog] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowAuthDialog(true);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-4 bg-[#F5F5F5]">
          <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
            <DialogContent className="sm:max-w-md bg-white border-[#FF6F00]">
              <DialogHeader>
                <DialogTitle className="text-[#3E2723] flex items-center gap-2">
                  <FaUserAstronaut className="text-[#FF6F00]" /> Authentication Required
                </DialogTitle>
                <DialogDescription className="text-gray-600">
                  You need to be logged in to access the Offline Kundali Generator.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="sm:justify-start">
                <Button type="button" className="bg-[#FF6F00] text-white" onClick={() => navigate('/login')}>Login Now</Button>
                <Button type="button" variant="outline" className="border-[#FF6F00] text-[#FF6F00]" onClick={() => navigate('/')}>Go Home</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-32 bg-[#F5F5F5] p-4 md:p-8">
        <div className="max-w-4xl mx-auto mb-8 text-center pt-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#3E2723] mb-2 flex items-center justify-center gap-3">
            <GiSolarSystem className="text-[#FF6F00]" /> Offline Kundali Generator
          </h1>
          <p className="text-gray-600">Generate detailed Vedic charts {isOnline ? 'Online' : 'Offline'} mode.</p>
        </div>

        <div className="max-w-4xl mx-auto mb-4">
          <div className="flex items-center gap-4 justify-center md:justify-start">
            <span className={isOnline ? 'text-green-700 font-medium px-3 py-1 bg-green-100 rounded-full text-sm' : 'text-red-600 font-medium px-3 py-1 bg-red-100 rounded-full text-sm'}>
              <FaWifi className="inline mr-1" /> {isOnline ? 'Online Mode' : 'Offline Mode'}
            </span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pb-12">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {isOnline && (
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
                geo={{ latitude, longitude, isNepalTime, error: geoError }}
              />
            </TabsContent>

            <TabsContent value="history">
              <SavedChartsList onSelectChart={handleLoadChart} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OfflineKundali;
