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
import { PDFDownloadLink } from '@react-pdf/renderer';
//

const OfflineKundali: React.FC = () => {
  const { token } = useAuth();
  const isAuthenticated = !!token;
  const navigate = useNavigate();
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

  const getSunSign = (day: number, month: number) => {
    const days = [21, 20, 21, 21, 22, 22, 23, 24, 24, 24, 23, 22];
    const signs = ["Aquarius", "Pisces", "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn"];
    if (month == 1 && day < 20) return "Capricorn";
    if (day < days[month - 1]) return signs[month - 2];
    return signs[month - 1];
  };

  //

  const handleGenerate = () => {
    if (!formData.day || !formData.month || !formData.year) {
      alert("Please enter a valid date.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const sunSign = getSunSign(parseInt(formData.day), parseInt(formData.month));
      setResult({
        sunSign,
        moonSign: "Taurus", 
        nakshatra: "Rohini", 
        details: { ...formData }
      });
      setLoading(false);
    }, 1500);
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
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="focus-visible:ring-[#FF6F00]"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select 
                    value={formData.gender} 
                    onValueChange={(v) => setFormData({...formData, gender: v})}
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
                    onChange={(e) => setFormData({...formData, place: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Input placeholder="DD" value={formData.day} onChange={e => setFormData({...formData, day: e.target.value})} />
                <Input placeholder="MM" value={formData.month} onChange={e => setFormData({...formData, month: e.target.value})} />
                <Input placeholder="YYYY" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="HH" value={formData.hour} onChange={e => setFormData({...formData, hour: e.target.value})} />
                <Input placeholder="MM" value={formData.minute} onChange={e => setFormData({...formData, minute: e.target.value})} />
              </div>

              <Button 
                onClick={handleGenerate} 
                className="w-full bg-[#FF6F00] hover:bg-[#E65100] text-white"
                disabled={loading}
              >
                {loading ? <FaSpinner className="animate-spin mr-2" /> : <GiStarsStack className="mr-2" />}
                Generate Kundali
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
                <div className="w-full text-center space-y-6">
                  <div className="border-4 border-[#3E2723] p-4 bg-white rounded-lg inline-block shadow-xl">
                      {/* Simulated Chart */}
                      <svg width="200" height="200" viewBox="0 0 100 100" className="mx-auto">
                        <rect x="2" y="2" width="96" height="96" fill="none" stroke="#E65100" strokeWidth="2"/>
                        <line x1="2" y1="2" x2="98" y2="98" stroke="#E65100" strokeWidth="1"/>
                        <line x1="98" y1="2" x2="2" y2="98" stroke="#E65100" strokeWidth="1"/>
                        <path d="M50 2 L98 50 L50 98 L2 50 Z" fill="none" stroke="#E65100" strokeWidth="1"/>
                        <text x="50" y="45" fontSize="8" textAnchor="middle" fill="#3E2723">Sun: {result.sunSign}</text>
                      </svg>
                  </div>
                  
                  <div className="flex justify-around bg-white p-4 rounded-lg shadow-sm">
                    <div><p className="text-xs text-gray-500">Sun Sign</p><p className="font-bold text-[#E65100]">{result.sunSign}</p></div>
                    <div><p className="text-xs text-gray-500">Moon Sign</p><p className="font-bold text-[#3E2723]">{result.moonSign}</p></div>
                  </div>

                  <Button onClick={() => window.print()} variant="outline" className="mt-4 border-[#3E2723] text-[#3E2723] w-full">
                    <FaDownload className="mr-2" />
                    Download Chart
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
