import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FaRocket, 
  FaWifi, 
  FaDownload, 
  FaStar,
  FaCheckCircle,
  FaClock,
  FaShieldAlt,
  FaGlobe,
  FaMobile
} from 'react-icons/fa';
import { 
  GiScrollUnfurled, 
  GiCrystalBall,
  GiStarFormation,
  GiMagicSwirl
} from 'react-icons/gi';

const KundaliHighlight: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState(0);



  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <FaWifi className="h-6 w-6" />,
      title: "100% Offline",
      description: "Works without internet connection",
      color: "text-[#FF6F00]",
      bgColor: "bg-[#FFF3E0]"
    },
    {
      icon: <FaRocket className="h-6 w-6" />,
      title: "WebAssembly Powered",
      description: "Lightning-fast calculations",
      color: "text-[#FF6F00]",
      bgColor: "bg-[#FFF3E0]"
    },
    {
      icon: <FaDownload className="h-6 w-6" />,
      title: "Install as App",
      description: "PWA support for all devices",
      color: "text-[#3E2723]",
      bgColor: "bg-[#EFEBE9]"
    },
    {
      icon: <FaShieldAlt className="h-6 w-6" />,
      title: "100% Private",
      description: "Data stays on your device",
      color: "text-[#3E2723]",
      bgColor: "bg-[#EFEBE9]"
    }
  ];

  const benefits = [
    "Detailed birth chart analysis",
    "Planetary positions & aspects",
    "Dasha & transit predictions",
    "Remedial suggestions",
    "Marriage compatibility",
    "Career & health insights"
  ];

  const stats = [
    { number: "50K+", label: "Kundalis Generated" },
    { number: "99.9%", label: "Accuracy Rate" },
    { number: "0 sec", label: "Loading Time" },
    { number: "15+", label: "Languages" }
  ];

  return (
    <section id="kundali-section" className="py-16 bg-[#F5F5F5] relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 text-[#FF6F00]/10 animate-pulse">
          <GiStarFormation className="h-32 w-32" />
        </div>
        <div className="absolute top-40 right-20 text-[#FF6F00]/10 animate-bounce">
          <GiCrystalBall className="h-24 w-24" />
        </div>
        <div className="absolute bottom-40 left-20 text-[#FF6F00]/10 animate-pulse">
          <GiCrystalBall className="h-28 w-28" />
        </div>
        <div className="absolute bottom-20 right-10 text-[#FF6F00]/10 animate-spin" style={{ animationDuration: '20s' }}>
          <GiMagicSwirl className="h-36 w-36" />
        </div>
        
        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-[#FF6F00]/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-4 border border-white/20">
            <GiScrollUnfurled className="h-4 w-4 text-yellow-300" />
            <FaStar className="h-4 w-4 text-[#FF6F00] animate-spin-slow" />
            <span className="text-[#E65100] text-sm font-medium">Revolutionary Technology</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-[#3E2723] leading-tight">
            World's First
            <span className="block text-[#FF6F00] animate-pulse">
              Offline Kundali Generator
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Experience the future of astrology with our groundbreaking WebAssembly-powered Kundali generator that works completely offline
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Left Side - Features */}
          <div className="space-y-8">
            {/* Unique Selling Points */}
            <Card className="bg-white shadow-xl border-[#FF6F00]/20 hover:border-[#FF6F00] transition-all duration-300 hover:scale-105">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-[#FFF3E0] rounded-full">
                    <FaRocket className="h-8 w-8 text-[#FF6F00]" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2 text-[#3E2723]">Revolutionary Technology</h3>
                    <p className="text-gray-600">Powered by cutting-edge WebAssembly for unmatched performance</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {features.map((feature, index) => (
                    <div 
                      key={index}
                      className={`p-4 rounded-lg transition-all duration-300 cursor-pointer ${
                        activeFeature === index 
                          ? 'bg-[#FFF3E0] scale-105 border border-[#FF6F00]' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={() => setActiveFeature(index)}
                    >
                      <div className={`${feature.color} mb-2 transition-transform duration-300 ${
                        activeFeature === index ? 'scale-110' : ''
                      }`}>
                        {feature.icon}
                      </div>
                      <h4 className={`font-semibold text-sm mb-1 ${activeFeature === index ? 'text-[#E65100]' : 'text-[#3E2723]'}`}>{feature.title}</h4>
                      <p className="text-xs text-gray-500">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Benefits List */}
            <Card className="bg-white shadow-lg border-none hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-[#3E2723]">
                  <GiCrystalBall className="h-6 w-6 text-[#FF6F00]" />
                  What You Get
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {benefits.map((benefit, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#FFF3E0] transition-all duration-300 animate-in fade-in slide-in-from-left-4"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <FaCheckCircle className="h-4 w-4 text-[#FF6F00] flex-shrink-0" />
                      <span className="text-sm text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Demo/Visual */}
          <div className="relative">
            <Card className="bg-white shadow-xl border-[#FF6F00]/10 overflow-hidden hover:scale-105 transition-all duration-500">
              <CardContent className="p-0 relative">
                {/* Mock Kundali Interface */}
                <div className="p-8 bg-[#FFF8E1]">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-[#3E2723]">Kundali Generator</h3>
                    <Badge className="bg-[#FF6F00] hover:bg-[#E65100] animate-pulse text-white">
                      <FaWifi className="h-3 w-3 mr-1" />
                      Offline Ready
                    </Badge>
                  </div>

                  {/* Mock Chart */}
                  <div className="relative mb-6">
                    <div className="w-48 h-48 mx-auto border-2 border-[#FF6F00]/30 rounded-full relative overflow-hidden bg-white">
                      <div className="absolute inset-4 border border-[#FF6F00]/20 rounded-full">
                        <div className="absolute inset-4 border border-[#FF6F00]/10 rounded-full flex items-center justify-center">
                          <GiCrystalBall className="h-16 w-16 text-[#FF6F00] animate-pulse" />
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
                    <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg border border-[#FF6F00]/10">
                      <span className="text-sm text-[#3E2723]">Sun Sign</span>
                      <Badge variant="outline" className="border-[#FF6F00] text-[#E65100]">
                        Leo ♌
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg border border-[#FF6F00]/10">
                      <span className="text-sm text-[#3E2723]">Moon Sign</span>
                      <Badge variant="outline" className="border-[#FF6F00] text-[#E65100]">
                        Cancer ♋
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg border border-[#FF6F00]/10">
                      <span className="text-sm text-[#3E2723]">Ascendant</span>
                      <Badge variant="outline" className="border-[#FF6F00] text-[#E65100]">
                        Virgo ♍
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Generation Status */}
                <div className="bg-[#F5F5F5] p-4 border-t border-[#FF6F00]/10">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-600">Generated in 0.3 seconds • 100% Offline</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-[#FF6F00] rounded-full p-3 animate-bounce shadow-lg">
              <FaRocket className="h-6 w-6 text-white" />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-[#3E2723] rounded-full p-3 animate-pulse shadow-lg">
              <GiMagicSwirl className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card 
              key={index}
              className="bg-white shadow-md border-none text-center hover:bg-gray-50 transition-all duration-300 hover:scale-105 animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <CardContent className="p-6">
                <div className="text-3xl font-bold mb-2 text-[#E65100]">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-4xl mx-auto bg-[#FAFAFA] shadow-sm border-none transition-all duration-300 hover:scale-105">
            <CardContent className="p-8">
              <div className="flex items-center justify-center gap-4 mb-6">
                <Badge className="bg-[#FFE0B2] text-[#E65100] hover:bg-[#FFCC80] animate-pulse">
                  <FaStar className="h-3 w-3 mr-1" />
                  World's First Offline Kundali
                </Badge>
                <Badge className="bg-[#00C853] hover:bg-[#00E676] text-white">
                  <FaGlobe className="h-3 w-3 mr-1" />
                  Works Everywhere
                </Badge>
              </div>
              
              <h3 className="text-3xl md:text-4xl font-bold mb-4 text-[#3E2723]">
                Experience the Future of Astrology
              </h3>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed max-w-2xl mx-auto">
                No internet? No problem! Generate detailed Kundali reports instantly, even in remote areas with poor connectivity. Perfect for pandits and astrology enthusiasts.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/kundali">
                  <Button 
                    size="lg" 
                    className="bg-[#FF6F00] hover:bg-[#E65100] text-white transition-all duration-300 hover:scale-110 hover:shadow-xl"
                  >
                    <GiScrollUnfurled className="h-5 w-5 mr-2" />
                    Try Kundali Generator
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="bg-[#ECEFF1] border-none text-[#546E7A] hover:bg-[#CFD8DC] transition-all duration-300 hover:scale-110"
                >
                  <FaMobile className="h-5 w-5 mr-2" />
                  Download App
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center items-center gap-6 mt-8 text-gray-400">
                <div className="flex items-center gap-2">
                  <FaShieldAlt className="h-4 w-4 text-[#00C853]" />
                  <span className="text-sm">Privacy Protected</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaClock className="h-4 w-4 text-[#2979FF]" />
                  <span className="text-sm">Instant Results</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="h-4 w-4 text-[#FFD600]" />
                  <span className="text-sm">Vedic Accurate</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default KundaliHighlight;