import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Video, ShoppingBag, Star, Shield, BookOpen, Globe, Users,
    Mail, Heart, Github, Linkedin, GraduationCap, Code, Database,
    Smartphone, Server, MessageSquare, Calendar, Award, MapPin, ArrowRight
} from 'lucide-react';
import { FaOm, FaWifi } from 'react-icons/fa';
import { GiChakram } from 'react-icons/gi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useTranslation } from 'react-i18next';
import panditYatraLogo from '@/assets/images/PanditYatralogo.png';
import panditsGrp from '@/assets/images/pandits  grp.png';
import axios from 'axios';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' as const }
    })
};

/* ── component ──────────────────────────────────────────── */

const AboutUs: React.FC = () => {
    const { t } = useTranslation(['about', 'common']);
    const [stats, setStats] = useState({
        verified_pandits: 500,
        total_reviews: 10000,
        happy_customers: 2500
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get('/api/pandits/public-stats/');
                if (response.data) {
                    setStats({
                        verified_pandits: response.data.verified_pandits,
                        total_reviews: response.data.total_reviews,
                        happy_customers: response.data.happy_customers
                    });
                }
            } catch (error) {
                console.error("Error fetching public stats:", error);
            }
        };
        fetchStats();
    }, []);

    const features = [
        { icon: Video, title: t('common:panchang.live_puja', 'Live Video Puja'), desc: t('about:features.items.live_puja') },
        { icon: Calendar, title: t('common:panchang.easy_booking', 'Easy Booking'), desc: t('about:features.items.easy_booking') },
        { icon: ShoppingBag, title: t('common:panchang.shop', 'Puja Samagri Shop'), desc: t('about:features.items.shop') },
        { icon: BookOpen, title: t('common:panchang.kundali', 'Kundali Generator'), desc: t('about:features.items.kundali') },
        { icon: MessageSquare, title: t('common:panchang.chat', 'Real-time Chat'), desc: t('about:features.items.chat') },
        { icon: Star, title: t('common:panchang.reviews', 'Reviews & Ratings'), desc: t('about:features.items.reviews') },
        { icon: Shield, title: t('common:panchang.verified', 'Verified Pandits'), desc: t('about:features.items.verified') },
        { icon: Globe, title: t('common:panchang.global', 'Global Access'), desc: t('about:features.items.global') },
    ];

    const techStack = [
        { category: t('about:developer.frontend', 'Frontend'), items: ['React 18 + TypeScript', 'Vite', 'Tailwind CSS + shadcn/ui', 'Framer Motion'] },
        { category: t('about:developer.backend', 'Backend'), items: ['Django 5 + DRF', 'Django Channels (WebSocket)', 'PostgreSQL', 'Redis'] },
        { category: t('about:developer.devops', 'DevOps'), items: ['Docker & Docker Compose', 'Nginx Reverse Proxy', 'Coturn (TURN/STUN)', 'GitHub CI'] },
        { category: t('about:developer.services', 'Services'), items: ['Stripe & Khalti Payments', 'Twilio SMS/OTP', 'Google OAuth 2.0', 'Daily.co WebRTC'] },
    ];

    const targetUsers = [
        { label: t('common:target_users.nri', 'Nepali Diaspora (NRIs)'), detail: t('common:target_users.nri_detail') },
        { label: t('common:target_users.families', 'Families in Nepal'), detail: t('common:target_users.families_detail') },
        { label: t('common:target_users.professionals', 'Young Professionals'), detail: t('common:target_users.professionals_detail') },
        { label: t('common:target_users.devotees', 'Devotees Worldwide'), detail: t('common:target_users.devotees_detail') },
    ];

    const temples = [
        { name: t('common:temples.pashupatinath.name', 'Pashupatinath'), location: t('common:temples.pashupatinath.location'), image: '/images/pashupatinath.png', link: 'https://pashupatinathtemple.org/', description: t('common:temples.pashupatinath.desc') },
        { name: t('common:temples.muktinath.name', 'Muktinath'), location: t('common:temples.muktinath.location'), image: '/images/muktinath.png', link: 'https://www.muktinath.org.np/', description: t('common:temples.muktinath.desc') },
        { name: t('common:temples.manakamana.name', 'Manakamana'), location: t('common:temples.manakamana.location'), image: '/images/manakamana.png', link: 'https://en.wikipedia.org/wiki/Manakamana_Temple', description: t('common:temples.manakamana.desc') },
        { name: t('common:temples.janaki.name', 'Janaki Mandir'), location: t('common:temples.janaki.location'), image: '/images/janakpur.png', link: 'https://janakpurmun.gov.np/en/node/60', description: t('common:temples.janaki.desc') },
    ];

    return (
        <div className="min-h-screen bg-[#FFFAF5] flex flex-col scroll-smooth">
            <Navbar />
            <div className="flex-1">

                {/* ═══════════════════════════════════════════════════
            PART A — ORIGINAL LANDING SECTIONS
            ═══════════════════════════════════════════════════ */}

                {/* ─── Hero Section (Original) ────────────────────── */}
                <section className="relative min-h-[60vh] lg:min-h-[80vh] flex items-center overflow-hidden bg-background py-12 lg:py-0">
                    <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />

                    {/* Rotating Rings (Icons hidden as requested) */}
                    <div className="absolute right-[-5%] top-1/2 -translate-y-1/2 w-[55%] h-full pointer-events-none hidden lg:flex items-center justify-center overflow-hidden">
                        <motion.div className="absolute w-[800px] h-[800px] border border-orange-200/20 rounded-full" animate={{ rotate: -360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }} />
                        <motion.div className="absolute w-[600px] h-[600px] border-2 border-dashed border-orange-200/40 rounded-full" animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }}>
                            {/* Icons hidden */}
                        </motion.div>
                        <motion.div className="absolute w-[450px] h-[450px] border border-orange-100/30 rounded-full" animate={{ rotate: -360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}>
                            {/* Icons hidden */}
                        </motion.div>
                        <div className="relative z-10 w-full h-auto flex justify-center">
                            <img src={panditsGrp} alt="PanditYatra Group" className="w-[115%] h-auto drop-shadow-2xl" />
                        </div>
                    </div>

                    <div className="container mx-auto max-w-7xl px-4">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <div className="text-center lg:text-left">
                                <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
                                    {t('about:hero.title').split('Divine')[0]}<span className="text-orange-600 font-black">{t('common:divine', 'Divine')}</span>{t('about:hero.title').split('Divine')[1]}
                                </motion.h1>
                                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-lg md:text-xl text-slate-600 max-w-2xl lg:mx-0 mx-auto mb-10 px-4 lg:px-0 leading-relaxed">
                                    {t('about:hero.subtitle')}
                                </motion.p>
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                    <Link to="/shop/pujas">
                                        <Button size="lg" className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto rounded-full font-bold shadow-lg shadow-orange-600/20 px-8 py-6">
                                            {t('about:hero.explore_services')}
                                        </Button>
                                    </Link>
                                    <Button 
                                        variant="outline" size="lg" 
                                        className="border-orange-600 text-orange-600 hover:bg-orange-50 w-full sm:w-auto rounded-full font-bold px-8 py-6" 
                                        asChild
                                    >
                                        <a href="#about-project">{t('about:hero.about_project')}</a>
                                    </Button>
                                </motion.div>
                            </div>
                            <div className="relative lg:hidden block px-6">
                                <div className="max-w-[360px] mx-auto relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                                    <img src={panditsGrp} alt="PanditYatra Team" className="w-full h-auto transform hover:scale-125 transition-transform duration-700" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── Mission Section (Original) ─────────────────── */}
                <section className="py-20 px-4 bg-white relative">
                    <div className="container mx-auto max-w-7xl">
                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <div>
                                <motion.button whileHover={{ scale: 1.05 }} className="bg-orange-600 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6 shadow-md shadow-orange-600/20">
                                    Our Mission
                                </motion.button>
                                <h2 className="text-4xl font-extrabold mb-6 leading-tight">{t('about:mission.title')}</h2>
                                <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                                    {t('about:mission.p1')}
                                </p>
                                <p className="text-lg text-slate-600 leading-relaxed">
                                    {t('about:mission.p2')}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <Card className="bg-orange-50/50 border-none rounded-3xl group hover:shadow-xl transition-all"><CardContent className="p-8 flex flex-col items-center text-center"><div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:bg-orange-600 group-hover:text-white transition-all"><Users className="w-8 h-8" /></div><h3 className="font-bold text-lg mb-2">{t('about:mission.verified_pandits')}</h3><p className="text-sm text-slate-500">{t('about:mission.verified_desc')}</p></CardContent></Card>
                                <Card className="bg-blue-50/50 border-none rounded-3xl group hover:shadow-xl transition-all"><CardContent className="p-8 flex flex-col items-center text-center"><div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all"><BookOpen className="w-8 h-8" /></div><h3 className="font-bold text-lg mb-2">{t('about:mission.authentic_rituals')}</h3><p className="text-sm text-slate-500">{t('about:mission.authentic_desc')}</p></CardContent></Card>
                                <Card className="bg-green-50/50 border-none rounded-3xl group hover:shadow-xl transition-all"><CardContent className="p-8 flex flex-col items-center text-center"><div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:bg-green-600 group-hover:text-white transition-all"><Award className="w-8 h-8" /></div><h3 className="font-bold text-lg mb-2">{t('about:mission.quality_samagri')}</h3><p className="text-sm text-slate-500">{t('about:mission.quality_desc')}</p></CardContent></Card>
                                <Card className="bg-purple-50/50 border-none rounded-3xl group hover:shadow-xl transition-all"><CardContent className="p-8 flex flex-col items-center text-center"><div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:bg-purple-600 group-hover:text-white transition-all"><MapPin className="w-8 h-8" /></div><h3 className="font-bold text-lg mb-2">{t('about:mission.temple_booking')}</h3><p className="text-sm text-slate-500">{t('about:mission.temple_desc')}</p></CardContent></Card>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── Essence of Rituals (Original) ──────────────── */}
                <section className="py-24 bg-[#FFFBF0] px-4 relative overflow-hidden">
                    <div className="absolute right-[-10%] bottom-[-10%] w-64 h-64 bg-orange-100/40 rounded-full blur-3xl" />
                    <div className="container mx-auto max-w-7xl relative z-10 text-center">
                        <motion.button whileHover={{ scale: 1.05 }} className="bg-orange-600 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-8 shadow-md shadow-orange-600/20">
                            The Essence
                        </motion.button>
                        <h2 className="text-4xl md:text-5xl font-extrabold mb-16">{t('about:essence.title')}</h2>
                        <div className="grid md:grid-cols-3 gap-10">
                            {[
                                { title: t('about:essence.items.0.title'), desc: t('about:essence.items.0.desc') },
                                { title: t('about:essence.items.1.title'), desc: t('about:essence.items.1.desc') },
                                { title: t('about:essence.items.2.title'), desc: t('about:essence.items.2.desc') },
                            ].map((item, idx) => (
                                <motion.div key={idx} whileHover={{ y: -10 }} className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-orange-50 relative group">
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl group-hover:rotate-12 transition-all">{idx + 1}</div>
                                    <h3 className="text-2xl font-bold mb-6 mt-6">{item.title}</h3>
                                    <p className="text-slate-600 leading-relaxed text-lg">{item.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── Sacred Destinations (Original) ─────────────── */}
                <section className="py-24 px-4 bg-white">
                    <div className="container mx-auto max-w-7xl">
                        <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-16 gap-8">
                            <div className="text-center md:text-left">
                                <motion.button whileHover={{ scale: 1.05 }} className="bg-orange-600 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-4 shadow-md shadow-orange-600/20">
                                    Explore Map
                                </motion.button>
                                <h2 className="text-4xl font-extrabold mb-3">{t('about:destinations.title')}</h2>
                                <p className="text-lg text-slate-500 font-medium">{t('about:destinations.subtitle')}</p>
                            </div>
                            <Link to="/booking" className="inline-flex items-center gap-3 bg-orange-50 text-orange-600 font-bold px-8 py-3 rounded-full border border-orange-100 hover:bg-orange-100 transition-all">
                                {t('about:destinations.view_all')} <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {temples.map((temple, i) => (
                                <div key={i} className="group relative overflow-hidden rounded-[2rem] aspect-[4/5] bg-slate-200 shadow-xl hover:shadow-2xl transition-all">
                                    <img src={temple.image} alt={temple.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-125 transition-transform duration-1000" onError={(e) => { (e.target as HTMLImageElement).src = '/images/puja1.svg'; }} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-8 text-white translate-y-6 group-hover:translate-y-0 transition-transform">
                                        <h3 className="font-black text-2xl mb-1">{temple.name}</h3>
                                        <p className="text-sm font-bold text-orange-400 mb-4">{temple.location}</p>
                                        <p className="text-sm text-white/80 line-clamp-2 mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">{temple.description}</p>
                                        <a href={temple.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 px-6 py-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all w-fit pointer-events-auto">
                                            {t('about:destinations.learn_more')} <ArrowRight className="w-4 h-4" />
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>



                {/* ═══════════════════════════════════════════════════
            PART B — ACADEMIC / PROJECT SECTIONS
            ═══════════════════════════════════════════════════ */}

                {/* ─── About PanditYatra Hero ─────────────────────── */}
                <section id="about-project" className="relative overflow-hidden py-24 px-4 bg-[#FFFCF9]">
                    <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,transparent)]" />
                    <div className="container mx-auto max-w-6xl relative z-10 text-center">
                        <motion.button whileHover={{ scale: 1.05 }} className="bg-orange-600 text-white px-8 py-2.5 rounded-full font-black text-xs uppercase tracking-widest mb-8 shadow-xl shadow-orange-600/20">
                            About Platform
                        </motion.button>
                        <Card className="border-none shadow-2xl bg-white/90 backdrop-blur-md rounded-[3rem] overflow-hidden">
                            <CardContent className="py-20 px-8 md:px-20 grid lg:grid-cols-2 gap-16 items-center">
                                <div className="text-left">
                                    <motion.h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-6 leading-tight" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                                        {t('about:project.about_title').split('PanditYatra')[0]}<span className="text-orange-600">PanditYatra</span>{t('about:project.about_title').split('PanditYatra')[1]}
                                    </motion.h2>
                                    <motion.p className="text-xl text-orange-700 font-bold mb-8 leading-relaxed" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
                                        {t('about:project.badge')}
                                    </motion.p>
                                    <motion.p className="text-lg text-slate-600 leading-relaxed mb-10" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
                                        {t('about:project.desc_short')}
                                    </motion.p>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100">
                                            <h4 className="font-black text-orange-600 text-3xl mb-1">{stats.verified_pandits}+</h4>
                                            <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">{t('about:mission.verified_pandits')}</p>
                                        </div>
                                        <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100">
                                            <h4 className="font-black text-orange-600 text-3xl mb-1">{Math.floor(stats.total_reviews / 1000)}k+</h4>
                                            <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Happy Reviews</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="relative group">
                                    <div className="absolute -inset-4 bg-orange-600/10 rounded-[3rem] blur-3xl group-hover:bg-orange-600/20 transition-all duration-1000" />
                                    <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border-8 border-white">
                                        <img src="https://res.cloudinary.com/dm0vvpzs9/image/upload/v1774179863/ABOUT_PANDIRT_wz8pav.webp" alt="PanditYatra Dashboard" className="w-full h-auto transform group-hover:scale-125 transition-transform duration-1000" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* ─── Project Overview ────────────────────────────── */}
                <section className="py-24 px-4 bg-white relative">
                    <div className="container mx-auto max-w-4xl">
                        <div className="text-center mb-16">
                            <motion.button whileHover={{ scale: 1.05 }} className="bg-slate-900 text-white px-8 py-2.5 rounded-full font-black text-xs uppercase tracking-widest mb-6">Development</motion.button>
                            <h2 className="text-4xl font-extrabold text-slate-900 leading-tight">{t('about:project.overview_title')}</h2>
                        </div>
                        <div className="space-y-8 text-xl text-slate-600 leading-relaxed font-medium">
                            <p className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 shadow-sm">{t('about:project.overview_p1')}</p>
                            <p className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 shadow-sm">{t('about:project.overview_p2')}</p>
                            <p className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 shadow-sm">{t('about:project.overview_p3')}</p>
                        </div>
                    </div>
                </section>

                {/* ─── Who is PanditYatra For? ────────────────────── */}
                <section className="py-24 bg-[#FFFAF5] px-4 relative overflow-hidden">
                    <div className="container mx-auto max-w-7xl">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="order-2 lg:order-1">
                                <div className="text-center lg:text-left mb-12">
                                    <motion.button whileHover={{ scale: 1.05 }} className="bg-orange-600 text-white px-8 py-2.5 rounded-full font-black text-xs uppercase tracking-widest mb-6 shadow-xl shadow-orange-600/20">Target Audience</motion.button>
                                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">{t('about:project.who_is_it_for')}</h2>
                                    <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto lg:mx-0">{t('about:project.who_desc')}</p>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-6">
                                    {targetUsers.map((u, i) => (
                                        <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                                            <Card className="h-full border-none shadow-sm hover:shadow-2xl transition-all bg-white rounded-[2rem] overflow-hidden group">
                                                <CardContent className="p-6">
                                                    <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-4 group-hover:bg-orange-600 group-hover:text-white transition-all group-hover:rotate-12">
                                                        <Users className="w-6 h-6" />
                                                    </div>
                                                    <h4 className="font-black text-lg text-slate-900 mb-2">{u.label}</h4>
                                                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{u.detail}</p>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                            <div className="order-1 lg:order-2">
                                <div className="relative group">
                                    <div className="absolute -inset-4 bg-orange-600/10 rounded-[3rem] blur-3xl group-hover:bg-orange-600/20 transition-all duration-1000" />
                                    <div className="relative rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white">
                                        <img src="https://res.cloudinary.com/dm0vvpzs9/image/upload/v1774179863/AGE_jjsms8.webp" alt="Target Audience" className="w-full h-auto transform group-hover:scale-125 transition-transform duration-1000" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── Mission & Vision ───────────────────────────── */}
                <section className="py-24 px-4 bg-white relative">
                    <div className="container mx-auto max-w-6xl">
                        <div className="grid md:grid-cols-2 gap-16">
                            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-orange-50 p-12 rounded-[3.5rem] border border-orange-100 relative group">
                                <div className="inline-flex items-center gap-2 bg-white text-orange-600 font-black text-xs uppercase tracking-widest px-4 py-2 rounded-full mb-6 shadow-sm">{t('about:project.mission_badge')}</div>
                                <h3 className="text-3xl font-black mb-6 text-slate-900 leading-tight">{t('about:project.bringing_tradition')}</h3>
                                <p className="text-lg text-slate-600 leading-relaxed mb-6">{t('about:mission.p1')}</p>
                                <p className="text-lg text-slate-600 leading-relaxed font-bold">{t('about:mission.p2')}</p>
                            </motion.div>
                            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-blue-50 p-12 rounded-[3.5rem] border border-blue-100 relative group">
                                <div className="inline-flex items-center gap-2 bg-white text-blue-600 font-black text-xs uppercase tracking-widest px-4 py-2 rounded-full mb-6 shadow-sm">{t('about:project.vision_badge')}</div>
                                <h3 className="text-3xl font-black mb-6 text-slate-900 leading-tight">{t('about:project.connected_world')}</h3>
                                <p className="text-lg text-slate-600 leading-relaxed mb-6">{t('about:project.vision_desc')}</p>
                                <p className="text-lg text-slate-600 leading-relaxed font-bold">{t('about:project.desc_short')}</p>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* ─── Key Features ───────────────────────────────── */}
                <section className="py-24 bg-[#FFFAF5] px-4 relative">
                    <div className="container mx-auto max-w-7xl text-center">
                        <motion.button whileHover={{ scale: 1.05 }} className="bg-orange-600 text-white px-8 py-2.5 rounded-full font-black text-xs uppercase tracking-widest mb-6 shadow-xl shadow-orange-600/20">Core Capabilities</motion.button>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">{t('about:features.title')}</h2>
                        <p className="text-xl text-slate-500 font-medium mb-20 max-w-xl mx-auto">{t('about:features.subtitle')}</p>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {features.map((f, i) => (
                                <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                                    <Card className="h-full border-none shadow-sm hover:shadow-2xl transition-all bg-white group rounded-[2.5rem] overflow-hidden">
                                        <CardContent className="p-10 text-center">
                                            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-orange-100 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all group-hover:scale-110 group-hover:rotate-6">
                                                <f.icon className="w-8 h-8 text-orange-600 group-hover:text-white transition-colors" />
                                            </div>
                                            <h4 className="font-black text-xl text-slate-900 mb-4">{f.title}</h4>
                                            <p className="text-base text-slate-500 leading-relaxed font-medium">{f.desc}</p>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── Developer Information ──────────────────────── */}
                <section id="developer-info" className="py-24 md:py-32 px-4 bg-white">
                    <div className="container mx-auto max-w-5xl">
                        <div className="text-center mb-16 px-4">
                            <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">{t('about:developer.role')}</h2>
                            <motion.button whileHover={{ scale: 1.05 }} className="bg-orange-600/10 text-orange-600 border border-orange-200 px-10 py-3 rounded-full font-black text-xs uppercase tracking-widest mt-6 shadow-sm">{t('about:developer.lead_role')}</motion.button>
                        </div>

                        {/* Developer Card */}
                        <motion.div className="bg-white rounded-[3rem] shadow-2xl border border-orange-100 p-10 md:p-16 mb-20 relative overflow-hidden" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 -mr-32 -mt-32 rounded-full opacity-50" />
                            <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                                <div className="w-48 h-48 rounded-[3rem] bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-2xl border-4 border-white ring-8 ring-orange-50 transform hover:scale-125 transition-transform duration-700">
                                    <img src="/images/amit_pokhrel.png" alt="Amit Pokhrel" className="w-full h-full object-cover" />
                                </div>
                                <div className="text-center md:text-left flex-1">
                                    <h3 className="text-3xl font-black text-slate-900 mb-2">{t('about:developer.role')}</h3>
                                    <p className="text-orange-600 font-black text-sm mb-8 tracking-widest uppercase">{t('about:developer.title')}</p>
                                    <div className="grid gap-3 text-slate-600 text-base font-bold">
                                        <p className="bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                                            <span className="w-2 h-2 rounded-full bg-orange-600" />
                                            {t('about:developer.id')}
                                        </p>
                                        <p className="bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                                            <span className="w-2 h-2 rounded-full bg-orange-600" />
                                            {t('about:developer.university')}
                                        </p>
                                        <p className="bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                                            <span className="w-2 h-2 rounded-full bg-orange-600" />
                                            {t('about:developer.project_label')}
                                        </p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-4 mt-10 justify-center md:justify-start">
                                        <motion.button 
                                            whileHover={{ scale: 1.05, backgroundColor: '#ea580c' }} 
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => document.getElementById('supervisors-section')?.scrollIntoView({ behavior: 'smooth' })}
                                            className="inline-flex items-center justify-center gap-3 bg-orange-600 text-white px-8 py-4 rounded-full font-black shadow-xl shadow-orange-600/20 transition-all group"
                                        >
                                            <Users className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                            {t('about:developer.meet_supervisor')}
                                        </motion.button>
                                        <div className="flex gap-4">
                                            <a href="https://github.com/ameetpokhrel02" target="_blank" rel="noopener noreferrer" className="w-14 h-14 inline-flex items-center justify-center text-slate-700 bg-slate-50 border-2 border-slate-100 hover:border-orange-600 hover:text-orange-600 transition-all rounded-full shadow-sm">
                                                <Github className="w-6 h-6" />
                                            </a>
                                            <a href="https://www.linkedin.com/in/ameet-pokhrel-82533433b/" target="_blank" rel="noopener noreferrer" className="w-14 h-14 inline-flex items-center justify-center text-slate-700 bg-slate-50 border-2 border-slate-100 hover:border-[#0077b5] hover:text-[#0077b5] transition-all rounded-full shadow-sm">
                                                <Linkedin className="w-6 h-6" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Supervisors */}
                        <div id="supervisors-section" className="scroll-mt-32">
                            <div className="text-center mb-16 px-4">
                                <motion.button whileHover={{ scale: 1.05 }} className="bg-slate-900 text-white px-10 py-3 rounded-full font-black text-xs uppercase tracking-widest mb-6 shadow-xl shadow-slate-900/10">Recognition</motion.button>
                                <p className="text-orange-600 text-sm font-black uppercase tracking-widest mb-4">{t('about:developer.supervisor_ack')}</p>
                                <h3 className="text-xl md:text-2xl font-medium text-slate-600 leading-relaxed max-w-3xl mx-auto italic">{t('about:developer.supervisor_desc')}</h3>
                            </div>
                            <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
                                {/* Internal Supervisor */}
                                <Card className="border-none bg-white shadow-2xl rounded-[3rem] overflow-hidden group">
                                    <CardContent className="p-10 flex flex-col items-center text-center">
                                        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center mb-6 shadow-xl overflow-hidden ring-4 ring-orange-50">
                                            <span className="text-4xl font-black text-orange-600">NR</span>
                                        </div>
                                        <h4 className="font-black text-2xl text-slate-900 mb-1">Nikesh Regmi</h4>
                                        <p className="text-xs text-orange-600 font-black uppercase tracking-widest mb-4 px-4 py-1.5 bg-orange-50 rounded-full shadow-sm">{t('about:developer.internal_sup')}</p>
                                        <p className="text-base text-slate-700 font-bold mb-1">{t('about:developer.nikesh_role')}</p>
                                        <p className="text-sm text-slate-500 mb-6 font-medium">{t('about:developer.nikesh_college')}</p>
                                        <div className="flex flex-wrap gap-2 justify-center mb-8">
                                            {t('about:developer.nikesh_skills').split(',').map((skill, si) => (
                                                <span key={si} className="text-[10px] bg-slate-50 text-slate-700 px-3 py-1 rounded-lg border border-slate-100 font-black uppercase tracking-tight">
                                                    {skill.trim()}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex gap-4 justify-center mt-auto w-full pt-6 border-t border-slate-50">
                                            <a href="https://github.com/nikesh-iic" target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-all"><Github className="w-5 h-5" /></a>
                                            <a href="https://www.linkedin.com/in/regmi7/" target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><Linkedin className="w-5 h-5" /></a>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* External Supervisor */}
                                <Card className="border-none bg-white shadow-2xl rounded-[3rem] overflow-hidden group">
                                    <CardContent className="p-10 flex flex-col items-center text-center">
                                        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-6 shadow-xl overflow-hidden ring-4 ring-blue-50 transform hover:scale-125 transition-transform duration-700">
                                            <img src="/images/hemraj_dhakal.png" alt="Hemraj Dhakal" className="w-full h-full object-cover" onError={(e) => { const t = e.target as HTMLImageElement; t.style.display = 'none'; t.parentElement!.innerHTML = '<span class="text-4xl font-black text-blue-600">HD</span>'; }} />
                                        </div>
                                        <h4 className="font-black text-2xl text-slate-900 mb-1">Hemraj Dhakal</h4>
                                        <p className="text-xs text-blue-600 font-black uppercase tracking-widest mb-4 px-4 py-1.5 bg-blue-50 rounded-full shadow-sm">{t('about:developer.external_sup')}</p>
                                        <p className="text-base text-slate-700 font-bold mb-1">{t('about:developer.hemraj_role')}</p>
                                        <p className="text-sm text-slate-500 mb-2 font-medium">{t('about:developer.hemraj_affiliation')}</p>
                                        <p className="text-[10px] text-orange-600 font-black uppercase tracking-tight mb-4 px-3 py-1 bg-orange-50 rounded-lg">{t('about:developer.hemraj_alumni')}</p>
                                        <p className="text-[11px] text-slate-400 font-bold italic mb-8 leading-relaxed line-clamp-2 px-4 shadow-sm py-2 bg-slate-50/50 rounded-xl">{t('about:developer.hemraj_specialty')}</p>
                                        <div className="flex gap-4 justify-center mt-auto w-full pt-6 border-t border-slate-50">
                                            <a href="https://github.com/Hemraj183" target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-all"><Github className="w-5 h-5" /></a>
                                            <a href="https://www.linkedin.com/in/hemaraj-dhakal-155b1b1a7/" target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><Linkedin className="w-5 h-5" /></a>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Third Card: College Support */}
                                <Card className="border-none bg-white shadow-2xl rounded-[3rem] overflow-hidden group md:col-span-2 lg:col-span-1 max-w-md mx-auto">
                                    <CardContent className="p-10 flex flex-col items-center text-center">
                                        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center mb-6 shadow-xl overflow-hidden ring-4 ring-green-50">
                                            <GraduationCap className="w-12 h-12 text-green-600" />
                                        </div>
                                        <h4 className="font-black text-2xl text-slate-900 mb-1">Academic Support</h4>
                                        <p className="text-xs text-green-600 font-black uppercase tracking-widest mb-4 px-4 py-1.5 bg-green-50 rounded-full shadow-sm">Mentorship</p>
                                        <a href="https://iic.edu.np/" target="_blank" rel="noopener noreferrer" className="text-base text-slate-700 font-bold mb-1 hover:text-green-600 transition-colors underline decoration-dotted">Itahari International College</a>
                                        <p className="text-sm text-slate-500 mb-6 font-medium">LMetU Affiliated</p>
                                        <p className="text-sm text-slate-600 leading-relaxed italic">"Providing guidance and resources for the next generation of Nepali technologists."</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── Technology Stack ────────────────────────────── */}
                <section className="py-24 px-4 bg-slate-50 relative overflow-hidden">
                    <div className="absolute left-[-5%] top-[-5%] w-96 h-96 bg-orange-600/10 rounded-full blur-3xl" />
                    <div className="container mx-auto max-w-7xl relative z-10">
                        <div className="grid lg:grid-cols-12 gap-16 items-center">
                            <div className="lg:col-span-5 order-2 lg:order-1">
                                <div className="relative group">
                                    <div className="absolute -inset-4 bg-orange-600/10 rounded-[3rem] blur-3xl group-hover:bg-orange-600/20 transition-all duration-1000" />
                                    <div className="relative rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white/10">
                                        <img src="https://res.cloudinary.com/dm0vvpzs9/image/upload/v1774179863/TECHSTACKS_hoc7lw.webp" alt="Technology Stack" className="w-full h-auto transform group-hover:scale-125 transition-transform duration-1000" />
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-7 order-1 lg:order-2">
                                <div className="text-center lg:text-left mb-16">
                                    <motion.button whileHover={{ scale: 1.05 }} className="bg-blue-600 text-white px-10 py-3 rounded-full font-black text-xs uppercase tracking-widest mb-6 shadow-xl shadow-blue-600/20">Architecture</motion.button>
                                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 font-serif tracking-tight">Engineered for Reliability</h2>
                                    <p className="text-xl text-slate-600 font-medium max-w-lg mx-auto lg:mx-0">{t('about:features.subtitle')}</p>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-6">
                                    {techStack.map((cat, i) => {
                                        const icons = [Code, Server, Database, Smartphone];
                                        const colors = ['bg-blue-500/10 text-blue-500', 'bg-green-500/10 text-green-500', 'bg-purple-500/10 text-purple-500', 'bg-orange-500/10 text-orange-500'];
                                        const Icon = icons[i];
                                        return (
                                            <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                                                <Card className="h-full border-slate-100 bg-white shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all rounded-[2rem] overflow-hidden group">
                                                    <CardContent className="p-8">
                                                        <div className={`w-12 h-12 rounded-xl ${colors[i]} flex items-center justify-center mb-6 border border-slate-100 ring-4 ring-slate-50 group-hover:scale-110 transition-transform`}><Icon className="w-6 h-6" /></div>
                                                        <h4 className="font-black text-slate-900 text-lg mb-4">{cat.category}</h4>
                                                        <ul className="space-y-3">
                                                            {cat.items.map((item, j) => (
                                                                <li key={j} className="text-[13px] text-slate-600 font-bold flex items-center gap-2">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                                                                    {item}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── College Logo & Contact ─────────────────────── */}
                <section className="py-24 bg-white px-4 relative">
                    <div className="container mx-auto max-w-5xl text-center">
                         <motion.button whileHover={{ scale: 1.05 }} className="bg-orange-600 text-white px-10 py-3 rounded-full font-black text-xs uppercase tracking-widest mb-16 shadow-xl shadow-orange-600/20">Affiliation</motion.button>
                        
                        {/* College logos */}
                        <div className="flex items-center justify-center gap-12 md:gap-24 mb-20 flex-wrap">
                            <div className="flex flex-col items-center gap-6">
                                <div className="w-32 h-32 rounded-[2rem] bg-white shadow-2xl flex items-center justify-center border border-slate-100 overflow-hidden p-4 transform hover:rotate-3 transition-transform">
                                    <img src="/images/itahari_college_logo.png" alt="Itahari International College" className="w-full h-full object-contain" />
                                </div>
                                <span className="text-sm text-slate-400 font-black tracking-widest uppercase">Itahari International College</span>
                            </div>
                            <div className="text-slate-200 text-4xl hidden lg:block font-light">✕</div>
                            <div className="flex flex-col items-center gap-6">
                                <div className="w-32 h-32 rounded-[2rem] bg-white shadow-2xl flex items-center justify-center border border-slate-100 overflow-hidden p-6 transform hover:-rotate-3 transition-transform">
                                    <GraduationCap className="w-16 h-16 text-blue-800" />
                                </div>
                                <span className="text-sm text-slate-400 font-black tracking-widest uppercase">London Metropolitan University</span>
                            </div>
                        </div>

                        {/* Contact */}
                        <div className="max-w-3xl mx-auto bg-[#FFFAF5] p-16 rounded-[4rem] border border-orange-100 shadow-sm">
                            <h3 className="text-4xl font-black text-slate-900 mb-6">{t('about:developer.get_in_touch')}</h3>
                            <a href="mailto:pandityatra9@gmail.com" className="text-2xl md:text-4xl font-black text-orange-600 hover:text-orange-700 block mb-12 transition-all hover:scale-105">
                                pandityatra9@gmail.com
                            </a>
                            <Link
                                to="/contact"
                                className="inline-flex items-center gap-3 px-12 py-5 bg-slate-900 text-white rounded-full font-black hover:bg-orange-600 transition-all shadow-2xl hover:shadow-orange-600/20"
                            >
                                <MessageSquare className="w-6 h-6" /> {t('about:developer.contact_us')}
                            </Link>
                        </div>

                        {/* Made with love */}
                        <p className="mt-20 text-slate-400 font-bold text-sm flex items-center justify-center gap-2">
                            {t('about:developer.made_with_love').split('for')[0]} <Heart className="w-5 h-5 text-red-500 fill-red-500 animate-pulse" /> {t('about:developer.made_with_love').split('for')[1]}
                        </p>
                    </div>
                </section>

            </div>
            <Footer />
        </div>
    );
};

export default AboutUs;
