import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ShoppingBag, Book, ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ShopByCategory: React.FC = () => {
    const { t } = useTranslation();
    const categories = [
        {
            id: 'samagri',
            title: t('puja_samagri'),
            description: t('samagri_desc'),
            icon: <ShoppingBag className="w-8 h-8" />,
            image: '/src/assets/images/religious.png',
            link: '/shop/samagri',
            color: 'from-orange-500 to-amber-600',
            tag: 'Essentials'
        },
        {
            id: 'books',
            title: t('spiritual_books'),
            description: t('books_desc'),
            icon: <Book className="w-8 h-8" />,
            image: '/src/assets/images/book now.webp',
            link: '/shop/books',
            color: 'from-amber-700 to-orange-800',
            tag: 'Wisdom'
        }
    ];

    return (
        <section className="py-20 bg-white overflow-hidden">
            <div className="container mx-auto px-4">
                {/* Section Header - Centered */}
                <div className="flex flex-col items-center text-center mb-16 max-w-3xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100/80 text-orange-600 text-sm font-bold mb-6 border border-orange-200"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>{t('sacred_collections')}</span>
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 font-playfair leading-tight mb-6"
                    >
                        {t('home:shop_by', 'Shop by')} <span className="text-orange-600 relative inline-block">
                            {t('home:category', 'Category')}
                            <span className="absolute -bottom-2 left-0 w-full h-1 bg-orange-200 rounded-full" />
                        </span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-500 text-lg md:text-xl max-w-xl"
                    >
                        {t('shop_subtitle')}
                    </motion.p>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    {categories.map((cat, index) => (
                        <motion.div
                            key={cat.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.2 }}
                        >
                            <Link to={cat.link} className="block group">
                                <Card className="relative h-[320px] md:h-[400px] overflow-hidden border-none shadow-2xl group-hover:shadow-orange-200/50 transition-all duration-500 rounded-[2.5rem]">
                                    {/* Background Image with Overlay */}
                                    <div className="absolute inset-0">
                                        <img
                                            src={cat.image}
                                            alt={cat.title}
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                        />
                                        <div className={`absolute inset-0 bg-gradient-to-r ${cat.color} opacity-85 group-hover:opacity-90 transition-opacity duration-500`} />
                                    </div>

                                    <CardContent className="relative h-full p-10 flex flex-col justify-between text-white z-10">
                                        <div>
                                            <Badge className="bg-white/20 hover:bg-white/30 text-white border-none mb-6 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
                                                {cat.tag}
                                            </Badge>
                                            <div className="mb-6 bg-white/10 w-20 h-20 rounded-[1.5rem] flex items-center justify-center backdrop-blur-md border border-white/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl">
                                                {cat.icon}
                                            </div>
                                            <h3 className="text-4xl font-bold mb-4 font-playfair tracking-tight group-hover:text-amber-200 transition-colors">
                                                {cat.title}
                                            </h3>
                                            <p className="text-white/90 max-w-xs text-xl leading-relaxed font-medium">
                                                {cat.description}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3 font-bold text-xl group-hover:gap-5 transition-all text-amber-100">
                                            <span className="underline underline-offset-8 decoration-white/30 group-hover:decoration-amber-300">{t('browse_now')}</span>
                                            <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                                        </div>
                                    </CardContent>

                                    {/* Decorative Elements */}
                                    <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl opacity-50" />
                                    <div className="absolute -top-12 -left-12 w-32 h-32 bg-orange-400/20 rounded-full blur-2xl opacity-50" />
                                </Card>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom CTA - Centered */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex justify-center"
                >
                    <Button
                        asChild
                        size="lg"
                        className="rounded-full h-14 px-10 bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg shadow-xl hover:shadow-orange-500/20 hover:scale-105 transition-all gap-3 overflow-hidden group"
                    >
                        <Link to="/shop/samagri">
                            <span className="relative z-10">{t('explore_full_shop')}</span>
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:rotate-45 transition-transform duration-300">
                                <ArrowRight className="w-4 h-4" />
                            </div>
                        </Link>
                    </Button>
                </motion.div>
            </div>
        </section>
    );
};

export default ShopByCategory;
