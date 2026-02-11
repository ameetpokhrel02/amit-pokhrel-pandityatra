import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { type SamagriCategory } from '@/lib/api';
import * as LucideIcons from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MegaMenuProps {
    categories: SamagriCategory[];
    isOpen: boolean;
    onClose: () => void;
}

const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3,
            staggerChildren: 0.05
        }
    },
    exit: {
        opacity: 0,
        y: -10,
        transition: { duration: 0.2 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
};

const MegaMenu: React.FC<MegaMenuProps> = ({ categories, isOpen, onClose }) => {
    const { t } = useTranslation();
    if (!isOpen) return null;

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-white/20 dark:border-gray-800/50 overflow-hidden rounded-[2.5rem] ring-1 ring-black/5 dark:ring-white/5"
            onMouseEnter={(e) => e.stopPropagation()}
            style={{ minHeight: '350px', width: '900px', position: 'absolute', top: 'calc(100% + 1px)', left: '50%', transform: 'translateX(-50%)', zIndex: 100, pointerEvents: 'auto' }}
        >
            <div className="container mx-auto px-10 py-12">
                <div className="flex gap-14">
                    {/* Main Categories Section */}
                    <div className="flex-1">
                        <motion.h2
                            variants={itemVariants}
                            className="text-2xl font-playfair font-black text-gray-900 dark:text-white mb-10 flex items-center gap-3"
                        >
                            <div className="p-2 bg-orange-100 dark:bg-orange-950/30 rounded-lg">
                                <LucideIcons.ShoppingBag className="w-6 h-6 text-orange-600" />
                            </div>
                            {t('shop_by_category')}
                        </motion.h2>

                        <div className="grid grid-cols-2 gap-x-10 gap-y-10">
                            {categories.filter(c => c.is_active).map((category) => {
                                const IconComponent = (LucideIcons as any)[category.icon || 'Flower2'] || LucideIcons.Flower2;

                                return (
                                    <motion.div key={category.id} variants={itemVariants}>
                                        <Link
                                            to={`/shop/samagri?category=${category.slug}`}
                                            onClick={onClose}
                                            className="group block"
                                        >
                                            <div className="flex items-center gap-5 p-2 rounded-2xl transition-all duration-300">
                                                <div className="w-16 h-16 shrink-0 rounded-2xl bg-white dark:bg-gray-800/50 shadow-[0_8px_16px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-gray-700/50 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-110 group-hover:bg-orange-600 group-hover:text-white group-hover:shadow-orange-200 dark:group-hover:shadow-none transition-all duration-500 overflow-hidden">
                                                    {category.image ? (
                                                        <img src={category.image} alt={category.name} className="w-full h-full object-cover p-2" />
                                                    ) : (
                                                        <IconComponent className="w-8 h-8" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 group-hover:text-orange-600 transition-colors">
                                                        {t(`categories.${category.slug}.name`, category.name)}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-1 font-medium leading-relaxed opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                                                        {t(`categories.${category.slug}.desc`, category.description || t('samagri_desc'))}
                                                    </p>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Featured/Promo Section */}
                    <motion.div variants={itemVariants} className="w-80 shrink-0 hidden lg:block">
                        <div className="h-full bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 rounded-[2rem] p-8 text-white relative overflow-hidden group shadow-2xl shadow-orange-200 dark:shadow-none">
                            <div className="relative z-10 h-full flex flex-col">
                                <span className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] w-fit border border-white/10">{t('featured')}</span>
                                <h4 className="text-3xl font-playfair font-black mt-6 leading-[1.15]">
                                    {t('categories.brass-murti.name', 'Authentic Brass Murti Collection')}
                                </h4>
                                <p className="text-sm text-orange-50/90 mt-4 font-medium leading-relaxed">
                                    {t('categories.brass-murti.desc', 'Divine craftsmanship for your home temple.')}
                                </p>
                                <div className="mt-auto pt-8">
                                    <Link
                                        to="/shop/samagri?category=brass-murti"
                                        onClick={onClose}
                                        className="inline-flex items-center gap-3 bg-white text-orange-600 px-7 py-4 rounded-xl font-black text-sm hover:bg-orange-50 transition-all hover:gap-5 shadow-xl active:scale-95"
                                    >
                                        {t('book_now')} <LucideIcons.ArrowRight className="w-5 h-5" />
                                    </Link>
                                </div>
                            </div>

                            {/* Decorative elements */}
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-1000" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-3xl -ml-20 -mb-20 group-hover:scale-150 transition-transform duration-1000" />
                            <LucideIcons.Sparkles className="absolute top-10 right-10 w-12 h-12 opacity-20 animate-pulse" />
                            <LucideIcons.Gem className="absolute -bottom-10 -right-10 w-48 h-48 opacity-10 rotate-[25deg] group-hover:rotate-0 transition-all duration-1000 group-hover:scale-110" />
                        </div>
                    </motion.div>
                </div>

                {/* Footer info */}
                <motion.div
                    variants={itemVariants}
                    className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800/50 flex items-center justify-between"
                >
                    <div className="flex items-center gap-10">
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">
                            <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center">
                                <LucideIcons.Truck className="w-4 h-4 text-orange-600" />
                            </div>
                            {t('next_day_delivery')}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">
                            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center">
                                <LucideIcons.ShieldCheck className="w-4 h-4 text-emerald-600" />
                            </div>
                            {t('spiritual_purity')}
                        </div>
                    </div>
                    <Link
                        to="/shop/samagri"
                        onClick={onClose}
                        className="text-sm font-black text-orange-600 hover:text-orange-700 flex items-center gap-2 group p-2 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/10 transition-colors"
                    >
                        {t('explore_all')}
                        <LucideIcons.ChevronRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                    </Link>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default MegaMenu;
