import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { 
  FaSearch, 
  FaCalendarAlt, 
  FaClock, 
  FaVideo, 
  FaGlobe,
  FaStar,
  FaPlay
} from 'react-icons/fa';
import { GiTempleDoor, GiPrayerBeads } from 'react-icons/gi';

const HeroSection: React.FC = () => {
  const { token } = useAuth();
  const [searchData, setSearchData] = useState({
    pujaType: '',
    date: '',
    time: ''
  });

  const pujaTypes = [
    'Ganesh Puja',
    'Lakshmi Puja',
    'Saraswati Puja',
    'Durga Puja',
    'Griha Pravesh',
    'Marriage Ceremony',
    'Naming Ceremony',
    'Thread Ceremony'
  ];

  const timeSlots = [
    '6:00 AM - 8:00 AM',
    '8:00 AM - 10:00 AM',
    '10:00 AM - 12:00 PM',
    '12:00 PM - 2:00 PM',
    '2:00 PM - 4:00 PM',
    '4:00 PM - 6:00 PM',
    '6:00 PM - 8:00 PM'
  ];

  const handleSearch = () => {
    // Handle search logic
    console.log('Search data:', searchData);
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url('/src/assets/images/religious.png')`
        }}
      />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 text-primary/20 animate-pulse">
          <GiTempleDoor className="h-16 w-16" />
        </div>
        <div className="absolute top-40 right-20 text-primary/20 animate-bounce">
          <GiPrayerBeads className="h-12 w-12" />
        </div>
        <div className="absolute bottom-40 left-20 text-primary/20 animate-pulse">
          <FaStar className="h-8 w-8" />
        </div>
        <div className="absolute bottom-20 right-10 text-primary/20 animate-bounce">
          <GiTempleDoor className="h-20 w-20" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm border border-primary/30 rounded-full px-4 py-2 mb-6 animate-in fade-in slide-in-from-top-4">
            <FaGlobe className="h-4 w-4 text-primary-foreground" />
            <span className="text-primary-foreground text-sm font-medium">
              Connect with Authentic Pandits Globally
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-white leading-tight animate-in fade-in slide-in-from-bottom-6 duration-1000">
            Find Your Perfect
            <span className="block bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent animate-pulse">
              Spiritual Guide
            </span>
          </h1>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            Experience authentic puja ceremonies through 
            <span className="text-primary-foreground font-semibold"> live video sessions</span> and 
            get your personalized <span className="text-primary-foreground font-semibold">offline Kundali</span>
          </p>

          {/* Features Pills */}
          <div className="flex flex-wrap justify-center gap-4 mb-10 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
              <FaVideo className="h-4 w-4 text-primary-foreground" />
              <span className="text-white text-sm">Live Video Puja</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
              <GiPrayerBeads className="h-4 w-4 text-primary-foreground" />
              <span className="text-white text-sm">Offline Kundali</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
              <FaStar className="h-4 w-4 text-primary-foreground" />
              <span className="text-white text-sm">Verified Pandits</span>
            </div>
          </div>

          {/* Search Bar */}
          <Card className="max-w-4xl mx-auto p-6 bg-white/95 backdrop-blur-sm border-0 shadow-2xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Puja Type Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <GiTempleDoor className="h-4 w-4 text-primary" />
                  Select Puja Type
                </label>
                <Select value={searchData.pujaType} onValueChange={(value) => setSearchData({...searchData, pujaType: value})}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose puja..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pujaTypes.map((puja) => (
                      <SelectItem key={puja} value={puja}>
                        {puja}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <FaCalendarAlt className="h-4 w-4 text-primary" />
                  Preferred Date
                </label>
                <Input
                  type="date"
                  value={searchData.date}
                  onChange={(e) => setSearchData({...searchData, date: e.target.value})}
                  className="w-full"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Time Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <FaClock className="h-4 w-4 text-primary" />
                  Preferred Time
                </label>
                <Select value={searchData.time} onValueChange={(value) => setSearchData({...searchData, time: value})}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select time..." />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search Button */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-transparent">Search</label>
                <Button 
                  onClick={handleSearch}
                  className="w-full h-10 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/80 hover:to-primary transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  <FaSearch className="h-4 w-4 mr-2" />
                  Find Pandits
                </Button>
              </div>
            </div>
          </Card>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 animate-in fade-in slide-in-from-bottom-14 duration-1000 delay-1000">
            {token ? (
              <Link to="/booking">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/80 hover:to-primary transition-all duration-300 hover:scale-105 hover:shadow-xl"
                >
                  <FaPlay className="h-5 w-5 mr-2" />
                  Start Your Journey
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button 
                    size="lg" 
                    className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/80 hover:to-primary transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  >
                    <FaPlay className="h-5 w-5 mr-2" />
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/booking">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="text-lg px-8 py-6 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 transition-all duration-300 hover:scale-105"
                  >
                    Browse Pandits
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 mt-12 text-white/80 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-1200">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} className="h-4 w-4 text-yellow-400" />
                ))}
              </div>
              <span className="text-sm">4.9/5 Rating</span>
            </div>
            <div className="text-sm">
              <span className="font-semibold">10,000+</span> Happy Customers
            </div>
            <div className="text-sm">
              <span className="font-semibold">500+</span> Verified Pandits
            </div>
            <div className="text-sm">
              <span className="font-semibold">50+</span> Cities Covered
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;