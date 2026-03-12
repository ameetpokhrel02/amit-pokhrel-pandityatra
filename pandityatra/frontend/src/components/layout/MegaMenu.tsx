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
    hidden: { opacity: 0, y: 10, scale: 0.98 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.2,
            ease: 'easeOut',
            staggerChildren: 0.03
        }
    },
    exit: {
        opacity: 0,
        y: 5,
        scale: 0.98,
        transition: { duration: 0.15 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.2 } }
};

// Default categories with images if no data from API
const defaultCategories = [
    {
        id: 1,
        name: 'Puja Essentials',
        slug: 'puja-essentials',
        description: 'Agarbatti, Dhoop, Camphor & more',
        image: '/images/puja1.svg',
        icon: 'Flame',
        is_active: true
    },
    {
        id: 2,
        name: 'Brass Murtis',
        slug: 'brass-murti',
        description: 'Divine idols & sacred statues',
        image: '/images/puja1.svg',
        icon: 'Crown',
        is_active: true
    },
    {
        id: 3,
        name: 'Holy Books',
        slug: 'holy-books',
        description: 'Scriptures, Granths & Paaths',
        image: '/images/puja1.svg',
        icon: 'BookOpen',
        is_active: true
    },
    {
        id: 4,
        name: 'Puja Thalis',
        slug: 'puja-thalis',
        description: 'Complete thali sets & accessories',
        image: '/images/puja1.svg',
        icon: 'CircleDot',
        is_active: true
    },
    {
        id: 5,
        name: 'Festival Special',
        slug: 'festival-special',
        description: 'Seasonal & festival items',
        image: '/images/puja1.svg',
        icon: 'Sparkles',
        is_active: true
    },
    {
        id: 6,
        name: 'Rudraksha & Malas',
        slug: 'rudraksha-malas',
        description: 'Authentic beads & prayer malas',
        image: '/images/puja1.svg',
        icon: 'Gem',
        is_active: true
    }
];

const MegaMenu: React.FC<MegaMenuProps> = ({ categories, isOpen, onClose }) => {
    const { t } = useTranslation();
    if (!isOpen) return null;

    // Use API categories if available, otherwise use defaults
    const displayCategories = categories.length > 0 ? categories : defaultCategories;
    const activeCategories = displayCategories.filter(c => c.is_active).slice(0, 6);

    // Split into two columns
    const leftColumn = activeCategories.slice(0, 3);
    const rightColumn = activeCategories.slice(3, 6);

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white dark:bg-gray-900 shadow-2xl border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden"
            onMouseEnter={(e) => e.stopPropagation()}
            style={{ 
                width: '580px', 
                position: 'relative',
                zIndex: 100, 
                pointerEvents: 'auto' 
            }}
        >
            {/* Subtle top border accent */}
            <div className="h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400" />
            
            <div className="p-6">
                {/* Two Column Grid */}
                <div className="grid grid-cols-2 gap-x-8">
                    {/* Left Column */}
                    <div className="space-y-1">
                        {leftColumn.map((category) => {
                            const IconComponent = (LucideIcons as any)[category.icon || 'Flower2'] || LucideIcons.Flower2;
                            
                            return (
                                <motion.div key={category.id} variants={itemVariants}>
                                    <Link
                                        to={`/shop/samagri?category=${category.slug}`}
                                        onClick={onClose}
                                        className="group flex items-center gap-4 p-3 rounded-xl hover:bg-orange-50/80 dark:hover:bg-orange-950/20 transition-all duration-200"
                                    >
                                        {/* Category Image/Icon */}
                                        <div className="w-12 h-12 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:border-orange-200 dark:group-hover:border-orange-800 transition-colors">
                                            {category.image ? (
                                                <img 
                                                    src={category.image} 
                                                    alt={category.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <IconComponent className="w-6 h-6 text-orange-500 group-hover:scale-110 transition-transform" />
                                            )}
                                        </div>
                                        
                                        {/* Text Content */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-orange-600 transition-colors text-sm">
                                                {t(`categories.${category.slug}.name`, category.name)}
                                            </h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                                {t(`categories.${category.slug}.desc`, category.description || 'Shop now')}
                                            </p>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-1">
                        {rightColumn.map((category) => {
                            const IconComponent = (LucideIcons as any)[category.icon || 'Flower2'] || LucideIcons.Flower2;
                            
                            return (
                                <motion.div key={category.id} variants={itemVariants}>
                                    <Link
                                        to={`/shop/samagri?category=${category.slug}`}
                                        onClick={onClose}
                                        className="group flex items-center gap-4 p-3 rounded-xl hover:bg-orange-50/80 dark:hover:bg-orange-950/20 transition-all duration-200"
                                    >
                                        {/* Category Image/Icon */}
                                        <div className="w-12 h-12 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:border-orange-200 dark:group-hover:border-orange-800 transition-colors">
                                            {category.image ? (
                                                <img 
                                                    src={category.image} 
                                                    alt={category.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <IconComponent className="w-6 h-6 text-orange-500 group-hover:scale-110 transition-transform" />
                                            )}
                                        </div>
                                        
                                        {/* Text Content */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-orange-600 transition-colors text-sm">
                                                {t(`categories.${category.slug}.name`, category.name)}
                                            </h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                                {t(`categories.${category.slug}.desc`, category.description || 'Shop now')}
                                            </p>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer - View All */}
                <motion.div 
                    variants={itemVariants}
                    className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800"
                >
                    <Link
                        to="/shop/samagri"
                        onClick={onClose}
                        className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20 hover:from-orange-100 hover:to-amber-100 dark:hover:from-orange-950/50 dark:hover:to-amber-950/40 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
                                <LucideIcons.ShoppingBag className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{t('explore_all', 'View All Products')}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{t('browse_complete_collection', 'Browse our complete collection')}</p>
                            </div>
                        </div>
                        <LucideIcons.ArrowRight className="w-5 h-5 text-orange-500 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default MegaMenu;
