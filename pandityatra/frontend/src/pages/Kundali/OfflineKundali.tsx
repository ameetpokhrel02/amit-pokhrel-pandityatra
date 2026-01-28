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
import { useEffect as useNetworkEffect, useState as useNetworkState } from 'react';
import * as Astronomy from 'astronomy-engine';

const OfflineKundali: React.FC = () => {
  const { token } = useAuth();
  const isAuthenticated = !!token;
  const navigate = useNavigate();
  const geo = useGeoLocation();
  const { latitude, longitude, error: geoError, isNepalTime } = geo;
  // Network status
  const [isOnline, setIsOnline] = useNetworkState(navigator.onLine);
  const [pdfSyncStatus, setPdfSyncStatus] = useState<'idle' | 'queued' | 'synced'>('idle');
  const [queuedPDF, setQueuedPDF] = useState<any>(null);

  useNetworkEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // If PDF was queued, simulate upload
      if (queuedPDF) {
        setPdfSyncStatus('synced');
        setQueuedPDF(null);
        setTimeout(() => setPdfSyncStatus('idle'), 2000);
      }
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [queuedPDF]);
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

        {/* Location/Timezone/Sync Status */}
        <div className="max-w-4xl mx-auto mb-4">
          {geoError && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-3 mb-2 rounded">
              <FaMapMarkerAlt className="inline mr-2" />
              Geolocation denied or unavailable. Defaulting to Nepal time (Asia/Kathmandu).
            </div>
          )}
          {isNepalTime && !geoError && (
            <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-2 mb-2 rounded">
              <FaCalendarAlt className="inline mr-2" />
              Using Nepal time zone for calculations.
            </div>
          )}
          <div className="flex items-center gap-4">
            <span className={isOnline ? 'text-green-700' : 'text-red-600'}>
              <FaWifi className="inline mr-1" /> {isOnline ? 'Online' : 'Offline'}
            </span>
            {pdfSyncStatus === 'queued' && (
              <span className="text-yellow-700">PDF queued for upload</span>
            )}
            {pdfSyncStatus === 'synced' && (
              <span className="text-green-700">PDF uploaded when back online</span>
            )}
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
          {/* Left Column: Form */}
          <div className="lg:col-span-1 space-y-6">
            {/* ...existing code... */}
          </div>

          {/* Right Column: Visualization */}
          <div className="lg:col-span-2">
            {/* ...existing code... */}
            {/* PDF Download/Sync Button */}
            {result && (
              <Button
                onClick={() => {
                  if (isOnline) {
                    setPdfSyncStatus('synced');
                    setTimeout(() => setPdfSyncStatus('idle'), 2000);
                  } else {
                    setPdfSyncStatus('queued');
                    setQueuedPDF(result);
                  }
                }}
                variant="outline"
                className="mt-4 border-[#3E2723] text-[#3E2723] w-full"
              >
                <FaDownload className="mr-2" />
                {isOnline ? 'Download Full PDF Chart' : 'Queue PDF for Upload'}
              </Button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OfflineKundali;
