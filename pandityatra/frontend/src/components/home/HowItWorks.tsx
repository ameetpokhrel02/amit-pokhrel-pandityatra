import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  FaUserCheck,
  FaCalendarAlt,
  FaVideo,
  FaDownload,
  FaPlay,
  FaCheckCircle,
  FaArrowRight,
  FaClock,
  FaShoppingCart,
  FaOm
} from 'react-icons/fa';
import {
  GiTempleDoor,
  GiPrayerBeads,
  GiIncense,
  GiScrollUnfurled,
  GiChakram,
  GiLotus
} from 'react-icons/gi';
import heroImage from '@/assets/images/HowPandit.png';

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  details: string[];
  color: string;
  bgColor: string;
  borderColor: string;
}

const HowItWorks: React.FC = () => {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState(1);
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 50]);

  const steps: Step[] = [
    {
      id: 1,
      title: t('how_it_works_steps.step1_title', 'Choose Pandit & Puja'),
      description: t('how_it_works_steps.step1_desc', 'Select your preferred pandit and ceremony type from our verified experts'),
      icon: <FaUserCheck className="h-6 w-6" />,
      details: [t('how_it_works_steps.step1_detail1', 'Browse 500+ verified pandits'), t('how_it_works_steps.step1_detail2', 'Filter by location, language & expertise')],
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      id: 2,
      title: t('how_it_works_steps.step2_title', 'Select Date & Samagri'),
      description: t('how_it_works_steps.step2_desc', 'Pick your preferred date and samagri package'),
      icon: <FaCalendarAlt className="h-6 w-6" />,
      details: [t('how_it_works_steps.step2_detail1', 'Choose convenient date & time'), t('how_it_works_steps.step2_detail2', 'Select samagri package or customize')],
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
    {
      id: 3,
      title: t('how_it_works_steps.step3_title', 'Join Live Video Puja'),
      description: t('how_it_works_steps.step3_desc', 'Participate in your ceremony via high-quality video call'),
      icon: <FaVideo className="h-6 w-6" />,
      details: [t('how_it_works_steps.step3_detail1', 'HD video call with your pandit'), t('how_it_works_steps.step3_detail2', 'Real-time interaction and guidance')],
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200"
    },
    {
      id: 4,
      title: t('how_it_works_steps.step4_title', 'Receive Recording'),
      description: t('how_it_works_steps.step4_desc', 'Get your puja recording and Kundali report'),
      icon: <FaDownload className="h-6 w-6" />,
      details: [t('how_it_works_steps.step4_detail1', 'Download HD puja recording'), t('how_it_works_steps.step4_detail2', 'Receive detailed Kundali report')],
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200"
    }
  ];

  const floatingIcons = [
    { Icon: FaOm, delay: 0, x: '10%', y: '10%' },
    { Icon: GiLotus, delay: 2, x: '85%', y: '15%' },
    { Icon: GiPrayerBeads, delay: 1, x: '15%', y: '80%' },
    { Icon: GiChakram, delay: 3, x: '80%', y: '70%' },
  ];

  return (
    <section className="py-20 relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-orange-100 dark:from-slate-900 dark:via-slate-900 dark:to-orange-900/20">

      {/* Background Animated Elements */}
      <div className="absolute inset-0 pointer-events-none">
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
            <item.Icon className="h-16 w-16" />
          </motion.div>
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-orange-100 rounded-full px-4 py-2 mb-4"
          >
            <GiPrayerBeads className="h-4 w-4 text-orange-500 animate-spin-slow" />
            <span className="text-orange-700 text-sm font-medium">{t('process_subtitle', 'Simple 4-Step Process')}</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent"
          >
            {t('how_it_works', 'How It Works')}
          </motion.h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('how_it_works_desc', 'Experience authentic puja ceremonies from comfort of your home')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left Side: Steps */}
          <div className="space-y-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`cursor-pointer transition-all duration-300 border-l-4 overflow-hidden ${activeStep === step.id
                    ? "border-orange-500 shadow-xl bg-orange-50/50 dark:bg-slate-800"
                    : "border-transparent hover:bg-orange-50/30 dark:hover:bg-slate-800/50"
                    }`}
                  onClick={() => setActiveStep(step.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${activeStep === step.id ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-500"
                        }`}>
                        {step.id}
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-xl font-bold mb-1 ${activeStep === step.id ? "text-orange-900 dark:text-orange-100" : "text-gray-700 dark:text-gray-300"}`}>
                          {step.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{step.description}</p>

                        <motion.div
                          initial={false}
                          animate={{ height: activeStep === step.id ? 'auto' : 0, opacity: activeStep === step.id ? 1 : 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-2 border-t border-orange-100 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {step.details.map((d, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                                <FaCheckCircle className="text-orange-500" /> {d}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      </div>
                      {activeStep === step.id && <FaArrowRight className="text-orange-500 mt-2" />}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Right Side: Animated Image & Visuals */}
          <div className="relative flex justify-center items-center h-[500px]">
            {/* Rotating Aura */}
            <motion.div
              className="absolute w-[350px] h-[350px] md:w-[450px] md:h-[450px] rounded-full bg-gradient-to-r from-orange-400/20 to-amber-300/20 blur-3xl"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, -90, 0],
                opacity: [0.4, 0.7, 0.4]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Rotating Ring */}
            <motion.div
              className="absolute w-[320px] h-[320px] md:w-[420px] md:h-[420px] rounded-full border border-orange-400/30 border-dashed"
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            />

            {/* Main Image */}
            {/* Main Image Container */}
            <motion.div
              className="relative z-10 w-full max-w-[350px] aspect-[4/5] bg-gradient-to-b from-orange-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-3xl border-4 border-orange-500 dark:border-orange-400 shadow-2xl overflow-hidden flex items-end justify-center"
              style={{ y: y1 }}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <motion.img
                src={heroImage}
                alt="How it works guide"
                className="w-full h-full object-cover"
                initial={{ y: 50, opacity: 0, scale: 1 }}
                whileInView={{ y: 0, opacity: 1 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{
                  scale: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                  y: { delay: 0.3, duration: 0.5 },
                  opacity: { delay: 0.3, duration: 0.5 }
                }}
              />
            </motion.div>

            {/* Floating Info Cards */}
            <motion.div
              className="absolute top-10 right-0 bg-white dark:bg-slate-800 p-3 rounded-xl shadow-lg border border-orange-100 dark:border-slate-700 max-w-[160px] z-20"
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="bg-green-100 p-1.5 rounded-full"><FaVideo className="text-green-600 w-3 h-3" /></div>
                <span className="font-bold text-xs">{t('live_interaction', 'Live Interaction')}</span>
              </div>
              <p className="text-[10px] text-gray-500">{t('live_interaction_desc', 'Connect face-to-face with Pandits')}</p>
            </motion.div>

            <motion.div
              className="absolute bottom-10 left-0 bg-white dark:bg-slate-800 p-3 rounded-xl shadow-lg border border-orange-100 dark:border-slate-700 max-w-[160px] z-20"
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 7, repeat: Infinity, delay: 1, ease: "easeInOut" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="bg-purple-100 p-1.5 rounded-full"><GiScrollUnfurled className="text-purple-600 w-3 h-3" /></div>
                <span className="font-bold text-xs">{t('digital_kundali', 'Digital Kundali')}</span>
              </div>
              <p className="text-[10px] text-gray-500">{t('digital_kundali_desc', 'Get detailed reports instantly')}</p>
            </motion.div>
          </div>

        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <Button size="lg" className="bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all">
            {t('start_journey', 'Start Your Spiritual Journey')}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;