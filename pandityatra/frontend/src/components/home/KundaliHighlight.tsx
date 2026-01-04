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
      description: "Your data stays on your device",
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
    <section id="kundali-section" className="py-16 bg-gradient-to-br from-muted via-muted to-background relative overflow-hidden">
      {/* Animated Background Elements */}
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
        
        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-primary/10 rounded-full animate-pulse"
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
          <div className="inline-flex items-center gap-2 bg-primary/15 backdrop-blur-sm rounded-full px-4 py-2 mb-4 border border-primary/30">
            <GiScrollUnfurled className="h-4 w-4 text-primary" />
            <span className="text-primary text-sm font-medium">Revolutionary Technology</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-foreground leading-tight">
            World's First
            <span className="block bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent animate-pulse">
              Offline Kundali Generator
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-foreground max-w-3xl mx-auto leading-relaxed font-medium">
            Experience the future of astrology with our groundbreaking WebAssembly-powered Kundali generator that works completely offline
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Left Side - Features */}
          <div className="space-y-8">
            {/* Unique Selling Points */}
            <Card className="bg-white border-primary/20 shadow-lg hover:bg-white/95 transition-all duration-300 hover:scale-105">
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

            {/* Benefits List */}
            <Card className="bg-white border-primary/20 shadow-lg hover:bg-white/95 transition-all duration-300">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <GiCrystalBall className="h-6 w-6 text-primary" />
                  What You Get
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {benefits.map((benefit, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-all duration-300 animate-in fade-in slide-in-from-left-4"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <FaCheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm text-foreground font-medium">{benefit}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Demo/Visual */}
          <div className="relative">
            <Card className="bg-white border-primary/20 shadow-lg text-foreground overflow-hidden hover:scale-105 transition-all duration-500">
              <CardContent className="p-0 relative">
                {/* Mock Kundali Interface */}
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">Kundali Generator</h3>
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
                      <span className="text-sm font-medium">Sun Sign</span>
                      <Badge variant="outline" className="border-primary/30 text-foreground bg-primary/10">
                        Leo ♌
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Moon Sign</span>
                      <Badge variant="outline" className="border-blue-300 text-blue-600 bg-blue-50">
                        Cancer ♋
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Ascendant</span>
                      <Badge variant="outline" className="border-green-300 text-green-600 bg-green-50">
                        Virgo ♍
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Generation Status */}
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 border-t border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-foreground">Generated in 0.3 seconds • 100% Offline</span>
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

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card 
              key={index}
              className="bg-white border-primary/20 shadow-lg text-center hover:bg-white/95 transition-all duration-300 hover:scale-105 animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <CardContent className="p-6">
                <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary/80 to-primary bg-clip-text text-transparent">
                  {stat.number}
                </div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 shadow-lg text-foreground hover:scale-105 transition-all duration-300">
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
              
              <h3 className="text-3xl md:text-4xl font-bold mb-4">
                Experience the Future of Astrology
              </h3>
              <p className="text-muted-foreground mb-8 text-lg leading-relaxed max-w-2xl mx-auto font-medium">
                No internet? No problem! Generate detailed Kundali reports instantly, even in remote areas with poor connectivity. Perfect for pandits and astrology enthusiasts.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/kundali">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-primary/80 to-primary hover:from-primary hover:to-primary/80 text-white transition-all duration-300 hover:scale-110 hover:shadow-xl"
                  >
                    <GiScrollUnfurled className="h-5 w-5 mr-2" />
                    Try Kundali Generator
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-primary/50 text-primary hover:bg-primary/10 hover:border-primary transition-all duration-300 hover:scale-110"
                >
                  <FaMobile className="h-5 w-5 mr-2" />
                  Download App
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center items-center gap-6 mt-8 text-muted-foreground">
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
  );
};

export default KundaliHighlight;