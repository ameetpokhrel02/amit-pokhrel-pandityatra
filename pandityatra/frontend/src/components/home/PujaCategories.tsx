import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import {
  FaRing,
  FaHome,
  FaBaby,
  FaGraduationCap,
  FaStar,
  FaArrowRight
} from 'react-icons/fa';
import {
  GiTempleDoor,
  GiPrayerBeads,
  GiLotusFlower
} from 'react-icons/gi';
import { fetchAllPujas, type Puja } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

const iconsMap: Record<string, React.ReactNode> = {
  "Ganesh Puja": <GiTempleDoor className="h-8 w-8" />,
  "Lakshmi Puja": <GiLotusFlower className="h-8 w-8" />,
  "Marriage Ceremony": <FaRing className="h-8 w-8" />,
  "Griha Pravesh": <FaHome className="h-8 w-8" />,
  "Naming Ceremony": <FaBaby className="h-8 w-8" />,
  "Thread Ceremony": <FaGraduationCap className="h-8 w-8" />,
  "Durga Puja": <GiPrayerBeads className="h-8 w-8" />,
  "Saraswati Puja": <GiLotusFlower className="h-8 w-8" />,
};

const gradients = [
  "from-orange-500 to-amber-600",
  "from-amber-600 to-orange-500",
  "from-pink-500 to-red-600",
  "from-emerald-500 to-teal-600",
  "from-blue-500 to-indigo-600",
  "from-purple-500 to-fuchsia-600",
  "from-rose-500 to-orange-600",
  "from-cyan-500 to-blue-600",
];

const PujaCategories: React.FC = () => {
  const { t } = useTranslation();
  const [pujas, setPujas] = useState<Puja[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadPujas = async () => {
      try {
        const data = await fetchAllPujas();
        // If it's a paginated response, handle properly
        const results = Array.isArray(data) ? data : (data as any).results || [];
        setPujas(results.slice(0, 8));
      } catch (error) {
        console.error("Failed to load pujas", error);
      } finally {
        setLoading(false);
      }
    };
    loadPujas();
  }, []);

  const handleBookNow = (pujaId: number, pujaName: string) => {
    navigate('/booking', { state: { serviceId: pujaId, serviceName: pujaName } });
  };

  return (
    <section className="py-20 bg-orange-50/30 overflow-hidden">
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Badge className="bg-orange-100 text-orange-600 hover:bg-orange-100 border-none mb-4 px-4 py-1.5 rounded-full text-sm font-bold">
            {t('sacred_ceremonies')}
          </Badge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 font-playfair mb-6">
            {t('popular_puja_categories').split(' ').slice(0, 2).join(' ')} <span className="text-orange-600">{t('popular_puja_categories').split(' ').slice(2).join(' ')}</span>
          </h2>
          <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto mb-16">
            {t('puja_cat_subtitle')}
          </p>
        </motion.div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-orange-600" />
            <p className="text-orange-600 font-bold animate-pulse">{t('fetching_rituals')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <AnimatePresence>
              {pujas.map((puja, index) => {
                const icon = iconsMap[puja.name] || <GiTempleDoor className="h-8 w-8" />;
                const gradient = gradients[index % gradients.length];
                const imageSrc = puja.image || null;
                const isPopular = index < 3; // First 3 are "Popular"

                return (
                  <motion.div
                    key={puja.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
                    whileHover={{ y: -10 }}
                  >
                    <Card className="group relative h-[400px] overflow-hidden border-none rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all duration-500 cursor-default">
                      {/* Background Image / Gradient */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90 group-hover:opacity-95 transition-opacity duration-500`} />

                      {/* Decorative Image */}
                      {puja.image && (
                        <img
                          src={puja.image}
                          alt={puja.name}
                          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30 group-hover:scale-110 transition-transform duration-1000"
                        />
                      )}

                      {/* Popular Badge */}
                      {isPopular && (
                        <div className="absolute top-6 right-6 z-20">
                          <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 px-3 py-1 rounded-full flex items-center gap-1">
                            <FaStar className="w-3 h-3 text-yellow-300" />
                            <span className="text-[10px] font-bold tracking-widest uppercase">{t('best_choice')}</span>
                          </Badge>
                        </div>
                      )}

                      <CardContent className="relative h-full z-10 p-8 flex flex-col justify-between text-white">
                        <div className="space-y-4">
                          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                            <div className="text-white drop-shadow-lg scale-110">
                              {icon}
                            </div>
                          </div>

                          <div className="text-left">
                            <h3 className="text-2xl font-bold font-playfair leading-tight group-hover:text-amber-200 transition-colors mb-2">
                              {puja.name}
                            </h3>
                            <p className="text-white/80 text-sm line-clamp-3 leading-relaxed font-medium">
                              {puja.description}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="flex justify-between items-center border-t border-white/20 pt-6">
                            <div className="text-left">
                              <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-0.5">{t('starting_from')}</p>
                              <p className="text-3xl font-black text-white">₹{Math.round(puja.base_price)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-0.5">{t('duration')}</p>
                              <p className="font-bold text-sm bg-white/10 px-2 py-0.5 rounded-lg border border-white/10">
                                {puja.base_duration_minutes} {t('common:mins', 'mins')}
                              </p>
                            </div>
                          </div>

                          <Button
                            onClick={() => handleBookNow(puja.id, puja.name)}
                            className="w-full h-12 bg-white text-[#f97316] hover:bg-orange-50 font-bold rounded-xl shadow-lg transition-all active:scale-95 group/btn"
                          >
                            <span>{t('book_now')}</span>
                            <FaArrowRight className="ml-2 w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                          </Button>
                        </div>
                      </CardContent>

                      {/* Lighting Effects */}
                      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
};

export default PujaCategories;