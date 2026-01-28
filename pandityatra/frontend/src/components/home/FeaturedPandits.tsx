import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  FaStar,
  FaVideo,
  FaMapMarkerAlt,
  FaLanguage,
  FaChevronLeft,
  FaChevronRight,
  FaCheckCircle,
  FaCalendarAlt
} from 'react-icons/fa';
import { GiTempleDoor } from 'react-icons/gi';

import { fetchPandits } from '@/lib/api';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

// Local interface for display (mapped from API)
interface DisplayPandit {
  id: number;
  name: string;
  image: string;
  rating: number;
  reviewCount: number;
  experience: number;
  specializations: string[];
  languages: string[];
  location: string;
  isVerified: boolean;
  isAvailable: boolean;
  completedPujas: number;
  startingPrice: number;
}

const FeaturedPandits: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const [pandits, setPandits] = useState<DisplayPandit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPandits = async () => {
      try {
        const data = await fetchPandits();
        // Map API data to DisplayPandit format
        const mapped: DisplayPandit[] = data.map(p => ({
          id: p.id,
          name: p.user_details.full_name || 'Pandit',
          image: p.user_details.profile_pic_url || '/src/assets/images/placeholder_pandit.png', // Fallback
          rating: p.rating || 0,
          reviewCount: 0, // Placeholder
          experience: p.experience_years,
          specializations: p.expertise ? p.expertise.split(',').map(s => s.trim()) : [],
          languages: p.language ? p.language.split(',').map(s => s.trim()) : [],
          location: "Nepal", // Placeholder
          isVerified: p.is_verified,
          isAvailable: p.is_available,
          completedPujas: 0, // Placeholder
          startingPrice: 1100 // Placeholder
        }));
        setPandits(mapped);
      } catch (err) {
        console.error("Failed to fetch featured pandits", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadPandits();
  }, []);

  const featuredPandits = pandits; // Use state data

  const itemsPerSlide = 3;
  const totalSlides = Math.ceil(featuredPandits.length / itemsPerSlide);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, totalSlides]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    setIsAutoPlaying(false);
  };

  const getCurrentPandits = () => {
    const startIndex = currentSlide * itemsPerSlide;
    return featuredPandits.slice(startIndex, startIndex + itemsPerSlide);
  };

  return (
    <section className="py-16 bg-gradient-to-b from-orange-50/50 to-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-orange-100 rounded-full px-4 py-2 mb-4">
            <FaStar className="h-4 w-4 text-orange-500" />
            <span className="text-orange-700 text-sm font-medium">Top Rated</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
            Featured Pandits
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connect with our most experienced and highly-rated spiritual guides
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Navigation Buttons */}
          <Button
            variant="outline"
            size="sm"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm border-orange-200 hover:bg-orange-50 transition-all duration-300 hover:scale-110 shadow-lg"
            onClick={prevSlide}
          >
            <FaChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm border-orange-200 hover:bg-orange-50 transition-all duration-300 hover:scale-110 shadow-lg"
            onClick={nextSlide}
          >
            <FaChevronRight className="h-4 w-4" />
          </Button>

          {/* Pandits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-12">
            {getCurrentPandits().map((pandit, index) => (
              <Card
                key={pandit.id}
                className="group hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-2 border-0 shadow-lg bg-white/80 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <CardHeader className="relative pb-2">
                  {/* Availability Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <Badge
                      variant={pandit.isAvailable ? "default" : "secondary"}
                      className={`${pandit.isAvailable
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-gray-400"
                        } transition-all duration-300`}
                    >
                      {pandit.isAvailable ? "Available" : "Busy"}
                    </Badge>
                  </div>

                  {/* Profile Image */}
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <Avatar className="h-24 w-24 border-4 border-orange-200 group-hover:border-orange-400 transition-all duration-300">
                        <AvatarImage src={pandit.image} alt={pandit.name} />
                        <AvatarFallback className="bg-orange-100 text-orange-700 text-xl font-semibold">
                          {pandit.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {pandit.isVerified && (
                        <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                          <FaCheckCircle className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Name and Rating */}
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors duration-300">
                      {pandit.name}
                    </h3>
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <FaStar
                            key={i}
                            className={`h-4 w-4 ${i < Math.floor(pandit.rating)
                                ? "text-yellow-400"
                                : "text-gray-300"
                              }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-gray-600">
                        {pandit.rating} ({pandit.reviewCount})
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Experience and Stats */}
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-orange-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-orange-600">{pandit.experience}</div>
                      <div className="text-xs text-gray-600">Years Exp.</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-orange-600">{pandit.completedPujas}</div>
                      <div className="text-xs text-gray-600">Pujas Done</div>
                    </div>
                  </div>

                  {/* Specializations */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <GiTempleDoor className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium text-gray-700">Specializations</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {pandit.specializations.slice(0, 2).map((spec) => (
                        <Badge key={spec} variant="outline" className="text-xs border-orange-200 text-orange-700">
                          {spec}
                        </Badge>
                      ))}
                      {pandit.specializations.length > 2 && (
                        <Badge variant="outline" className="text-xs border-orange-200 text-orange-700">
                          +{pandit.specializations.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Languages */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FaLanguage className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium text-gray-700">Languages</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {pandit.languages.join(', ')}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-gray-600">{pandit.location}</span>
                  </div>

                  {/* Price and Actions */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-sm text-gray-500">Starting from</span>
                        <div className="text-xl font-bold text-orange-600">
                          ₹{pandit.startingPrice}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="hover:bg-orange-50">
                          <FaVideo className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="hover:bg-orange-50">
                          <FaCalendarAlt className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <Link to={`/pandits/${pandit.id}`}>
                      <Button
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all duration-300 hover:scale-105"
                        disabled={!pandit.isAvailable}
                      >
                        {pandit.isAvailable ? "View Profile" : "Currently Busy"}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Slide Indicators */}
          <div className="flex justify-center gap-2 mt-8">
            {[...Array(totalSlides)].map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentSlide
                    ? "bg-orange-500 scale-125"
                    : "bg-orange-200 hover:bg-orange-300"
                  }`}
                onClick={() => {
                  setCurrentSlide(index);
                  setIsAutoPlaying(false);
                }}
              />
            ))}
          </div>
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link to="/pandits">
            <Button
              size="lg"
              variant="outline"
              className="border-orange-200 text-orange-600 hover:bg-orange-50 transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              View All Pandits
              <FaChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedPandits;