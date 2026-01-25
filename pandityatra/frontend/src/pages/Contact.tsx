import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin, Send, MessageSquare, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { submitContactForm } from '@/lib/api';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const Contact: React.FC = () => {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await submitContactForm(formData);
            setSubmitted(true);
            toast({
                title: "Message Sent!",
                description: "Thank you for reaching out. We'll get back to you soon.",
                className: "bg-green-600 text-white border-none shadow-2xl"
            });
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Something went wrong. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fff7ed] flex flex-col font-inter">
            <Navbar />

            <main className="flex-1 py-20 px-4">
                <div className="container mx-auto max-w-6xl">
                    {/* Header Section */}
                    <div className="text-center mb-16">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-6xl font-black text-slate-900 font-playfair mb-6"
                        >
                            {t('contact')}
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-lg text-slate-600 max-w-2xl mx-auto"
                        >
                            {t('common:contact_subtitle', "Have questions or need assistance? We're here to help you on your spiritual journey.")}
                        </motion.p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12 items-start">
                        {/* Contact Info */}
                        <div className="space-y-8">
                            {[
                                {
                                    icon: <Mail className="w-6 h-6" />,
                                    title: "Email Us",
                                    detail: "pandityatra9@gmail.com",
                                    color: "bg-orange-100 text-orange-600"
                                },
                                {
                                    icon: <Phone className="w-6 h-6" />,
                                    title: "Call / WhatsApp",
                                    detail: "+977 9847226995",
                                    color: "bg-blue-100 text-blue-600"
                                },
                                {
                                    icon: <MapPin className="w-6 h-6" />,
                                    title: "Location",
                                    detail: "Kathmandu, Nepal",
                                    color: "bg-green-100 text-green-600"
                                }
                            ].map((info, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 + 0.2 }}
                                    className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-sm border border-orange-100/50"
                                >
                                    <div className={`p-3 rounded-xl ${info.color}`}>
                                        {info.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 mb-1">{info.title}</h3>
                                        <p className="text-slate-600">{info.detail}</p>
                                    </div>
                                </motion.div>
                            ))}

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="p-8 bg-orange-600 rounded-3xl text-white relative overflow-hidden"
                            >
                                <div className="relative z-10">
                                    <h3 className="text-2xl font-bold mb-4 font-playfair tracking-wide text-amber-200 uppercase">Need Urgent Help?</h3>
                                    <p className="text-orange-50 mb-6 font-medium leading-relaxed">
                                        Our support team is available from 7 AM to 9 PM NST for immediate ritual coordination.
                                    </p>
                                    <Button variant="secondary" className="w-full bg-white text-orange-600 hover:bg-orange-50 font-bold rounded-xl h-12 shadow-lg">
                                        Connect via WhatsApp
                                    </Button>
                                </div>
                                <MessageSquare className="absolute -bottom-10 -right-10 w-40 h-40 text-white/10" />
                            </motion.div>
                        </div>

                        {/* Contact Form */}
                        <div className="md:col-span-2">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
                                    <CardContent className="p-10">
                                        {submitted ? (
                                            <div className="py-20 text-center space-y-6">
                                                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                                    <CheckCircle2 className="w-10 h-10" />
                                                </div>
                                                <h2 className="text-3xl font-black text-slate-900 font-playfair">Message Received!</h2>
                                                <p className="text-slate-500 max-w-sm mx-auto">
                                                    We've received your inquiry and our team will get back to you shortly. Jai Shree Ganesh!
                                                </p>
                                                <Button
                                                    onClick={() => setSubmitted(false)}
                                                    variant="outline"
                                                    className="rounded-full border-orange-200 text-orange-600"
                                                >
                                                    Send Another Message
                                                </Button>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleSubmit} className="space-y-6">
                                                <div className="grid sm:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                                                        <Input
                                                            required
                                                            placeholder="Pandit Yatra"
                                                            className="h-12 rounded-xl bg-slate-50 border-transparent focus:border-orange-200 focus:bg-white transition-all shadow-none focus-visible:ring-orange-500"
                                                            value={formData.name}
                                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                                                        <Input
                                                            required
                                                            type="email"
                                                            placeholder="pandityatra9@gmail.com"
                                                            className="h-12 rounded-xl bg-slate-50 border-transparent focus:border-orange-200 focus:bg-white transition-all shadow-none focus-visible:ring-orange-500"
                                                            value={formData.email}
                                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-slate-700 ml-1">Subject</label>
                                                    <Input
                                                        required
                                                        placeholder="How can we help you?"
                                                        className="h-12 rounded-xl bg-slate-50 border-transparent focus:border-orange-200 focus:bg-white transition-all shadow-none focus-visible:ring-orange-500"
                                                        value={formData.subject}
                                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-slate-700 ml-1">Message</label>
                                                    <Textarea
                                                        required
                                                        placeholder="Describe your inquiry in detail..."
                                                        className="min-h-[150px] rounded-2xl bg-slate-50 border-transparent focus:border-orange-200 focus:bg-white transition-all shadow-none focus-visible:ring-orange-500 p-4"
                                                        value={formData.message}
                                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                                    />
                                                </div>

                                                <Button
                                                    disabled={loading}
                                                    type="submit"
                                                    className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-orange-600/20 transition-all active:scale-[0.98] gap-3"
                                                >
                                                    {loading ? (
                                                        <>
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                            Processing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            Send Message
                                                            <Send className="w-5 h-5 translate-y-0.5 group-hover:translate-x-1 transition-transform" />
                                                        </>
                                                    )}
                                                </Button>

                                                <p className="text-center text-xs text-slate-400 mt-4 italic">
                                                    * We respect your privacy. Your data is handled securely.
                                                </p>
                                            </form>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Contact;
