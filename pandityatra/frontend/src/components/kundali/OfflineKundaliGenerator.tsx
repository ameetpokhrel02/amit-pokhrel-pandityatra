import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Star, MapPin, Clock, Calendar, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocation } from '@/hooks/useLocation';
import { DateTime } from 'luxon';

interface KundaliData {
  personalInfo: {
    name: string;
    dateOfBirth: string;
    timeOfBirth: string;
    placeOfBirth: string;
    latitude: number;
    longitude: number;
  };
  planetaryPositions: {
    [planet: string]: {
      sign: string;
      degree: number;
      house: number;
      retrograde: boolean;
    };
  };
  houses: {
    [house: number]: {
      sign: string;
      lord: string;
      planets: string[];
    };
  };
  predictions: {
    personality: string;
    career: string;
    relationships: string;
    health: string;
    wealth: string;
    spirituality: string;
  };
  compatibility?: {
    bestMatches: string[];
    challenges: string[];
  };
}

interface OfflineKundaliGeneratorProps {
  onKundaliGenerated?: (kundali: KundaliData) => void;
}

export const OfflineKundaliGenerator: React.FC<OfflineKundaliGeneratorProps> = ({
  onKundaliGenerated
}) => {
  const { latitude, longitude, timezone, toNepalTime } = useLocation();
  
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    timeOfBirth: '',
    placeOfBirth: '',
    latitude: latitude || 27.7172, // Default to Kathmandu
    longitude: longitude || 85.3240,
    language: 'english'
  });
  
  const [loading, setLoading] = useState(false);
  const [kundaliData, setKundaliData] = useState<KundaliData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wasmLoaded, setWasmLoaded] = useState(false);

  useEffect(() => {
    loadSwissEphemeris();
  }, []);

  useEffect(() => {
    if (latitude && longitude) {
      setFormData(prev => ({
        ...prev,
        latitude,
        longitude
      }));
    }
  }, [latitude, longitude]);

  const loadSwissEphemeris = async () => {
    try {
      // In a real implementation, you would load the Swiss Ephemeris WebAssembly module
      // For now, we'll simulate the loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      setWasmLoaded(true);
    } catch (error) {
      console.error('Failed to load Swiss Ephemeris:', error);
      setError('Failed to load astrological calculation engine');
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateKundali = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validate inputs
      if (!formData.name || !formData.dateOfBirth || !formData.timeOfBirth) {
        throw new Error('Please fill in all required fields');
      }

      // Convert to Nepal time for calculations
      const birthDateTime = DateTime.fromISO(`${formData.dateOfBirth}T${formData.timeOfBirth}`);
      const nepalTime = toNepalTime(birthDateTime);

      // Simulate astrological calculations
      // In a real implementation, this would use Swiss Ephemeris WebAssembly
      const calculatedKundali = await simulateKundaliCalculation({
        ...formData,
        birthDateTime: nepalTime
      });

      setKundaliData(calculatedKundali);
      onKundaliGenerated?.(calculatedKundali);

    } catch (err: any) {
      setError(err.message || 'Failed to generate Kundali');
    } finally {
      setLoading(false);
    }
  };

  const simulateKundaliCalculation = async (data: any): Promise<KundaliData> => {
    // Simulate calculation time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock astrological data - in real implementation, this would come from Swiss Ephemeris
    return {
      personalInfo: {
        name: data.name,
        dateOfBirth: data.dateOfBirth,
        timeOfBirth: data.timeOfBirth,
        placeOfBirth: data.placeOfBirth,
        latitude: data.latitude,
        longitude: data.longitude
      },
      planetaryPositions: {
        Sun: { sign: 'Leo', degree: 15.5, house: 1, retrograde: false },
        Moon: { sign: 'Cancer', degree: 22.3, house: 12, retrograde: false },
        Mars: { sign: 'Aries', degree: 8.7, house: 9, retrograde: false },
        Mercury: { sign: 'Virgo', degree: 12.1, house: 2, retrograde: true },
        Jupiter: { sign: 'Sagittarius', degree: 25.8, house: 5, retrograde: false },
        Venus: { sign: 'Libra', degree: 18.4, house: 3, retrograde: false },
        Saturn: { sign: 'Capricorn', degree: 5.9, house: 6, retrograde: false },
        Rahu: { sign: 'Gemini', degree: 14.2, house: 11, retrograde: true },
        Ketu: { sign: 'Sagittarius', degree: 14.2, house: 5, retrograde: true }
      },
      houses: {
        1: { sign: 'Leo', lord: 'Sun', planets: ['Sun'] },
        2: { sign: 'Virgo', lord: 'Mercury', planets: ['Mercury'] },
        3: { sign: 'Libra', lord: 'Venus', planets: ['Venus'] },
        4: { sign: 'Scorpio', lord: 'Mars', planets: [] },
        5: { sign: 'Sagittarius', lord: 'Jupiter', planets: ['Jupiter', 'Ketu'] },
        6: { sign: 'Capricorn', lord: 'Saturn', planets: ['Saturn'] },
        7: { sign: 'Aquarius', lord: 'Saturn', planets: [] },
        8: { sign: 'Pisces', lord: 'Jupiter', planets: [] },
        9: { sign: 'Aries', lord: 'Mars', planets: ['Mars'] },
        10: { sign: 'Taurus', lord: 'Venus', planets: [] },
        11: { sign: 'Gemini', lord: 'Mercury', planets: ['Rahu'] },
        12: { sign: 'Cancer', lord: 'Moon', planets: ['Moon'] }
      },
      predictions: {
        personality: 'You are a natural leader with strong willpower and confidence. Your Leo ascendant gives you a regal presence and the ability to inspire others.',
        career: 'Your career will flourish in leadership roles, government service, or creative fields. Jupiter in the 5th house indicates success in education and speculation.',
        relationships: 'Venus in the 3rd house suggests harmonious relationships with siblings and neighbors. Marriage will be happy and prosperous.',
        health: 'Generally good health, but pay attention to heart-related issues due to Sun in the 1st house. Regular exercise is recommended.',
        wealth: 'Financial stability will come through your own efforts. Saturn in the 6th house indicates steady income through service.',
        spirituality: 'Strong spiritual inclinations with Ketu in the 5th house. You may be drawn to meditation and philosophical studies.'
      },
      compatibility: {
        bestMatches: ['Aries', 'Sagittarius', 'Gemini'],
        challenges: ['Scorpio', 'Taurus', 'Aquarius']
      }
    };
  };

  const downloadPDF = () => {
    if (!kundaliData) return;

    // Create a simple PDF-like content
    const content = `
KUNDALI REPORT
==============

Personal Information:
Name: ${kundaliData.personalInfo.name}
Date of Birth: ${kundaliData.personalInfo.dateOfBirth}
Time of Birth: ${kundaliData.personalInfo.timeOfBirth}
Place of Birth: ${kundaliData.personalInfo.placeOfBirth}

Planetary Positions:
${Object.entries(kundaliData.planetaryPositions).map(([planet, pos]) => 
  `${planet}: ${pos.sign} ${pos.degree.toFixed(1)}° (House ${pos.house})${pos.retrograde ? ' (R)' : ''}`
).join('\n')}

Predictions:
Personality: ${kundaliData.predictions.personality}
Career: ${kundaliData.predictions.career}
Relationships: ${kundaliData.predictions.relationships}
Health: ${kundaliData.predictions.health}
Wealth: ${kundaliData.predictions.wealth}
Spirituality: ${kundaliData.predictions.spirituality}

Generated by PanditYatra - Offline Kundali Generator
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${kundaliData.personalInfo.name}_Kundali.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const popularPlaces = [
    { name: 'Kathmandu, Nepal', lat: 27.7172, lng: 85.3240 },
    { name: 'Pokhara, Nepal', lat: 28.2096, lng: 83.9856 },
    { name: 'Delhi, India', lat: 28.6139, lng: 77.2090 },
    { name: 'Mumbai, India', lat: 19.0760, lng: 72.8777 },
    { name: 'New York, USA', lat: 40.7128, lng: -74.0060 },
    { name: 'London, UK', lat: 51.5074, lng: -0.1278 }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
          <Star className="w-8 h-8 text-orange-500" />
          Offline Kundali Generator
        </h1>
        <p className="text-gray-600">
          Generate your complete astrological chart using advanced calculations
        </p>
        {!wasmLoaded && (
          <Badge variant="outline" className="mt-2">
            <Loader2 className="w-3 h-3 animate-spin mr-1" />
            Loading calculation engine...
          </Badge>
        )}
      </motion.div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Birth Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                value={formData.language}
                onValueChange={(value) => handleInputChange('language', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="nepali">नेपाली</SelectItem>
                  <SelectItem value="hindi">हिंदी</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeOfBirth">Time of Birth *</Label>
              <Input
                id="timeOfBirth"
                type="time"
                value={formData.timeOfBirth}
                onChange={(e) => handleInputChange('timeOfBirth', e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="placeOfBirth">Place of Birth</Label>
              <Input
                id="placeOfBirth"
                value={formData.placeOfBirth}
                onChange={(e) => handleInputChange('placeOfBirth', e.target.value)}
                placeholder="City, Country"
              />
              
              {/* Popular Places */}
              <div className="flex flex-wrap gap-2 mt-2">
                {popularPlaces.map((place) => (
                  <Button
                    key={place.name}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleInputChange('placeOfBirth', place.name);
                      handleInputChange('latitude', place.lat);
                      handleInputChange('longitude', place.lng);
                    }}
                    className="text-xs"
                  >
                    <MapPin className="w-3 h-3 mr-1" />
                    {place.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="0.0001"
                value={formData.latitude}
                onChange={(e) => handleInputChange('latitude', parseFloat(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="0.0001"
                value={formData.longitude}
                onChange={(e) => handleInputChange('longitude', parseFloat(e.target.value))}
              />
            </div>
          </div>

          {/* Timezone Info */}
          <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
            <Clock className="w-4 h-4 inline mr-2" />
            Calculations will be performed in Nepal Standard Time (UTC+5:45)
            {timezone !== 'Asia/Kathmandu' && (
              <span className="block mt-1">
                Your timezone: {timezone} - times will be automatically converted
              </span>
            )}
          </div>

          <Button
            onClick={generateKundali}
            disabled={loading || !wasmLoaded || !formData.name || !formData.dateOfBirth || !formData.timeOfBirth}
            className="w-full h-12 text-base bg-orange-600 hover:bg-orange-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Calculating Kundali...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Kundali
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {kundaliData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Personal Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Kundali Report</CardTitle>
                <Button onClick={downloadPDF} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Name:</span>
                  <p>{kundaliData.personalInfo.name}</p>
                </div>
                <div>
                  <span className="font-semibold">Date:</span>
                  <p>{kundaliData.personalInfo.dateOfBirth}</p>
                </div>
                <div>
                  <span className="font-semibold">Time:</span>
                  <p>{kundaliData.personalInfo.timeOfBirth}</p>
                </div>
                <div>
                  <span className="font-semibold">Place:</span>
                  <p>{kundaliData.personalInfo.placeOfBirth}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Planetary Positions */}
          <Card>
            <CardHeader>
              <CardTitle>Planetary Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(kundaliData.planetaryPositions).map(([planet, position]) => (
                  <div key={planet} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-semibold text-orange-600">{planet}</div>
                    <div className="text-sm text-gray-600">
                      {position.sign} {position.degree.toFixed(1)}°
                    </div>
                    <div className="text-xs text-gray-500">
                      House {position.house}
                      {position.retrograde && ' (Retrograde)'}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Predictions */}
          <Card>
            <CardHeader>
              <CardTitle>Astrological Predictions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(kundaliData.predictions).map(([category, prediction]) => (
                <div key={category} className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-semibold capitalize text-gray-900">{category}</h4>
                  <p className="text-gray-700 text-sm mt-1">{prediction}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Compatibility */}
          {kundaliData.compatibility && (
            <Card>
              <CardHeader>
                <CardTitle>Compatibility Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-green-600 mb-2">Best Matches</h4>
                    <div className="flex flex-wrap gap-2">
                      {kundaliData.compatibility.bestMatches.map((sign) => (
                        <Badge key={sign} variant="outline" className="bg-green-50 text-green-700">
                          {sign}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-600 mb-2">Challenges</h4>
                    <div className="flex flex-wrap gap-2">
                      {kundaliData.compatibility.challenges.map((sign) => (
                        <Badge key={sign} variant="outline" className="bg-red-50 text-red-700">
                          {sign}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default OfflineKundaliGenerator;