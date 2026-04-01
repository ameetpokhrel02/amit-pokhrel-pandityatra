import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, ShieldCheck, ShoppingBag, Banknote, AlertCircle, ArrowLeft } from 'lucide-react';

const VendorTerms: React.FC = () => {
    const navigate = useNavigate();

    const sections = [
        {
            title: "1. Vendor Eligibility",
            icon: <ShieldCheck className="w-5 h-5 text-orange-600" />,
            content: "To register as a vendor on PanditYatra, you must be a legally registered business or a qualified individual providing authentic puja samagri or related products. All vendors are subject to a mandatory verification process by our admin team."
        },
        {
            title: "2. Product Listings & Quality",
            icon: <ShoppingBag className="w-5 h-5 text-orange-600" />,
            content: "Vendors are responsible for the accuracy of their product descriptions, images, and pricing. Specifically, items must be genuine, high-quality, and suitable for religious purposes. Prohibited items will be removed immediately, and repeated violations may lead to account suspension."
        },
        {
            title: "3. Commission & Payments",
            icon: <Banknote className="w-5 h-5 text-orange-600" />,
            content: "PanditYatra charges a standard commission of 10% on every successful sale. Payouts are processed upon request, provided the minimum threshold is met and all related orders have been successfully delivered to the customer."
        },
        {
            title: "4. Shipping & Fulfillment",
            icon: <AlertCircle className="w-5 h-5 text-orange-600" />,
            content: "Vendors are responsible for packing and shipping orders within 48 hours of confirmation. You must provide valid tracking information through the Vendor Dashboard. Delayed or unfulfilled orders negatively impact your vendor rating."
        },
        {
            title: "5. Termination",
            icon: <FileText className="w-5 h-5 text-orange-600" />,
            content: "PanditYatra reserves the right to terminate vendor accounts found engaging in fraudulent activities, selling sub-standard products, or providing poor customer service. Upon termination, any pending balances will be settled after resolving outstanding customer disputes."
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
            >
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Vendor Terms & Conditions</h1>
                        <p className="text-gray-500 mt-1">Last updated: April 1, 2026</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                    <div className="p-8 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-center">
                        <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-90" />
                        <h2 className="text-2xl font-semibold">Join the PanditYatra Marketplace</h2>
                        <p className="opacity-80 max-w-lg mx-auto mt-2">Please review our seller agreement before proceeding with your registration.</p>
                    </div>

                    <ScrollArea className="h-[500px] p-8">
                        <div className="space-y-10">
                            {sections.map((section, index) => (
                                <motion.section
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="relative pl-8"
                                >
                                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                        {section.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">{section.title}</h3>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">
                                        {section.content}
                                    </p>
                                </motion.section>
                            ))}
                        </div>
                    </ScrollArea>

                    <div className="p-8 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3 text-sm text-gray-500 italic">
                            <ShieldCheck className="w-5 h-5 text-green-500" />
                            Secure Merchant Agreement
                        </div>
                        <Button
                            onClick={() => navigate('/vendor/register')}
                            className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-8 h-12 text-lg font-medium shadow-lg shadow-orange-600/20"
                        >
                            I Agree & Continue
                        </Button>
                    </div>
                </div>

                <p className="text-center mt-8 text-gray-400 text-sm">
                    By clicking "I Agree", you acknowledge that you have read and understood the seller terms of PanditYatra.
                </p>
            </motion.div>
        </div>
    );
};

export default VendorTerms;
