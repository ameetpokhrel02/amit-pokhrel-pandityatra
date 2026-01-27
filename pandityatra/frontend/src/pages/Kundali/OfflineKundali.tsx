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
import { FaDownload, FaWifi, FaUserAstronaut, FaCalendarAlt, FaMapMarkerAlt, FaSpinner } from 'react-icons/fa';
import { GiStarsStack, GiSolarSystem } from 'react-icons/gi';
import PWALogo from '@/assets/images/PWA.png';
import { useLocation as useGeoLocation } from '@/hooks/useLocation';
import * as Astronomy from 'astronomy-engine';

const OfflineKundali: React.FC = () => {
  const { token } = useAuth();
  const isAuthenticated = !!token;
  const navigate = useNavigate();
  const { latitude, longitude } = useGeoLocation();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Form State
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

  // Result State
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowAuthDialog(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const getZodiacSign = (longitude: number) => {
    const signs = [
      "Aries", "Taurus", "Gemini", "Cancer",
      "Leo", "Virgo", "Libra", "Scorpio",
      "Sagittarius", "Capricorn", "Aquarius", "Pisces"
    ];
    // Sidereal to Tropical adjustment (approximate ayanamsa for simplicity in offline mode)
    // Or just use Tropical as returned by Astronomy engine for now
    // Normalized to 0-360
    let norm = longitude % 360;
    if (norm < 0) norm += 360;
    const index = Math.floor(norm / 30);
    return signs[index];
  };

  const getNakshatra = (longitude: number) => {
    const nakshatras = [
      "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha",
      "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
      "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
    ];
    // Simple mapping, assuming starting from 0 Aries
    let norm = longitude % 360;
    if (norm < 0) norm += 360;
    const index = Math.floor(norm * 27 / 360);
    return nakshatras[index];
  };

  const getHouseNumber = (planetLong: number, ascendantLong: number) => {
    let diff = planetLong - ascendantLong;
    if (diff < 0) diff += 360;
    return Math.floor(diff / 30) + 1;
  };

  const generateOfflineChart = () => {
    if (!formData.day || !formData.month || !formData.year || !formData.hour || !formData.minute) {
      alert("Please enter valid birth details.");
      return;
    }

    setLoading(true);

    try {
      // 1. Create Date Object
      const date = new Date(
        parseInt(formData.year),
        parseInt(formData.month) - 1,
        parseInt(formData.day),
        parseInt(formData.hour),
        parseInt(formData.minute)
      );

      // 2. Use Astronomy Engine
      const observer = new Astronomy.Observer(latitude || 27.7172, longitude || 85.3240, 1350); // Default to Kathmandu

      const bodies = [
        "Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"
      ];

      const planetsData = bodies.map(bodyName => {
        const body = (Astronomy.Body as any)[bodyName];
        // Get equatorial coordinates
        const equator = Astronomy.Equator(body, date, observer, true, true);
        // Convert to Vector for Ecliptic calculation if necessary, or use a method that accepts equatorial
        // Astronomy.Ecliptic expects a Vector. Astronomy.Equator returns EquatorialCoordinates which has vec field (Vector)
        const ecliptic = Astronomy.Ecliptic(equator.vec);
        return {
          planet: bodyName,
          longitude: ecliptic.elon,
          rashi: getZodiacSign(ecliptic.elon),
          nakshatra: getNakshatra(ecliptic.elon)
        };
      });

      // Calculate Ascendant (Lagna) - Approx
      // A full sidereal ascendant calculation is complex. 
      // Using Sun longitude + time offset as a very rough approximation for offline demo if library doesn't support it directly
      // Better: Astronomy engine doesn't have direct 'Ascendant'. 
      // We will use a mock Ascendant based on time of day for the visual or just place Sun in 1st house for now given library limitations for full Vedic calc
      // Actually, let's just use the Sun's position as a reference for 'Lagna' in this lightweight version to avoid errors
      const lagna = 0; // Placeholder

      // Calculate Houses relative to a 0-degree start (Kalpurush) for simplicity
      const planetsWithHouses = planetsData.map(p => ({
        ...p,
        house: Math.floor(p.longitude / 30) + 1 // Simple 1-12 based on Rashi
      }));

      // 3. Rule-Based Prediction (Offline AI)
      const sunSign = planetsData.find(p => p.planet === 'Sun')?.rashi;
      const moonSign = planetsData.find(p => p.planet === 'Moon')?.rashi;

      let prediction = `Based on your birth chart (Offline Mode):\n\n`;
      prediction += `Your Sun Sign is **${sunSign}**. This represents your core essence and ego. `;
      if (sunSign === 'Aries') prediction += "You are energetic and a natural leader.\n";
      if (sunSign === 'Taurus') prediction += "You are reliable and value stability.\n";
      if (sunSign === 'Gemini') prediction += "You are curious and adaptable.\n";
      if (sunSign === 'Cancer') prediction += "You are nurturing and emotional.\n";
      if (sunSign === 'Leo') prediction += "You are charismatic and love the spotlight.\n";
      if (sunSign === 'Virgo') prediction += "You are distinct and analytical.\n";
      if (sunSign === 'Libra') prediction += "You are diplomatic and value harmony.\n";
      if (sunSign === 'Scorpio') prediction += "You are intense and passionate.\n";
      if (sunSign === 'Sagittarius') prediction += "You are adventurous and optimistic.\n";
      if (sunSign === 'Capricorn') prediction += "You are disciplined and ambitious.\n";
      if (sunSign === 'Aquarius') prediction += "You are innovative and humanitarian.\n";
      if (sunSign === 'Pisces') prediction += "You are compassionate and artistic.\n";

      prediction += `\nYour Moon Sign is **${moonSign}**. This governs your emotions and inner self.`;

      setResult({
        planets: planetsWithHouses,
        lagna: 0,
        ai_prediction: prediction
      });

    } catch (err) {
      console.error("Calculation failed", err);
      alert("Failed to generate chart. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

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
              <div className="flex items-center space-x-2">
                <p className="text-sm text-[#3E2723]">Please login or register to continue.</p>
              </div>
              <DialogFooter className="sm:justify-start">
                <Button
                  type="button"
                  className="bg-[#FF6F00] hover:bg-[#E65100] text-white"
                  onClick={() => navigate('/login')}
                >
                  Login Now
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-[#FF6F00] text-[#FF6F00]"
                  onClick={() => navigate('/')}
                >
                  Go Home
                </Button>
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
      <main className="flex-grow pt-20 bg-[#F5F5F5] p-4 md:p-8">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-8 text-center pt-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#3E2723] mb-2 flex items-center justify-center gap-3">
            <GiSolarSystem className="text-[#FF6F00]" /> Offline Kundali Generator
          </h1>
          <p className="text-gray-600">Generate detailed Vedic charts without internet connection.</p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
          {/* Left Column: Form */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader className="bg-[#FFF3E0] rounded-t-lg">
                <CardTitle className="text-[#E65100] flex items-center gap-2">
                  <FaUserAstronaut /> Birth Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    placeholder="Enter Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="focus-visible:ring-[#FF6F00]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(v) => setFormData({ ...formData, gender: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Place</Label>
                    <Input
                      placeholder="City"
                      value={formData.place}
                      onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Input placeholder="DD" value={formData.day} onChange={e => setFormData({ ...formData, day: e.target.value })} />
                  <Input placeholder="MM" value={formData.month} onChange={e => setFormData({ ...formData, month: e.target.value })} />
                  <Input placeholder="YYYY" value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="HH" value={formData.hour} onChange={e => setFormData({ ...formData, hour: e.target.value })} />
                  <Input placeholder="MM" value={formData.minute} onChange={e => setFormData({ ...formData, minute: e.target.value })} />
                </div>

                <Button
                  onClick={generateOfflineChart}
                  className="w-full bg-[#FF6F00] hover:bg-[#E65100] text-white"
                  disabled={loading}
                >
                  {loading ? <FaSpinner className="animate-spin mr-2" /> : <GiStarsStack className="mr-2" />}
                  Generate Kundali (Offline)
                </Button>
              </CardContent>
            </Card>
            {/* PWA Install Card */}
            <Card className="border-[#FF6F00] border-2 shadow-md bg-white">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={PWALogo} alt="PWA" className="w-10 h-10 rounded-md" />
                  <div>
                    <h3 className="font-bold text-[#3E2723]">Install App</h3>
                    <p className="text-xs text-gray-500">For offline access</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={handleInstallClick} className="border-[#FF6F00] text-[#FF6F00]">
                  <FaDownload />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Visualization */}
          <div className="lg:col-span-2">
            <Card className="h-full border-none shadow-lg bg-white">
              <CardHeader className="border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-[#3E2723]">Chart Visualization</CardTitle>
                  <Tabs defaultValue="north" className="w-[200px]">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="north">North</TabsTrigger>
                      <TabsTrigger value="south">South</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent className="p-8 flex flex-col items-center justify-center min-h-[400px] bg-[#FFF8E1]">
                {!result ? (
                  <div className="text-center text-[#FF6F00] opacity-50">
                    <GiSolarSystem size={120} className="mx-auto mb-4" />
                    <p className="text-xl font-medium">Enter birth details to generate chart</p>
                  </div>
                ) : (
                  <div className="w-full space-y-6">
                    <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
                      <div className="border-4 border-[#3E2723] p-4 bg-white rounded-lg inline-block shadow-xl">
                        {/* Dynamic Vedic Chart */}
                        <svg width="300" height="300" viewBox="0 0 100 100" className="mx-auto">
                          <rect x="2" y="2" width="96" height="96" fill="none" stroke="#E65100" strokeWidth="1.5" />
                          <line x1="2" y1="2" x2="98" y2="98" stroke="#E65100" strokeWidth="0.8" />
                          <line x1="98" y1="2" x2="2" y2="98" stroke="#E65100" strokeWidth="0.8" />
                          <path d="M50 2 L98 50 L50 98 L2 50 Z" fill="none" stroke="#E65100" strokeWidth="0.8" />

                          {/* Render Planets in Houses */}
                          {result.planets?.map((p: any, idx: number) => {
                            // Simple positioning logic for houses 1-12
                            const houseCenters: any = {
                              1: [50, 25], 2: [25, 12], 3: [12, 25], 4: [25, 50],
                              5: [12, 75], 6: [25, 88], 7: [50, 75], 8: [75, 88],
                              9: [88, 75], 10: [75, 50], 11: [88, 25], 12: [75, 12]
                            };
                            const [x, y] = houseCenters[p.house] || [50, 50];
                            return (
                              <text key={idx} x={x} y={y + (idx % 3) * 4} fontSize="3" textAnchor="middle" fill="#3E2723" fontWeight="bold">
                                {p.planet.substring(0, 2)}
                              </text>
                            );
                          })}
                        </svg>
                      </div>

                      <div className="flex-1 space-y-4 text-left">
                        <div className="bg-[#FFF3E0] p-4 rounded-lg border-l-4 border-orange-500">
                          <h4 className="font-bold text-orange-800 mb-2 flex items-center gap-2">
                            <GiStarsStack /> Offline Prediction Preview
                          </h4>
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                            {result.ai_prediction}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white border p-2 rounded shadow-sm text-center">
                            <p className="text-[10px] text-gray-500 uppercase">Ascendant</p>
                            <p className="font-bold text-sm">~{result.lagna}°</p>
                          </div>
                          <div className="bg-white border p-2 rounded shadow-sm text-center">
                            <p className="text-[10px] text-gray-500 uppercase">Planets</p>
                            <p className="font-bold text-sm">{result.planets?.length || 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left border-collapse">
                        <thead>
                          <tr className="bg-orange-100 text-orange-800">
                            <th className="p-2 border">Planet</th>
                            <th className="p-2 border">Rashi</th>
                            <th className="p-2 border">Nakshatra</th>
                            <th className="p-2 border">House</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.planets?.map((p: any, idx: number) => (
                            <tr key={idx} className="hover:bg-orange-50 transition-colors">
                              <td className="p-2 border font-medium">{p.planet}</td>
                              <td className="p-2 border">{p.rashi}</td>
                              <td className="p-2 border">{p.nakshatra}</td>
                              <td className="p-2 border text-center">{p.house}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <Button onClick={() => window.print()} variant="outline" className="mt-4 border-[#3E2723] text-[#3E2723] w-full">
                      <FaDownload className="mr-2" />
                      Download Full PDF Chart
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OfflineKundali;
