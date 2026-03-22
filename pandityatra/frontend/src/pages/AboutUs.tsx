import React from 'react';
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
import panditYatraLogo from '@/assets/images/PanditYatralogo.png';
import panditsGrp from '@/assets/images/pandits  grp.png';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' as const }
  })
};

/* ── data ───────────────────────────────────────────────── */

const features = [
  { icon: Video,        title: 'Live Video Puja',         desc: 'Join real-time rituals with verified pandits from anywhere in the world via WebRTC.' },
  { icon: Calendar,     title: 'Easy Booking',            desc: 'Browse pandit profiles, pick a date, select a time slot and book in seconds.' },
  { icon: ShoppingBag,  title: 'Puja Samagri Shop',       desc: 'Order authentic puja materials delivered to your doorstep.' },
  { icon: BookOpen,     title: 'Kundali Generator',       desc: 'Generate accurate Vedic birth charts offline with North-Indian style diagrams.' },
  { icon: MessageSquare,title: 'Real-time Chat',          desc: 'Message pandits before and during bookings with built-in WebSocket chat.' },
  { icon: Star,         title: 'Reviews & Ratings',       desc: 'Transparent community feedback helps you choose the best pandit.' },
  { icon: Shield,       title: 'Verified Pandits',        desc: 'Every pandit goes through admin verification before appearing on the platform.' },
  { icon: Globe,        title: 'Global Access',           desc: 'Whether in Kathmandu or New York, access authentic spiritual services.' },
];

const techStack = [
  { category: 'Frontend',  items: ['React 18 + TypeScript', 'Vite', 'Tailwind CSS + shadcn/ui', 'Framer Motion'] },
  { category: 'Backend',   items: ['Django 5 + DRF', 'Django Channels (WebSocket)', 'PostgreSQL', 'Redis'] },
  { category: 'DevOps',    items: ['Docker & Docker Compose', 'Nginx Reverse Proxy', 'Coturn (TURN/STUN)', 'GitHub CI'] },
  { category: 'Services',  items: ['Stripe & Khalti Payments', 'Twilio SMS/OTP', 'Google OAuth 2.0', 'Daily.co WebRTC'] },
];

const targetUsers = [
  { label: 'Nepali Diaspora (NRIs)',       detail: 'Living in the USA, UK, Australia, Europe, and the Middle East who need reliable pandits for Bratabandha, Marriage, Pasni, and Graha Pravesh.' },
  { label: 'Families in Nepal',            detail: 'Who want convenient online booking, live video puja, and easy access to puja samagri.' },
  { label: 'Young Nepali Professionals',   detail: 'Who prefer modern technology combined with traditional rituals.' },
  { label: 'Devotees Worldwide',           detail: 'Who want offline Kundali generation and authentic spiritual guidance anytime.' },
];

const temples = [
  { name: 'Pashupatinath', location: 'Kathmandu, Nepal', image: '/images/pashupatinath.png', link: 'https://pashupatinathtemple.org/', description: 'Sacred Hindu temple on the banks of Bagmati River - A UNESCO World Heritage Site.' },
  { name: 'Muktinath', location: 'Mustang, Nepal', image: '/images/muktinath.png', link: 'https://www.muktinath.org.np/', description: 'Sacred pilgrimage site at 3,710 meters altitude, holy to both Hindus and Buddhists.' },
  { name: 'Manakamana', location: 'Gorkha, Nepal', image: '/images/manakamana.png', link: 'https://en.wikipedia.org/wiki/Manakamana_Temple', description: 'Temple of the wish-fulfilling goddess, accessible by a scenic cable car.' },
  { name: 'Janaki Mandir', location: 'Janakpur, Nepal', image: '/images/janakpur.png', link: 'https://janakpurmun.gov.np/en/node/60', description: 'A magnificent white marble temple dedicated to Goddess Sita.' },
];

/* ── component ──────────────────────────────────────────── */

