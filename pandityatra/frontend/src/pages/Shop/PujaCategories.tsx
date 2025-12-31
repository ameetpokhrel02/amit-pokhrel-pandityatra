import React, { useState, useEffect } from 'react';
import { fetchPujas } from '../../services/api';
import { motion } from 'framer-motion';
import { Loader2, Heart, Clock, Users, Flame, Star, Zap } from 'lucide-react';
import { Button } from '../../components/ui/button';

interface Puja {
  id: number;
  name?: string;
  description: string;
  price: number;
  duration_minutes: number;
  pandit_name: string;
  pandit: number;
}

// Puja data with icons and local images
const pujaData: { [key: string]: { icon: React.ReactNode; image: string } } = {
  'Ganesh Puja': { 
    icon: <Flame className="h-8 w-8" />,
    image: '/images/puja1.svg'
  },
  'Durga Puja': { 
    icon: <Star className="h-8 w-8" />,
    image: '/images/puja2.svg'
  },
  'Lakshmi Puja': { 
    icon: <Zap className="h-8 w-8" />,
    image: '/images/puja1.svg'
  },
  'Shiva Puja': { 
    icon: <Flame className="h-8 w-8" />,
    image: '/images/puja2.svg'
  },
  'Havan': { 
    icon: <Flame className="h-8 w-8" />,
    image: '/images/puja1.svg'
  },
  'Satyanarayan Puja': { 
    icon: <Star className="h-8 w-8" />,
    image: '/images/puja2.svg'
  },
};

const PujaCategories = () => {
  const [pujas, setPujas] = useState<Puja[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [hovering, setHovering] = useState<number | null>(null);

  useEffect(() => {
    const loadPujas = async () => {
      try {
        setLoading(true);
        const data = await fetchPujas();
        setPujas(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        console.error('Failed to load pujas:', err);
        setError('Failed to load pujas. Please try again.');
        setPujas([]);
      } finally {
        setLoading(false);
      }
    };

    loadPujas();
  }, []);

  const toggleFavorite = (pujaId: number) => {
    setFavorites((prev) => {
      const updated = new Set(prev);
      if (updated.has(pujaId)) {
        updated.delete(pujaId);
      } else {
        updated.add(pujaId);
      }
      return updated;
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-6">Puja Categories</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-2">Puja Categories</h1>
      <p className="text-gray-600 mb-8">Select a puja to book with our experienced pandits</p>

      {pujas.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <p>No pujas available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pujas.map((puja) => {
            const pujaInfo = pujaData[puja.name || ''] || { 
              icon: <Star className="h-8 w-8" />, 
              image: '/images/puja1.svg' 
            };
            
            return (
              <motion.div
                key={puja.id}
                onMouseEnter={() => setHovering(puja.id)}
                onMouseLeave={() => setHovering(null)}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden cursor-pointer"
              >
                {/* Image Container with Icon Overlay */}
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-orange-100 to-orange-50">
                  <motion.img
                    src={pujaInfo.image}
                    alt={puja.name}
                    className="w-full h-full object-cover"
                    animate={{
                      scale: hovering === puja.id ? 1.1 : 1,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  />
                  
                  {/* Icon Badge */}
                  <motion.div
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-orange-600 bg-white rounded-full p-3 shadow-lg"
                    animate={{
                      scale: hovering === puja.id ? 1.2 : 1,
                      rotate: hovering === puja.id ? 10 : 0,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    {pujaInfo.icon}
                  </motion.div>

                  {/* Favorite Button */}
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(puja.id);
                    }}
                    className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Heart
                      className={`h-5 w-5 transition-colors ${
                        favorites.has(puja.id)
                          ? 'fill-red-500 text-red-500'
                          : 'text-gray-400'
                      }`}
                    />
                  </motion.button>

                  {/* Gradient Overlay on Hover */}
                  {hovering === puja.id && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                      {puja.name || 'Puja'}
                    </h3>
                    <p className="text-sm text-orange-600 font-medium flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {puja.pandit_name || 'Pandit'}
                    </p>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {puja.description}
                  </p>

                  {/* Duration and Price */}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {puja.duration_minutes} mins
                      </span>
                    </div>
                    <span className="text-lg font-bold text-orange-600">
                      ₹{Number(puja.price).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Book Button */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold">
                      Book Now
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PujaCategories;
