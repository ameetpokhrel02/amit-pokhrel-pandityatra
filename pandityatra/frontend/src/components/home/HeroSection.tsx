import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  FaSearch,
  FaCalendarAlt,
  FaClock,
  FaVideo,
  FaStar,
  FaPlay,
  FaOm
} from 'react-icons/fa';
import {
  GiTempleDoor,
  GiPrayerBeads,
  GiChakram,
  GiCandleLight,
  GiLotus
} from 'react-icons/gi';
import {
  TbZodiacAries,
  TbZodiacTaurus,
  TbZodiacGemini,
  TbZodiacCancer,
  TbZodiacLeo,
  TbZodiacVirgo,
  TbZodiacLibra,
  TbZodiacScorpio,
  TbZodiacSagittarius,
  TbZodiacCapricorn,
  TbZodiacAquarius,
  TbZodiacPisces
} from 'react-icons/tb';
import MotionSearch from '@/components/ui/motion-search';
import heroPandit from '@/assets/images/hero 3-Photoroom.png';

const HeroSection: React.FC = () => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchData, setSearchData] = useState({
    pujaType: '',
    date: '',
    time: ''
  });
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 100]);
  const y2 = useTransform(scrollY, [0, 500], [0, -100]);

  const pujaTypes = [
    'Ganesh Puja', 'Lakshmi Puja', 'Saraswati Puja', 'Durga Puja',
    'Griha Pravesh', 'Marriage Ceremony', 'Naming Ceremony', 'Thread Ceremony'
  ];

  const timeSlots = [
    '6:00 AM - 8:00 AM', '8:00 AM - 10:00 AM', '10:00 AM - 12:00 PM',
    '12:00 PM - 2:00 PM', '2:00 PM - 4:00 PM', '4:00 PM - 6:00 PM', '6:00 PM - 8:00 PM'
  ];

  const floatingIcons = [
    { Icon: FaOm, delay: 0, x: '10%', y: '20%' },
    { Icon: GiPrayerBeads, delay: 2, x: '80%', y: '15%' },
    { Icon: TbZodiacLeo, delay: 1, x: '15%', y: '70%' },
    { Icon: TbZodiacPisces, delay: 3, x: '85%', y: '60%' },
    { Icon: GiChakram, delay: 1.5, x: '50%', y: '10%' },
    { Icon: TbZodiacScorpio, delay: 2.5, x: '5%', y: '40%' },
    { Icon: GiLotus, delay: 0.5, x: '90%', y: '30%' },
  ];

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchData.pujaType) params.append('pujaType', searchData.pujaType);
    if (searchData.date) params.append('date', searchData.date);
    if (searchData.time) params.append('time', searchData.time);
    navigate(`/pandits${params.toString() ? '?' + params.toString() : ''}`);
  };

  return (
    <section className="relative min-h-[95vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-orange-50 via-white to-orange-100 dark:from-slate-900 dark:via-slate-900 dark:to-orange-900/20">

      {/* Background Animated Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {floatingIcons.map((item, index) => (
          <motion.div
            key={index}
            className="absolute text-orange-200 dark:text-orange-900/30 opacity-60"
            style={{ left: item.x, top: item.y }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              delay: item.delay,
              ease: "easeInOut"
            }}
          >
            <item.Icon className="h-12 w-12 md:h-20 md:w-20" />
          </motion.div>
        ))}

        {/* Rotating Large Zodiac Ring */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border-2 border-dashed border-orange-200/50 rounded-full opacity-30"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-orange-300/30 rounded-full opacity-40"
          animate={{ rotate: -360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div className="container relative z-10 px-4 py-8 grid lg:grid-cols-2 gap-12 items-center">

        {/* Left Side: Text & Search */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center lg:text-left space-y-6"
        >
          <div className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 border border-orange-200 text-orange-700 dark:text-orange-300 px-4 py-2 rounded-full text-sm font-semibold">
            <GiCandleLight className="animate-pulse" />
            <span>{t('platform_badge')}</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight text-slate-900 dark:text-white">
            {t('welcome_title').split(' ').slice(0, -2).join(' ')} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
              {t('welcome_title').split(' ').slice(-2).join(' ')}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-xl mx-auto lg:mx-0">
            {t('welcome_subtitle')}
          </p>

          <Card className="p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-xl border-orange-100/50 dark:border-orange-500/20">
            <div className="grid md:grid-cols-3 gap-3">
              <Select value={searchData.pujaType} onValueChange={(v) => setSearchData({ ...searchData, pujaType: v })}>
                <SelectTrigger className="h-12 bg-transparent border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <GiTempleDoor className="text-orange-500" />
                    <SelectValue placeholder={t('puja_type')} />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {pujaTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>

              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500 z-10 pointer-events-none">
                  <FaCalendarAlt />
                </div>
                <Input
                  type="date"
                  className="h-12 pl-10 bg-transparent border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                  onChange={(e) => setSearchData({ ...searchData, date: e.target.value })}
                />
              </div>

              <Button
                onClick={handleSearch}
                className="h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg transition-transform hover:scale-105"
              >
                <FaSearch className="mr-2" /> {t('find_match')}
              </Button>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 px-1">
              <span className="flex items-center gap-1"><FaVideo /> {t('live_or_person')}</span>
              <span className="flex items-center gap-1"><FaStar className="text-yellow-400" /> {t('average_rating')}</span>
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white shadow-xl shadow-orange-500/20 px-10 rounded-full font-bold"
              onClick={() => {
                if (token) {
                  navigate('/booking');
                } else {
                  navigate('/register');
                }
              }}
            >
              {t('get_started')}
            </Button>
            <Link to="/about">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
                <FaPlay className="mr-2 text-orange-500" /> {t('watch_demo')}
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Right Side: Hero Image with Animations */}
        <div className="relative flex justify-center items-center h-[400px] sm:h-[500px] lg:h-[700px] order-first lg:order-last">
          {/* Rotating Orange Aura/Glow */}
          <motion.div
            className="absolute w-[350px] h-[350px] md:w-[500px] md:h-[500px] rounded-full bg-gradient-to-r from-orange-400/30 to-amber-300/30 blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.div
            className="absolute w-[320px] h-[320px] md:w-[480px] md:h-[480px] rounded-full border-2 border-orange-400/50 border-dashed"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            {/* Spinning Icons on the ring */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 p-2 rounded-full shadow-lg">
              <FaOm className="text-orange-500 h-6 w-6" />
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-white dark:bg-slate-900 p-2 rounded-full shadow-lg">
              <GiChakram className="text-orange-500 h-6 w-6" />
            </div>
          </motion.div>

          {/* Main Pandit Image */}
          <motion.img
            src={heroPandit}
            alt="Pandit Yatra Guide"
            className="relative z-10 w-full h-full object-contain drop-shadow-2xl"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            style={{ y: y2 }}
          />

          {/* Floating Badge */}
          <motion.div
            className="absolute bottom-20 right-10 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl z-20 border border-orange-100 dark:border-slate-600 max-w-[200px]"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-green-100 text-green-600 p-1 rounded-full"><FaStar size={12} /></div>
              <span className="font-bold text-sm">{t('best_choice')}</span>
            </div>
            <p className="text-xs text-slate-500">"{t('review_quote')}"</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;