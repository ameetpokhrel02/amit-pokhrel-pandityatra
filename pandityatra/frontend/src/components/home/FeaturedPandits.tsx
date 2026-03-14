import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  FaStar,
  FaChevronRight,
  FaCheckCircle
} from 'react-icons/fa';

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
  const [sortMode, setSortMode] = useState<'rating' | 'reviews'>('rating');

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
          image: p.user_details.profile_pic || '/src/assets/images/placeholder_pandit.png', // Fallback
          rating: Number(p.rating ?? 0) || 0,
          reviewCount: Number(p.review_count ?? 0) || 0,
          experience: Number(p.experience_years ?? 0) || 0,
          specializations: p.expertise ? p.expertise.split(',').map(s => s.trim()) : [],
          languages: p.language ? p.language.split(',').map(s => s.trim()) : [],
          location: "Nepal", // Placeholder
          isVerified: p.is_verified,
          isAvailable: p.is_available,
          completedPujas: Number(p.bookings_count ?? 0) || 0,
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

  const topPandits = useMemo(() => {
    const visible = pandits.filter((p) => p.isAvailable && p.isVerified);
    const sorted = [...visible].sort((a, b) => {
      if (sortMode === 'reviews') {
        return (b.reviewCount - a.reviewCount) || (b.rating - a.rating);
      }
      return (b.rating - a.rating) || (b.reviewCount - a.reviewCount);
    });
    return sorted.slice(0, 5);
  }, [pandits, sortMode]);

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-b from-orange-50/50 to-white">
        <div className="container mx-auto max-w-7xl px-4 flex justify-center">
          <LoadingSpinner />
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-b from-orange-50/50 to-white">
      <div className="container mx-auto max-w-7xl px-4">
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

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button
              size="sm"
              variant={sortMode === 'rating' ? 'default' : 'outline'}
              className={sortMode === 'rating' ? 'bg-orange-600 hover:bg-orange-700' : 'border-orange-200 text-orange-700 hover:bg-orange-50'}
              onClick={() => setSortMode('rating')}
            >
              Top by Rating
            </Button>
            <Button
              size="sm"
              variant={sortMode === 'reviews' ? 'default' : 'outline'}
              className={sortMode === 'reviews' ? 'bg-orange-600 hover:bg-orange-700' : 'border-orange-200 text-orange-700 hover:bg-orange-50'}
              onClick={() => setSortMode('reviews')}
            >
              Top by Reviews
            </Button>
          </div>
        </div>

        {/* Pandits Grid */}
        {topPandits.length === 0 ? (
          <div className="text-center text-gray-500 py-12 bg-white rounded-xl border border-dashed border-orange-200">
            No verified top pandits available right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {topPandits.map((pandit, index) => (
              <Card
                key={pandit.id}
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-orange-100 shadow-sm bg-white animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <CardContent className="pt-5 pb-4 px-4">
                  <div className="flex justify-center mb-3">
                    <div className="relative">
                      <Avatar className="h-24 w-24 border-[3px] border-orange-100 group-hover:border-orange-300 transition-all duration-300">
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

                  <div className="text-center mb-4">
                    <h3 className="text-base font-bold text-gray-800 mb-1 group-hover:text-orange-600 transition-colors duration-300 line-clamp-1">
                      {pandit.name}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">Top Specialist</p>

                    <div className="flex items-center justify-center gap-1 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={`h-3.5 w-3.5 ${i < Math.round(pandit.rating)
                            ? 'text-yellow-400'
                            : 'text-gray-200'
                            }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      {pandit.rating.toFixed(1)} • {pandit.reviewCount} reviews
                    </p>
                  </div>
                </CardContent>

                <div className="px-4 pb-4">
                  <Link to={`/pandits/${pandit.id}`}>
                    <Button
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      View Profile
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link to="/pandits">
            <Button
              size="lg"
              className="bg-orange-600 hover:bg-orange-700 text-white shadow-xl shadow-orange-500/20 px-8 rounded-full font-bold h-auto py-3 transition-all duration-300 hover:scale-105"
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