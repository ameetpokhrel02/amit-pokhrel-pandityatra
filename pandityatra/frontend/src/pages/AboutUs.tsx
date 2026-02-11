import React from 'react';
import { motion } from 'framer-motion';
import { Award, BookOpen, MapPin, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const AboutUs: React.FC = () => {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <div className="flex-1">
                {/* Hero Section */}
                <section className="relative min-h-[70vh] flex items-center overflow-hidden bg-orange-50/50">
                    <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />

                    {/* Background Decorative Map */}
                    <motion.div
                        initial={{ opacity: 0, x: 50, rotate: 5 }}
                        animate={{ opacity: 0.4, x: 0, rotate: -2 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="absolute right-[5%] top-1/2 -translate-y-1/2 w-[45%] pointer-events-none hidden lg:block"
                    >
                        <img src="/images/map_of_nepal.png" alt="Map of Nepal" className="w-full h-auto opacity-60" />
                    </motion.div>

                    <div className="container px-4">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <div className="text-center lg:text-left">
                                <motion.h1
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6"
                                >
                                    Bridge to <span className="text-orange-600">Divine</span> Connection
                                </motion.h1>
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-lg md:text-xl text-slate-600 max-w-2xl lg:mx-0 mx-auto mb-8"
                                >
                                    PanditYatra simplifies your spiritual journey by connecting you with experienced pandits, sacred rituals, and authentic puja samagri across the holy land of Nepal.
                                </motion.p>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                                >
                                    <Link to="/shop/pujas">
                                        <Button size="lg" className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto">
                                            Explore Services
                                        </Button>
                                    </Link>
                                    <Button variant="outline" size="lg" className="border-orange-600 text-orange-600 hover:bg-orange-50 w-full sm:w-auto" asChild>
                                        <a href="#mission">Our Story</a>
                                    </Button>
                                </motion.div>
                            </div>

                            {/* Mobile/Tablet Map Illustration */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 }}
                                className="relative lg:hidden block"
                            >
                                <img
                                    src="/images/map_of_nepal.png"
                                    alt="PanditYatra Network"
                                    className="w-full max-w-md mx-auto h-auto mix-blend-multiply opacity-80"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-orange-50 to-transparent" />
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Mission Section */}
                <section className="py-20 px-4">
                    <div className="container">
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
                                <Card className="bg-orange-50 border-none">
                                    <CardContent className="p-6 flex flex-col items-center text-center">
                                        <Users className="w-10 h-10 text-orange-600 mb-4" />
                                        <h3 className="font-semibold mb-2">Verified Pandits</h3>
                                        <p className="text-sm text-slate-600">Experienced & Knowledgeable</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-blue-50 border-none">
                                    <CardContent className="p-6 flex flex-col items-center text-center">
                                        <BookOpen className="w-10 h-10 text-blue-600 mb-4" />
                                        <h3 className="font-semibold mb-2">Authentic Rituals</h3>
                                        <p className="text-sm text-slate-600">Strict Adherence to Vidhi</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-green-50 border-none">
                                    <CardContent className="p-6 flex flex-col items-center text-center">
                                        <Award className="w-10 h-10 text-green-600 mb-4" />
                                        <h3 className="font-semibold mb-2">Quality Samagri</h3>
                                        <p className="text-sm text-slate-600">Pure & Fresh Materials</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-purple-50 border-none">
                                    <CardContent className="p-6 flex flex-col items-center text-center">
                                        <MapPin className="w-10 h-10 text-purple-600 mb-4" />
                                        <h3 className="font-semibold mb-2">Temple Booking</h3>
                                        <p className="text-sm text-slate-600">Access to Sacred Sites</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Importance of Rituals */}
                <section className="py-20 bg-slate-50 px-4">
                    <div className="container">
                        <h2 className="text-3xl font-bold text-center mb-12">The Essence of Rituals</h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                {
                                    title: "Spiritual Harmony",
                                    desc: "Rituals create a bridge between the material and the spiritual, bringing peace and balance to life."
                                },
                                {
                                    title: "Cultural Heritage",
                                    desc: "Preserving ancient traditions passed down through generations, keeping our culture alive."
                                },
                                {
                                    title: "Positive Energy",
                                    desc: "Sacred mantras and offerings generate positive vibrations that cleanse the environment and mind."
                                }
                            ].map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    whileHover={{ y: -5 }}
                                    className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100"
                                >
                                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-xl mb-6">
                                        {idx + 1}
                                    </div>
                                    <h3 className="text-xl font-bold mb-4">{item.title}</h3>
                                    <p className="text-slate-600 leading-relaxed">
                                        {item.desc}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Featured Temples (Placeholder for 'some temples') */}
                <section className="py-20 px-4 bg-white">
                    <div className="container">
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
                            {[
                                {
                                    name: 'Pashupatinath',
                                    location: 'Kathmandu, Nepal',
                                    image: '/images/pashupatinath.png',
                                    link: 'https://pashupatinathtemple.org/',
                                    description: 'Sacred Hindu temple on the banks of Bagmati River - A UNESCO World Heritage Site.'
                                },
                                {
                                    name: 'Muktinath',
                                    location: 'Mustang, Nepal',
                                    image: '/images/muktinath.png',
                                    link: 'https://www.muktinath.org.np/',
                                    description: 'Sacred pilgrimage site at 3,710 meters altitude, holy to both Hindus and Buddhists.'
                                },
                                {
                                    name: 'Manakamana',
                                    location: 'Gorkha, Nepal',
                                    image: '/images/manakamana.png',
                                    link: 'https://en.wikipedia.org/wiki/Manakamana_Temple',
                                    description: 'Temple of the wish-fulfilling goddess, accessible by a scenic cable car.'
                                },
                                {
                                    name: 'Janaki Mandir',
                                    location: 'Janakpur, Nepal',
                                    image: '/images/janakpur.png',
                                    link: 'https://janakpurmun.gov.np/en/node/60',
                                    description: 'A magnificent white marble temple dedicated to Goddess Sita.'
                                }
                            ].map((temple, i) => (
                                <div key={i} className="group relative overflow-hidden rounded-xl aspect-[4/3] bg-slate-200 shadow-lg hover:shadow-xl transition-all">
                                    <img
                                        src={temple.image}
                                        alt={temple.name}
                                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = '/images/puja1.svg';
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6 text-white translate-y-4 group-hover:translate-y-0 transition-transform">
                                        <h3 className="font-bold text-lg mb-1">{temple.name}</h3>
                                        <p className="text-sm text-white/90 mb-3">{temple.location}</p>
                                        <p className="text-xs text-white/70 opacity-0 group-hover:opacity-100 transition-opacity mb-3">
                                            {temple.description}
                                        </p>
                                        <a
                                            href={temple.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all w-fit"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            Learn More <ArrowRight className="w-4 h-4" />
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-24 bg-orange-600 text-white px-4 text-center">
                    <div className="container">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to star your spiritual journey?</h2>
                        <p className="text-orange-100 max-w-2xl mx-auto mb-8 text-lg">
                            Book a pandit or order puja samagri today and experience the divine connection.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Link to="/booking">
                                <Button size="lg" variant="secondary" className="bg-white text-orange-600 hover:bg-orange-50">
                                    Find a Pandit
                                </Button>
                            </Link>
                            <Link to="/shop/samagri">
                                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                                    Shop Samagri
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
            <Footer />
        </div>
    );
};

export default AboutUs;