const AboutUs: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FFFAF5] flex flex-col">
      <Navbar />
      <div className="flex-1">

        {/* ═══════════════════════════════════════════════════
            PART A — ORIGINAL LANDING SECTIONS
            ═══════════════════════════════════════════════════ */}

        {/* ─── Hero Section (Original) ────────────────────── */}
        <section className="relative min-h-[60vh] lg:min-h-[80vh] flex items-center overflow-hidden bg-background py-12 lg:py-0">
          <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />

          {/* Rotating Rings */}
          <div className="absolute right-[-5%] top-1/2 -translate-y-1/2 w-[55%] h-full pointer-events-none hidden lg:flex items-center justify-center overflow-hidden">
            <motion.div className="absolute w-[800px] h-[800px] border border-orange-200/20 rounded-full" animate={{ rotate: -360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }} />
            <motion.div className="absolute w-[600px] h-[600px] border-2 border-dashed border-orange-200/40 rounded-full" animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-lg"><FaOm className="text-orange-500 h-6 w-6" /></div>
              <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-lg"><FaWifi className="text-orange-400 h-5 w-5" /></div>
            </motion.div>
            <motion.div className="absolute w-[450px] h-[450px] border border-orange-100/30 rounded-full" animate={{ rotate: -360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-white p-2 rounded-full shadow-lg"><GiChakram className="text-orange-500 h-6 w-6" /></div>
            </motion.div>
            <div className="relative z-10 w-full h-auto flex justify-center">
              <img src={panditsGrp} alt="PanditYatra Group" className="w-[115%] h-auto drop-shadow-2xl" />
            </div>
          </div>

          <div className="container mx-auto max-w-7xl px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left">
                <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
                  Bridge to <span className="text-orange-600">Divine</span> Connection
                </motion.h1>
                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-lg md:text-xl text-slate-600 max-w-2xl lg:mx-0 mx-auto mb-10 px-4 lg:px-0">
                  PanditYatra simplifies your spiritual journey by connecting you with experienced pandits, sacred rituals, and authentic puja samagri across the holy land of Nepal.
                </motion.p>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link to="/shop/pujas"><Button size="lg" className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto">Explore Services</Button></Link>
                  <Button variant="outline" size="lg" className="border-orange-600 text-orange-600 hover:bg-orange-50 w-full sm:w-auto" asChild><a href="#about-project">About The Project</a></Button>
                </motion.div>
              </div>
              <div className="relative lg:hidden block px-6">
                <div className="max-w-[360px] mx-auto relative rounded-2xl overflow-hidden shadow-2xl">
                  <img src={panditsGrp} alt="PanditYatra Team" className="w-full h-auto" />
                  <div className="absolute inset-0 bg-gradient-to-t from-orange-50/80 to-transparent pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Mission Section (Original) ─────────────────── */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
                <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                  In today's fast-paced world, maintaining a connection with our spiritual roots can be challenging. PanditYatra was born from the desire to make traditional rituals accessible, authentic, and hassle-free.
                </p>
                <p className="text-lg text-slate-600 leading-relaxed">
                  We strive to preserve the sanctity of Sanatan Dharma while leveraging technology to bring pandits and devotees together seamlessly.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-orange-100/50 border-none"><CardContent className="p-6 flex flex-col items-center text-center"><Users className="w-10 h-10 text-orange-600 mb-4" /><h3 className="font-semibold mb-2">Verified Pandits</h3><p className="text-sm text-slate-600">Experienced & Knowledgeable</p></CardContent></Card>
                <Card className="bg-blue-50 border-none"><CardContent className="p-6 flex flex-col items-center text-center"><BookOpen className="w-10 h-10 text-blue-600 mb-4" /><h3 className="font-semibold mb-2">Authentic Rituals</h3><p className="text-sm text-slate-600">Strict Adherence to Vidhi</p></CardContent></Card>
                <Card className="bg-green-100/50 border-none"><CardContent className="p-6 flex flex-col items-center text-center"><Award className="w-10 h-10 text-green-600 mb-4" /><h3 className="font-semibold mb-2">Quality Samagri</h3><p className="text-sm text-slate-600">Pure & Fresh Materials</p></CardContent></Card>
                <Card className="bg-purple-50 border-none"><CardContent className="p-6 flex flex-col items-center text-center"><MapPin className="w-10 h-10 text-purple-600 mb-4" /><h3 className="font-semibold mb-2">Temple Booking</h3><p className="text-sm text-slate-600">Access to Sacred Sites</p></CardContent></Card>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Essence of Rituals (Original) ──────────────── */}
        <section className="py-20 bg-orange-50/30 px-4">
          <div className="container mx-auto max-w-7xl">
            <h2 className="text-3xl font-bold text-center mb-12">The Essence of Rituals</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: "Spiritual Harmony", desc: "Rituals create a bridge between the material and the spiritual, bringing peace and balance to life." },
                { title: "Cultural Heritage", desc: "Preserving ancient traditions passed down through generations, keeping our culture alive." },
                { title: "Positive Energy", desc: "Sacred mantras and offerings generate positive vibrations that cleanse the environment and mind." },
              ].map((item, idx) => (
                <motion.div key={idx} whileHover={{ y: -5 }} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-xl mb-6">{idx + 1}</div>
                  <h3 className="text-xl font-bold mb-4">{item.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Sacred Destinations (Original) ─────────────── */}
        <section className="py-20 px-4 bg-background">
          <div className="container mx-auto max-w-7xl">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-3xl font-bold mb-2">Sacred Destinations</h2>
                <p className="text-slate-600">Explore divine temples and pilgrimage sites.</p>
              </div>
              <Link to="/booking" className="text-orange-600 font-semibold flex items-center gap-2 hover:gap-3 transition-all">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {temples.map((temple, i) => (
                <div key={i} className="group relative overflow-hidden rounded-xl aspect-[4/3] bg-slate-200 shadow-lg hover:shadow-xl transition-all">
                  <img src={temple.image} alt={temple.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onError={(e) => { (e.target as HTMLImageElement).src = '/images/puja1.svg'; }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6 text-white translate-y-4 group-hover:translate-y-0 transition-transform">
                    <h3 className="font-bold text-lg mb-1">{temple.name}</h3>
                    <p className="text-sm text-white/90 mb-3">{temple.location}</p>
                    <p className="text-xs text-white/70 opacity-0 group-hover:opacity-100 transition-opacity mb-3">{temple.description}</p>
                    <a href={temple.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all w-fit" onClick={(e) => e.stopPropagation()}>
                      Learn More <ArrowRight className="w-4 h-4" />
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
        <section id="about-project" className="relative overflow-hidden py-16 md:py-20 px-4">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-[#FFF7ED] to-amber-50 -z-10" />
          <div className="absolute right-[-10%] top-[-20%] w-[700px] h-[700px] rounded-full border border-orange-200/30 -z-10 hidden lg:block" />
          <div className="container mx-auto max-w-4xl">
            <Card className="border-2 border-orange-200 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="py-14 md:py-20 px-6 md:px-12 text-center">
                <motion.img src={panditYatraLogo} alt="PanditYatra" className="w-20 h-20 mx-auto mb-5 drop-shadow-lg" initial={{ scale: 0.8, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} />
                <motion.h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-3" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  About <span className="text-orange-600">PanditYatra</span>
                </motion.h2>
                <motion.p className="text-lg text-orange-700/80 font-medium mb-4" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
                  Connecting Global Nepali Families with Authentic Spiritual Services
                </motion.p>
                <motion.p className="max-w-2xl mx-auto text-slate-600" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
                  PanditYatra is a full-stack spiritual-tech platform that brings verified pandits, live video rituals, puja samagri, and Vedic astrology tools directly to your home — no matter where you are.
                </motion.p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ─── Project Overview ────────────────────────────── */}
        <section className="py-16 md:py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <Card className="border-2 border-slate-200 shadow-md bg-white">
              <CardContent className="py-10 md:py-14 px-6 md:px-12 space-y-6">
                <motion.h2 className="text-3xl font-bold text-center mb-4" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>Project Overview</motion.h2>
                <p className="text-slate-700 leading-relaxed text-base md:text-lg">
                  PanditYatra is a comprehensive web application developed as a Final Year Project for <strong>London Metropolitan University (Itahari International College)</strong>. The platform addresses a real and growing need within the Nepali community — both in Nepal and abroad — to access trusted, verified pandits for important religious ceremonies like Bratabandha, Vivah (Marriage), Pasni, Graha Pravesh, and more.
                </p>
                <p className="text-slate-700 leading-relaxed text-base md:text-lg">
                  The application integrates modern web technologies with traditional Vedic knowledge to offer live video puja sessions, an online samagri marketplace, an offline Kundali (birth chart) generator, real-time chat between users and pandits, Panchang data, and a secure multi-gateway payment system supporting Stripe, Khalti, and eSewa.
                </p>
                <p className="text-slate-700 leading-relaxed text-base md:text-lg">
                  Built using React, TypeScript, Django, PostgreSQL, Redis, Docker, and WebRTC, PanditYatra demonstrates a production-grade, full-stack architecture with role-based access, admin dashboards, and progressive web app capabilities.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ─── Who is PanditYatra For? ────────────────────── */}
        <section className="py-16 md:py-20 bg-orange-50/50 px-4">
          <div className="container mx-auto max-w-5xl">
            <motion.h2 className="text-3xl font-bold text-center mb-4" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>Who is PanditYatra For?</motion.h2>
            <p className="text-center text-slate-600 max-w-2xl mx-auto mb-10">PanditYatra is designed for the global Nepali community who want to practice their cultural and religious traditions with ease and trust.</p>
            <div className="grid md:grid-cols-2 gap-6">
              {targetUsers.map((u, i) => (
                <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <Card className="h-full border-orange-100 hover:shadow-md transition-shadow bg-white">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5"><Users className="w-4 h-4 text-orange-600" /></div>
                        <div><h4 className="font-semibold text-slate-900 mb-1">{u.label}</h4><p className="text-sm text-slate-600">{u.detail}</p></div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            <p className="text-center text-slate-600 mt-8 text-sm md:text-base italic">Whether you are in Kathmandu or New York, PanditYatra brings verified pandits, real-time video rituals, and complete puja solutions directly to your home.</p>
          </div>
        </section>

        {/* ─── Mission & Vision ───────────────────────────── */}
        <section className="py-16 md:py-20 px-4">
          <div className="container mx-auto max-w-5xl">
            <div className="grid md:grid-cols-2 gap-12">
              <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
                <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 text-sm font-medium px-3 py-1 rounded-full mb-4">🙏 Our Mission</div>
                <h3 className="text-2xl font-bold mb-4">Bringing Tradition Online</h3>
                <p className="text-slate-600 leading-relaxed mb-4">In today's fast-paced world, maintaining a connection with our spiritual roots can be challenging. PanditYatra was born from the desire to make traditional rituals accessible, authentic, and hassle-free.</p>
                <p className="text-slate-600 leading-relaxed">We strive to preserve the sanctity of Sanatan Dharma while leveraging technology to bring pandits and devotees together seamlessly.</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
                <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-medium px-3 py-1 rounded-full mb-4">🔭 Our Vision</div>
                <h3 className="text-2xl font-bold mb-4">A Spiritually Connected World</h3>
                <p className="text-slate-600 leading-relaxed mb-4">We envision a future where every Nepali — regardless of geography — can participate in sacred rituals with the same devotion and authenticity as being physically present.</p>
                <p className="text-slate-600 leading-relaxed">PanditYatra aims to become the trusted digital bridge between ancient wisdom and modern convenience, empowering millions to stay connected with their faith.</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ─── Key Features ───────────────────────────────── */}
        <section className="py-16 md:py-20 bg-gradient-to-b from-white to-orange-50/30 px-4">
          <div className="container mx-auto max-w-6xl">
            <motion.h2 className="text-3xl font-bold text-center mb-3" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>Key Features</motion.h2>
            <p className="text-center text-slate-500 mb-12 max-w-xl mx-auto">Everything you need for a complete spiritual experience — all in one platform.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((f, i) => (
                <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <Card className="h-full border-none shadow-sm hover:shadow-lg transition-all bg-white group">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-orange-100 flex items-center justify-center group-hover:bg-orange-600 transition-colors">
                        <f.icon className="w-6 h-6 text-orange-600 group-hover:text-white transition-colors" />
                      </div>
                      <h4 className="font-semibold text-slate-900 mb-2">{f.title}</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Developer Information ──────────────────────── */}
        <section className="py-16 md:py-20 px-4">
          <div className="container mx-auto max-w-5xl">
            <motion.h2 className="text-3xl font-bold text-center mb-12" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>Developer Information</motion.h2>

            {/* Developer Card */}
            <motion.div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-8 md:p-10 mb-10" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-36 h-36 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md">
                  <img src="/images/amit_pokhrel.png" alt="Amit Pokhrel" className="w-full h-full object-cover" />
                </div>
                <div className="text-center md:text-left flex-1">
                  <h3 className="text-2xl font-bold text-slate-900 mb-1">Amit Pokhrel</h3>
                  <p className="text-orange-600 font-medium mb-3">Full-Stack Developer &amp; Creator</p>
                  <div className="space-y-1 text-slate-600 text-sm">
                    <p><strong>Student ID:</strong> 23056626</p>
                    <p><strong>University:</strong> London Metropolitan University</p>
                    <p><strong>College:</strong> Itahari International College, Nepal</p>
                    <p><strong>Programme:</strong> BSc (Hons) Computing</p>
                    <p><strong>Project:</strong> Final Year Project — 2025/2026</p>
                  </div>
                  <div className="flex gap-3 mt-4 justify-center md:justify-start">
                    <a href="https://github.com/ameetpokhrel02" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-orange-600 transition-colors bg-slate-100 hover:bg-orange-50 px-3 py-1.5 rounded-lg">
                      <Github className="w-4 h-4" /> GitHub
                    </a>
                    <a href="https://www.linkedin.com/in/ameet-pokhrel-82533433b/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors bg-slate-100 hover:bg-blue-50 px-3 py-1.5 rounded-lg">
                      <Linkedin className="w-4 h-4" /> LinkedIn
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Supervisors */}
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h3 className="text-xl font-bold text-center mb-6 text-slate-800">Supervisor Acknowledgment</h3>
              <p className="text-center text-slate-600 mb-8 max-w-xl mx-auto text-sm">Special thanks to our Internal and External Supervisors for their invaluable guidance and mentorship throughout this project.</p>
              <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {/* Internal Supervisor */}
                <Card className="border-orange-100 bg-white hover:shadow-md transition-shadow">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center mb-4 shadow-sm overflow-hidden">
                      <span className="text-3xl font-bold text-orange-500">NR</span>
                    </div>
                    <h4 className="font-semibold text-lg text-slate-900">Nikesh Regmi</h4>
                    <p className="text-sm text-orange-600 font-medium mb-1">Internal Supervisor</p>
                    <p className="text-xs text-slate-500 mb-3">Itahari International College</p>
                    <div className="flex gap-3 mt-1 justify-center">
                      <a href="https://github.com/nikesh-iic" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-orange-600 transition-colors bg-slate-50 hover:bg-orange-50 px-2.5 py-1 rounded-md">
                        <Github className="w-3.5 h-3.5" /> GitHub
                      </a>
                      <a href="https://www.linkedin.com/in/regmi7/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-blue-600 transition-colors bg-slate-50 hover:bg-blue-50 px-2.5 py-1 rounded-md">
                        <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                      </a>
                    </div>
                  </CardContent>
                </Card>

                {/* External Supervisor */}
                <Card className="border-orange-100 bg-white hover:shadow-md transition-shadow">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-4 shadow-sm overflow-hidden">
                      <img src="/images/hemraj_dhakal.png" alt="Hemraj Dhakal" className="w-full h-full object-cover" onError={(e) => { const t = e.target as HTMLImageElement; t.style.display = 'none'; t.parentElement!.innerHTML = '<span class="text-3xl font-bold text-blue-500">HD</span>'; }} />
                    </div>
                    <h4 className="font-semibold text-lg text-slate-900">Hemraj Dhakal</h4>
                    <p className="text-sm text-blue-600 font-medium mb-1">External Supervisor</p>
                    <p className="text-xs text-slate-500 mb-3">London Metropolitan University</p>
                    <div className="flex gap-3 mt-1 justify-center">
                      <a href="https://github.com/Hemraj183" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-orange-600 transition-colors bg-slate-50 hover:bg-orange-50 px-2.5 py-1 rounded-md">
                        <Github className="w-3.5 h-3.5" /> GitHub
                      </a>
                      <a href="https://www.linkedin.com/in/hemaraj-dhakal-155b1b1a7/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-blue-600 transition-colors bg-slate-50 hover:bg-blue-50 px-2.5 py-1 rounded-md">
                        <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ─── Technology Stack ────────────────────────────── */}
        <section className="py-16 md:py-20 bg-slate-50 px-4">
          <div className="container mx-auto max-w-5xl">
            <motion.h2 className="text-3xl font-bold text-center mb-3" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>Technology Stack</motion.h2>
            <p className="text-center text-slate-500 mb-12 max-w-lg mx-auto">Built with modern, industry-standard technologies for reliability and performance.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {techStack.map((cat, i) => {
                const icons = [Code, Server, Database, Smartphone];
                const colors = ['bg-blue-100 text-blue-600', 'bg-green-100 text-green-600', 'bg-purple-100 text-purple-600', 'bg-orange-100 text-orange-600'];
                const Icon = icons[i];
                return (
                  <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                    <Card className="h-full border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className={`w-10 h-10 rounded-lg ${colors[i]} flex items-center justify-center mb-4`}><Icon className="w-5 h-5" /></div>
                        <h4 className="font-semibold text-slate-900 mb-3">{cat.category}</h4>
                        <ul className="space-y-1.5">
                          {cat.items.map((item, j) => (
                            <li key={j} className="text-sm text-slate-600 flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />{item}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── College Logo & Contact ─────────────────────── */}
        <section className="py-16 md:py-20 bg-gradient-to-b from-orange-50/30 to-[#FFFAF5] px-4">
          <div className="container mx-auto max-w-4xl text-center">
            {/* College logos */}
            <div className="flex items-center justify-center gap-8 md:gap-16 mb-12 flex-wrap">
              <div className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-xl bg-white shadow-md flex items-center justify-center border border-slate-100 overflow-hidden p-2">
                  <img src="/images/itahari_college_logo.png" alt="Itahari International College" className="w-full h-full object-contain" />
                </div>
                <span className="text-xs text-slate-500 font-medium">Itahari International College</span>
              </div>
              <div className="text-slate-300 text-2xl hidden md:block">×</div>
              <div className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-xl bg-white shadow-md flex items-center justify-center border border-slate-100 overflow-hidden p-2">
                  <GraduationCap className="w-12 h-12 text-blue-700" />
                </div>
                <span className="text-xs text-slate-500 font-medium">London Metropolitan University</span>
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-4 mb-8">
              <h3 className="text-xl font-bold text-slate-800">Get in Touch</h3>
              <a href="mailto:pandityatra9@gmail.com" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium transition-colors">
                <Mail className="w-4 h-4" /> pandityatra9@gmail.com
              </a>
              <div>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-all hover:shadow-lg hover:scale-105"
                >
                  <MessageSquare className="w-4 h-4" /> Contact Us
                </Link>
              </div>
            </div>

            {/* Made with love */}
            <p className="text-slate-400 text-sm flex items-center justify-center gap-1">
              Made with <Heart className="w-4 h-4 text-red-400 fill-red-400" /> for the Nepali community
            </p>
          </div>
        </section>

      </div>
      <Footer />
    </div>
  );
};

export default AboutUs;
