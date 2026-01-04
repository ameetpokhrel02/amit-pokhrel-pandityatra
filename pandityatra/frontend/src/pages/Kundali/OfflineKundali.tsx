import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import {
  FaWifi,
  FaRocket,
  FaShieldAlt,
  FaDownload,
  FaStar,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaGlobe,
  FaMobile
} from 'react-icons/fa';
import { 
  GiScrollUnfurled, 
  GiCrystalBall, 
  GiStarFormation, 
  GiMagicSwirl 
} from 'react-icons/gi';
import PWALogo from '@/assets/images/PWA.png';

const OfflineKundali: React.FC = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    timeOfBirth: '',
    placeOfBirth: '',
    gender: 'male'
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [kundaliGenerated, setKundaliGenerated] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  // PWA Installation Handler
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPWAPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handlePWAInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPWAPrompt(false);
    }

    setDeferredPrompt(null);
  };

  // Feature cycling
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenerateKundali = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is authenticated
    if (!token || !user) {
      setShowAuthDialog(true);
      return;
    }
    
    setIsGenerating(true);
    
    // Simulate WASM-based Kundali generation
    setTimeout(() => {
      setIsGenerating(false);
      setKundaliGenerated(true);
    }, 2000);
  };

  const handleLoginRedirect = () => {
    setShowAuthDialog(false);
    navigate('/login', { state: { from: '/kundali' } });
  };

  const handleSignupRedirect = () => {
    setShowAuthDialog(false);
    navigate('/register', { state: { from: '/kundali' } });
  };

  const features = [
    {
      icon: <FaWifi className="h-6 w-6" />,
      title: "100% Offline",
      description: "Works without internet connection",
      color: "text-blue-500",
      bgColor: "bg-blue-50"
    },
    {
      icon: <FaRocket className="h-6 w-6" />,
      title: "WebAssembly Powered",
      description: "Lightning-fast calculations",
      color: "text-purple-500",
      bgColor: "bg-purple-50"
    },
    {
      icon: <FaShieldAlt className="h-6 w-6" />,
      title: "Privacy First",
      description: "Data stays on your device",
      color: "text-green-500",
      bgColor: "bg-green-50"
    },
    {
      icon: <FaDownload className="h-6 w-6" />,
      title: "Instant Generation",
      description: "Get results in seconds",
      color: "text-primary",
      bgColor: "bg-gray-50"
    }
  ];

  const benefits = [
    "Detailed birth chart analysis",
    "Planetary positions & aspects",
    "Dasha & Transit predictions",
    "Yogas & Doshas analysis",
    "Nakshatra details",
    "Remedial suggestions"
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      {/* Hero Section - Light Background with Cream */}
      <section className="py-16 bg-gradient-to-br from-muted via-muted to-background relative overflow-hidden">
        {/* Subtle Background Elements */}
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute top-20 left-10 text-primary/10 animate-pulse">
            <GiStarFormation className="h-32 w-32" />
          </div>
          <div className="absolute top-40 right-20 text-primary/10 animate-bounce">
            <GiCrystalBall className="h-24 w-24" />
          </div>
          <div className="absolute bottom-40 left-20 text-primary/10 animate-pulse">
            <GiCrystalBall className="h-28 w-28" />
          </div>
          <div className="absolute bottom-20 right-10 text-primary/10 animate-spin" style={{ animationDuration: '20s' }}>
            <GiMagicSwirl className="h-36 w-36" />
          </div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/15 backdrop-blur-sm rounded-full px-4 py-2 mb-4 border border-primary/30">
              <GiScrollUnfurled className="h-4 w-4 text-primary" />
              <span className="text-primary text-sm font-medium">Revolutionary Technology</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground leading-tight">
              World's First
              <span className="block bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent animate-pulse">
                Offline Kundali Generator
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-foreground max-w-3xl mx-auto leading-relaxed font-medium">
              Experience the future of astrology with our groundbreaking WebAssembly-powered Kundali generator that works completely offline
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-16">
            {/* Left Side - Features & Form */}
            <div className="space-y-8">
              {/* Features Card */}
              <Card className="bg-white border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-gradient-to-r from-primary/80 to-primary rounded-full">
                      <FaRocket className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground mb-2">Revolutionary Technology</h3>
                      <p className="text-muted-foreground font-medium">Powered by cutting-edge WebAssembly for unmatched performance</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {features.map((feature, index) => (
                      <div 
                        key={index}
                        className={`p-4 rounded-lg transition-all duration-300 cursor-pointer border ${
                          activeFeature === index 
                            ? 'bg-primary/10 scale-105 border-primary/50' 
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                        onClick={() => setActiveFeature(index)}
                      >
                        <div className={`${feature.color} mb-2 transition-transform duration-300 ${
                          activeFeature === index ? 'scale-110' : ''
                        }`}>
                          {feature.icon}
                        </div>
                        <h4 className="font-semibold text-sm text-foreground mb-1">{feature.title}</h4>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Benefits Card */}
              <Card className="bg-white border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <GiCrystalBall className="h-6 w-6 text-primary" />
                    What You Get
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {benefits.map((benefit, index) => (
                      <div 
                        key={index}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-all duration-300"
                      >
                        <FaCheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm text-foreground font-medium">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* PWA Installation Card */}
              {showPWAPrompt && (
                <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30 shadow-lg hover:scale-105 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <img src={PWALogo} alt="PWA" className="h-16 w-16 rounded-lg" />
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-foreground mb-2">Install Web App</h3>
                        <p className="text-sm text-muted-foreground mb-4 font-medium">
                          Install our app for offline access and a better experience!
                        </p>
                        <div className="flex gap-2">
                          <Button 
                            onClick={handlePWAInstall}
                            className="bg-primary hover:bg-primary/90 text-white"
                            size="sm"
                          >
                            <FaMobile className="mr-2 h-4 w-4" />
                            Install Now
                          </Button>
                          <Button 
                            onClick={() => setShowPWAPrompt(false)}
                            variant="outline"
                            className="border-primary/30 text-foreground hover:bg-primary/10"
                            size="sm"
                          >
                            Later
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Input Form */}
              <Card className="bg-white border-primary/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <GiScrollUnfurled className="h-6 w-6 text-primary" />
                    Enter Birth Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleGenerateKundali} className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-foreground font-medium">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="mt-1 border-primary/20 focus:border-primary/50"
                      />
                    </div>

                    <div>
                      <Label htmlFor="gender" className="text-foreground font-medium">Gender</Label>
                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full mt-1 px-3 py-2 border border-primary/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        required
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="dateOfBirth" className="flex items-center gap-2 text-foreground font-medium">
                        <FaCalendarAlt className="h-4 w-4" />
                        Date of Birth
                      </Label>
                      <Input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        required
                        className="mt-1 border-primary/20 focus:border-primary/50"
                      />
                    </div>

                    <div>
                      <Label htmlFor="timeOfBirth" className="flex items-center gap-2 text-foreground font-medium">
                        <FaClock className="h-4 w-4" />
                        Time of Birth
                      </Label>
                      <Input
                        id="timeOfBirth"
                        name="timeOfBirth"
                        type="time"
                        value={formData.timeOfBirth}
                        onChange={handleInputChange}
                        required
                        className="mt-1 border-primary/20 focus:border-primary/50"
                      />
                    </div>

                    <div>
                      <Label htmlFor="placeOfBirth" className="flex items-center gap-2 text-foreground font-medium">
                        <FaMapMarkerAlt className="h-4 w-4" />
                        Place of Birth
                      </Label>
                      <Input
                        id="placeOfBirth"
                        name="placeOfBirth"
                        type="text"
                        placeholder="City, State, Country"
                        value={formData.placeOfBirth}
                        onChange={handleInputChange}
                        required
                        className="mt-1 border-primary/20 focus:border-primary/50"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-primary/80 to-primary hover:from-primary hover:to-primary/80 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Generating Kundali...
                        </>
                      ) : (
                        <>
                          <FaRocket className="mr-2" />
                          Generate Kundali
                        </>
                      )}
                    </Button>

                    {/* Offline Status */}
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">
                          Offline Mode Active - All calculations on your device
                        </span>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Preview/Demo */}
            <div className="relative">
              <Card className="bg-white border-primary/20 shadow-lg overflow-hidden hover:scale-105 transition-all duration-500">
                <CardContent className="p-0 relative">
                  {!kundaliGenerated ? (
                    <div className="p-8">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-foreground">Kundali Generator</h3>
                        <Badge className="bg-primary hover:bg-primary/90 text-white animate-pulse">
                          <FaWifi className="h-3 w-3 mr-1" />
                          Offline Ready
                        </Badge>
                      </div>

                      {/* Mock Chart */}
                      <div className="relative mb-6">
                        <div className="w-48 h-48 mx-auto border-2 border-primary/30 rounded-full relative overflow-hidden">
                          <div className="absolute inset-4 border border-primary/20 rounded-full">
                            <div className="absolute inset-4 border border-primary/10 rounded-full flex items-center justify-center">
                              <GiCrystalBall className="h-16 w-16 text-primary/50 animate-pulse" />
                            </div>
                          </div>
                          
                          {/* Zodiac Signs */}
                          {[...Array(12)].map((_, i) => (
                            <div
                              key={i}
                              className="absolute w-6 h-6 bg-gradient-to-r from-primary/80 to-primary rounded-full flex items-center justify-center text-xs font-bold text-white animate-pulse"
                              style={{
                                top: `${50 + 40 * Math.cos((i * 30 - 90) * Math.PI / 180)}%`,
                                left: `${50 + 40 * Math.sin((i * 30 - 90) * Math.PI / 180)}%`,
                                transform: 'translate(-50%, -50%)',
                                animationDelay: `${i * 0.1}s`
                              }}
                            >
                              {i + 1}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Mock Details */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <span className="text-sm text-foreground font-medium">Sun Sign</span>
                          <Badge variant="outline" className="border-primary/30 text-foreground bg-primary/10">
                            Leo ♌
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <span className="text-sm text-foreground font-medium">Moon Sign</span>
                          <Badge variant="outline" className="border-blue-300 text-blue-600 bg-blue-50">
                            Cancer ♋
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <span className="text-sm text-foreground font-medium">Ascendant</span>
                          <Badge variant="outline" className="border-green-300 text-green-600 bg-green-50">
                            Virgo ♍
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 space-y-4">
                      <div className="bg-muted border border-primary/20 p-4 rounded-lg">
                        <h3 className="font-bold text-lg text-foreground mb-2">Basic Details</h3>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p><strong className="text-foreground">Name:</strong> {formData.name}</p>
                          <p><strong className="text-foreground">Date of Birth:</strong> {formData.dateOfBirth}</p>
                          <p><strong className="text-foreground">Time of Birth:</strong> {formData.timeOfBirth}</p>
                          <p><strong className="text-foreground">Place:</strong> {formData.placeOfBirth}</p>
                        </div>
                      </div>

                      <Button className="w-full bg-gradient-to-r from-primary/80 to-primary hover:from-primary hover:to-primary/80 text-white">
                        <FaDownload className="mr-2" />
                        Download Full Report (PDF)
                      </Button>
                    </div>
                  )}

                  {/* Generation Status */}
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 border-t border-primary/20">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-foreground">
                        {kundaliGenerated ? 'Generated in 0.3 seconds • 100% Offline' : 'Ready to Generate • 100% Offline'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-gradient-to-r from-primary/80 to-primary rounded-full p-3 animate-bounce shadow-lg">
                <FaRocket className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-gradient-to-r from-primary to-primary/80 rounded-full p-3 animate-pulse shadow-lg">
                <GiMagicSwirl className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <Card className="max-w-4xl mx-auto bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 shadow-lg hover:scale-105 transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center justify-center gap-4 mb-6 flex-wrap">
                  <Badge className="bg-primary hover:bg-primary/90 text-white animate-pulse">
                    <FaStar className="h-3 w-3 mr-1" />
                    World's First Offline Kundali
                  </Badge>
                  <Badge className="bg-secondary hover:bg-secondary/90 text-white">
                    <FaGlobe className="h-3 w-3 mr-1" />
                    Works Everywhere
                  </Badge>
                </div>
                
                <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Experience the Future of Astrology
                </h3>
                <p className="text-muted-foreground mb-8 text-lg leading-relaxed max-w-2xl mx-auto font-medium">
                  No internet? No problem! Generate detailed Kundali reports instantly, even in remote areas with poor connectivity. Perfect for pandits and astrology enthusiasts.
                </p>
                
                {/* Trust Indicators */}
                <div className="flex flex-wrap justify-center items-center gap-6 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <FaShieldAlt className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Privacy Protected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaClock className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Instant Results</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaCheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Vedic Accurate</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />

      {/* Authentication Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-md bg-background border-primary/20">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="bg-primary/20 p-3 rounded-full">
                <FaExclamationTriangle className="h-8 w-8 text-primary" />
              </div>
            </div>
            <DialogTitle className="text-center text-xl text-foreground">
              Login Required
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground font-medium">
              You need to be logged in to generate your Kundali. Please login or create a new account to continue.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex flex-col sm:flex-col gap-2 mt-4">
            <Button
              onClick={handleLoginRedirect}
              className="w-full bg-gradient-to-r from-primary/80 to-primary hover:from-primary hover:to-primary/80 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
            >
              Login to Continue
            </Button>
            <Button
              onClick={handleSignupRedirect}
              variant="outline"
              className="w-full border-primary/50 text-primary hover:bg-primary/10 hover:border-primary transition-all duration-300 hover:scale-[1.02]"
            >
              Create New Account
            </Button>
            <Button
              onClick={() => setShowAuthDialog(false)}
              variant="ghost"
              className="w-full hover:bg-muted transition-all duration-300 text-foreground"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OfflineKundali;
