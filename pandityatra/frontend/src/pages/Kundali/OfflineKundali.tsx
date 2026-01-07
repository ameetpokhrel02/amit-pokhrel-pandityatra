import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
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

const OfflineKundali: React.FC = () => {
  const { isAuthenticated, login } = useAuth();
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

  const handleGenerate = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Logic for WASM generation would go here
      alert('Kundali Generated! (WASM Placeholder)');
    }, 2000);
  };

  if (!isAuthenticated) {
    return (
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
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] p-4 md:p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-[#3E2723] mb-2 flex items-center justify-center gap-3">
          <GiSolarSystem className="text-[#FF6F00]" /> Offline Kundali Generator
        </h1>
        <p className="text-gray-600">Generate detailed Vedic charts without internet connection.</p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
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
            <CardContent className="p-8 flex items-center justify-center min-h-[400px] bg-[#FFF8E1]">
              <div className="text-center text-[#FF6F00] opacity-50">
                <GiSolarSystem size={120} className="mx-auto mb-4" />
                <p className="text-xl font-medium">Enter birth details to generate chart</p>
                <div className="mt-4 p-4 border-2 border-dashed border-[#FF6F00] rounded-lg">
                  <p className="text-sm text-[#3E2723]">Sample Output Placeholder</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OfflineKundali;
