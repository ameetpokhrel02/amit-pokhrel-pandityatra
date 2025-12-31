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
                <section className="relative h-[60vh] flex items-center justify-center overflow-hidden bg-orange-50">
                    <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
                    <div className="container px-4 text-center">
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
                            className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-8"
                        >
                            PanditYatra simplifies your spiritual journey by connecting you with experienced pandits, sacred rituals, and authentic puja samagri.
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
                                Explore Services
                            </Button>
                        </motion.div>
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
                            {/* Note: In a real app, these images would be actual temple images. Using placeholders or div colors for now. */}
                            {['Pashupatinath', 'Muktinath', 'Manakamana', 'Janaki Mandir'].map((temple, i) => (
                                <div key={i} className="group relative overflow-hidden rounded-xl aspect-[4/3] bg-slate-200">
                                    <div className="absolute inset-0 bg-slate-300 animate-pulse" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6 text-white translate-y-4 group-hover:translate-y-0 transition-transform">
                                        <h3 className="font-bold text-lg">{temple}</h3>
                                        <p className="text-sm text-white/80 opacity-0 group-hover:opacity-100 transition-opacity mt-1">Nepal</p>
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
