import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShoppingBag,
    Search,
    Filter,
    ShoppingCart,
    Loader2,
    Eye,
    ChevronLeft,
    ChevronRight,
    X,
    Heart,
    Image as ImageIcon,
    LayoutDashboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/useCart';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import {
    fetchSamagriItems,
    fetchSamagriCategories,
    fetchActiveBanners,
    type SamagriItem,
    type SamagriCategory
} from '@/lib/api';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ShopFilterSidebar from '@/components/shop/ShopFilterSidebar';
import { BannerCarousel } from '@/components/shop/BannerCarousel';
import heroBg from '@/assets/images/agarbati_brands.webp';

const CategoryScroll = ({ 
    categories, 
    selectedCategory, 
    onCategoryChange 
}: { 
    categories: SamagriCategory[], 
    selectedCategory: string, 
    onCategoryChange: (id: string) => void 
}) => {
    return (
        <div className="relative w-full">
            <div className="flex overflow-x-auto overflow-y-visible no-scrollbar gap-4 md:gap-6 pt-12 pb-6 px-4 -mx-4 overscroll-x-contain touch-pan-x snap-x">
            <button
                onClick={() => onCategoryChange('all')}
                className={`flex-shrink-0 flex flex-col items-center gap-2 group transition-all snap-start ${
                    selectedCategory === 'all' ? 'scale-105' : 'opacity-80 hover:opacity-100'
                }`}
            >
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] flex items-center justify-center border-2 transition-all shadow-lg ${
                    selectedCategory === 'all' 
                        ? 'border-orange-500 bg-orange-50 shadow-orange-200 rotate-3' 
                        : 'border-white bg-white group-hover:border-orange-100 group-hover:-rotate-3'
                }`}>
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white shadow-inner">
                        <ShoppingBag className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                </div>
                <span className={`text-xs md:text-sm font-bold whitespace-nowrap tracking-wide ${
                    selectedCategory === 'all' ? 'text-orange-600' : 'text-gray-500'
                }`}>
                    All Items
                </span>
            </button>

            {categories.map((cat) => (
                <button
                    key={cat.id}
                    onClick={() => onCategoryChange(cat.id.toString())}
                    className={`flex-shrink-0 flex flex-col items-center gap-2 group transition-all snap-start ${
                        selectedCategory === cat.id.toString() ? 'scale-105' : 'opacity-80 hover:opacity-100'
                    }`}
                >
                    <div className={`w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] relative transition-all overflow-hidden shadow-lg border-2 ${
                        selectedCategory === cat.id.toString()
                            ? 'border-orange-500 bg-orange-50/50 shadow-orange-200 rotate-3' 
                            : 'border-white bg-white group-hover:border-orange-100 group-hover:-rotate-3'
                    }`}>
                        {cat.image ? (
                            <img src={cat.image} alt={cat.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        ) : (
                            <div className="w-full h-full bg-orange-50 flex items-center justify-center text-orange-300">
                                <ImageIcon className="w-6 h-6 md:w-8 md:h-8" />
                            </div>
                        )}
                    </div>
                    <span className={`text-xs md:text-sm font-bold whitespace-nowrap tracking-wide ${
                        selectedCategory === cat.id.toString() ? 'text-orange-600' : 'text-gray-500'
                    }`}>
                        {cat.name}
                    </span>
                </button>
            ))}
            </div>
        </div>
    );
};

const Samagri = () => {
    const [items, setItems] = useState<SamagriItem[]>([]);
    const [categories, setCategories] = useState<SamagriCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('featured');
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 99999]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();
    const { toast } = useToast();
    const { addItem, openDrawer } = useCart();
    const { toggleFavorite, isFavorite } = useFavorites();
    const [selectedItem, setSelectedItem] = useState<SamagriItem | null>(null);
    const [hasBanners, setHasBanners] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    // Sync categories from URL
    useEffect(() => {
        if (categories.length > 0) {
            const catSlug = searchParams.get('category');
            if (catSlug) {
                const category = categories.find(c => c.slug === catSlug);
                if (category) {
                    setSelectedCategory(category.id.toString());
                } else if (catSlug === 'all') {
                    setSelectedCategory('all');
                }
            }
        }
    }, [searchParams, categories]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [itemsData, categoriesData, bannersData] = await Promise.all([
                fetchSamagriItems(),
                fetchSamagriCategories(),
                fetchActiveBanners()
            ]);
            setItems(itemsData);
            setCategories(categoriesData);
            setHasBanners(bannersData.length > 0);
        } catch (error) {
            console.error('Failed to load shop data:', error);
            toast({
                title: "Error",
                description: "Failed to load products.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Computed max price
    const maxPrice = useMemo(() => {
        if (items.length === 0) return 99999;
        return Math.ceil(Math.max(...items.map(i => Number(i.price))));
    }, [items]);

    useEffect(() => {
        if (items.length > 0) {
            setPriceRange([0, maxPrice]);
        }
    }, [maxPrice, items.length]);

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = selectedCategory === 'all' || item.category?.toString() === selectedCategory;
        const matchesPrice = Number(item.price) >= priceRange[0] && Number(item.price) <= priceRange[1];
        return matchesSearch && matchesCategory && matchesPrice;
    });

    const sortedItems = [...filteredItems].sort((a, b) => {
        switch (sortBy) {
            case 'price-asc': return a.price - b.price;
            case 'price-desc': return b.price - a.price;
            case 'name-asc': return a.name.localeCompare(b.name);
            default: return 0;
        }
    });

    const paginatedItems = sortedItems.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalPages = Math.ceil(sortedItems.length / itemsPerPage);

    const handleResetFilters = () => {
        setSelectedCategory('all');
        setSortBy('featured');
        setPriceRange([0, maxPrice]);
        setSearchQuery('');
        setSearchParams({});
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedCategory, sortBy, priceRange]);

    const handleAddToCart = (item: SamagriItem) => {
        addItem({
            id: item.id,
            title: item.name,
            price: Number(item.price),
            stock_quantity: item.stock_quantity,
            image: item.image || '/images/bhasma.png',
        });
        toast({ title: "Added to Cart", description: `${item.name} added.` });
        openDrawer();
    };

    const handleToggleFavorite = (item: SamagriItem) => {
        toggleFavorite({
            id: item.id,
            type: 'samagri',
            name: item.name,
            price: Number(item.price),
            image: item.image || undefined,
            description: item.description || undefined,
        });
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navbar />

            {/* Role Context Banner */}
            {user?.role === 'pandit' && (
                <div className="bg-orange-600 text-white py-3 px-4 shadow-md sticky top-20 z-30 animate-in slide-in-from-top duration-300">
                    <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-1.5 rounded-lg"><ShoppingBag className="w-5 h-5 flex-shrink-0" /></div>
                            <p className="text-sm font-bold tracking-tight">Shopping for Ritual Services: You are in Marketplace Mode.</p>
                        </div>
                        <Button asChild variant="outline" size="sm" className="bg-white text-orange-600 border-none hover:bg-orange-50 font-bold rounded-full h-9 px-6 transition-all shadow-sm">
                            <Link to="/pandit/dashboard">Return to Dashboard</Link>
                        </Button>
                    </div>
                </div>
            )}

            {user?.role === 'vendor' && (
                <div className="bg-blue-600 text-white py-3 px-4 shadow-md sticky top-20 z-30 animate-in slide-in-from-top duration-300">
                    <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-1.5 rounded-lg"><Eye className="w-5 h-5 flex-shrink-0" /></div>
                            <p className="text-sm font-bold tracking-tight">Marketplace Preview: Viewing how your products appear to customers.</p>
                        </div>
                        <Button asChild variant="outline" size="sm" className="bg-white text-blue-600 border-none hover:bg-blue-50 font-bold rounded-full h-9 px-6 transition-all shadow-sm">
                            <Link to="/vendor/dashboard">Manage My Shop</Link>
                        </Button>
                    </div>
                </div>
            )}

            {hasBanners ? (
                <div className="container mx-auto px-4 mt-8">
                    <BannerCarousel />
                </div>
            ) : (
                <section className="relative text-white py-24 px-4 overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <img src={heroBg} alt="Sacred Samagri" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-900/80 to-amber-900/70 backdrop-blur-[2px]" />
                    </div>
                    <div className="container mx-auto text-center max-w-3xl relative z-10">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <Badge className="bg-white/20 text-white border-none mb-4">
                                <ShoppingBag className="w-4 h-4 mr-2" /> Official Samagri Store
                            </Badge>
                            <h1 className="text-4xl md:text-5xl font-bold mb-6 font-playfair">Sacred Puja Materials</h1>
                            <p className="text-orange-100 text-lg mb-8 leading-relaxed">
                                Authentic, pure, and curated samagri kits.
                            </p>
                        </motion.div>
                    </div>
                </section>
            )}

            <div className="container mx-auto px-4 mt-8">
                <div className="relative max-w-2xl mx-auto">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                        type="text"
                        placeholder="Search for diyas, incense, complete kits..."
                        className="pl-12 h-14 bg-white rounded-2xl"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-orange-50/30 border-y border-orange-100 mt-8 mb-4">
                <div className="container mx-auto px-4">
                    <CategoryScroll 
                        categories={categories} 
                        selectedCategory={selectedCategory} 
                        onCategoryChange={(val) => {
                            setSelectedCategory(val);
                            const cat = categories.find(c => c.id.toString() === val);
                            if (cat) setSearchParams({ category: cat.slug });
                            else setSearchParams({});
                        }} 
                    />
                </div>
            </div>

            <main className="flex-1 container mx-auto py-8 px-4">
                <div className="flex flex-col lg:flex-row gap-8">
                    <ShopFilterSidebar
                        categories={categories}
                        selectedCategory={selectedCategory}
                        onCategoryChange={setSelectedCategory}
                        sortBy={sortBy}
                        onSortChange={setSortBy}
                        priceRange={priceRange}
                        onPriceRangeChange={setPriceRange}
                        maxPrice={maxPrice}
                        totalItems={sortedItems.length}
                        onReset={handleResetFilters}
                    />

                    <div className="flex-1 min-w-0">
                        {loading ? (
                            <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-orange-600" /></div>
                        ) : paginatedItems.length > 0 ? (
                            <motion.div layout className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                <AnimatePresence>
                                    {paginatedItems.map((item) => (
                                        <motion.div layout key={item.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ y: -5 }}>
                                            <Card className="h-full border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group bg-white flex flex-col rounded-xl">
                                                <div className="aspect-square bg-stone-50 relative overflow-hidden">
                                                    <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                                                        {user?.role === 'vendor' && item.vendor === user.id && (
                                                            <Badge className="bg-blue-600 text-white shadow-lg w-fit">My Listing</Badge>
                                                        )}
                                                        {item.is_approved && (
                                                            <Badge className="bg-orange-500 text-white w-fit">Verified</Badge>
                                                        )}
                                                    </div>
                                                    
                                                    {user?.role !== 'vendor' && (
                                                        <button
                                                            onClick={() => handleToggleFavorite(item)}
                                                            className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center z-10 ${
                                                                isFavorite(item.id) ? 'bg-red-500 text-white' : 'bg-white text-gray-400'
                                                            }`}
                                                        >
                                                            <Heart className={`w-4 h-4 ${isFavorite(item.id) ? 'fill-current' : ''}`} />
                                                        </button>
                                                    )}

                                                    {item.image ? (
                                                        <img src={item.image} alt={item.name} className={`absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-110 ${item.stock_quantity <= 0 ? 'grayscale opacity-60' : ''}`} />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-16 h-16 text-orange-200" /></div>
                                                    )}

                                                    {/* Out of Stock Overlay */}
                                                    {item.stock_quantity <= 0 && (
                                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
                                                            <Badge className="bg-red-600 text-white font-bold py-1 px-3 shadow-xl uppercase tracking-wider scale-110">Sold Out</Badge>
                                                        </div>
                                                    )}
                                                </div>

                                                <CardContent className="p-5 flex-1 flex flex-col">
                                                    <div className="mb-2 uppercase text-[10px] font-bold text-orange-600 tracking-wider">
                                                        {categories.find(c => c.id === item.category)?.name || 'Samagri'}
                                                    </div>
                                                    <h3 className="font-bold text-lg mb-1 line-clamp-1 group-hover:text-orange-600 transition-colors">{item.name}</h3>
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <span className="font-bold text-lg">Rs. {item.price}</span>
                                                        <span className="text-gray-400 text-sm border-l pl-2">${(item as any).price_usd}</span>
                                                    </div>

                                                    <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between gap-2">
                                                        {user?.role === 'vendor' ? (
                                                            item.vendor === user.id ? (
                                                                <Button asChild variant="outline" size="sm" className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 font-bold">
                                                                    <Link to="/vendor/dashboard">
                                                                        <LayoutDashboard className="w-4 h-4 mr-2" /> Manage
                                                                    </Link>
                                                                </Button>
                                                            ) : (
                                                                <div className="w-full text-center py-2 bg-gray-50 rounded-lg text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-center gap-2">
                                                                    <Eye size={12} /> Preview Mode
                                                                </div>
                                                            )
                                                        ) : (
                                                            <>
                                                                <Button variant="ghost" size="sm" className="text-orange-600 hover:bg-orange-50 font-bold" onClick={() => setSelectedItem(item)}>
                                                                    <Eye className="w-4 h-4 mr-2" /> Details
                                                                </Button>
                                                                {item.stock_quantity > 0 ? (
                                                                    <Button size="sm" className="bg-orange-600 text-white font-bold rounded-lg" onClick={() => handleAddToCart(item)}>
                                                                        <ShoppingCart className="w-4 h-4 mr-2" /> Add
                                                                    </Button>
                                                                ) : (
                                                                    <Button size="sm" disabled className="bg-gray-200 text-gray-400 font-bold rounded-lg cursor-not-allowed">
                                                                        Sold Out
                                                                    </Button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        ) : (
                            <div className="text-center py-20 bg-white rounded-xl border border-dashed">
                                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold mb-2">No Items Found</h3>
                                <Button variant="link" className="text-orange-600" onClick={handleResetFilters}>Clear filters</Button>
                            </div>
                        )}

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-12 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                                <Button 
                                    variant="outline" 
                                    size="icon"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="border-gray-200 text-gray-500 hover:text-orange-600 hover:border-orange-200"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>

                                <div className="flex items-center gap-1 mx-2">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`w-10 h-10 rounded-xl font-bold transition-all ${
                                                currentPage === pageNum 
                                                ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/30'
                                                : 'bg-transparent text-gray-500 hover:bg-orange-50 hover:text-orange-600'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    ))}
                                </div>

                                <Button 
                                    variant="outline" 
                                    size="icon"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="border-gray-200 text-gray-500 hover:text-orange-600 hover:border-orange-200"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />

            <AnimatePresence>
                {selectedItem && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedItem(null)} className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden flex flex-col md:flex-row">
                            <div className="md:w-1/2 bg-gray-50 relative min-h-[300px]">
                                {selectedItem.image ? <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex flex-col items-center justify-center p-12 bg-orange-50"><ShoppingBag className="w-24 h-24 text-orange-200" /></div>}
                            </div>
                            <div className="md:w-1/2 p-8 flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-3xl font-bold font-playfair">{selectedItem.name}</h2>
                                    <button onClick={() => setSelectedItem(null)}><X className="w-6 h-6 text-gray-400" /></button>
                                </div>
                                <div className="flex items-center gap-3 mb-6 p-4 bg-orange-50/50 rounded-2xl">
                                    <span className="text-3xl font-bold text-orange-600">Rs. {selectedItem.price}</span>
                                    <span className="text-xl font-medium text-gray-400 border-l pl-3">${(selectedItem as any).price_usd}</span>
                                </div>
                                <p className="text-gray-600 mb-6 flex-1">{selectedItem.description || "Authentic puja samagri."}</p>
                                
                                {user?.role === 'vendor' ? (
                                    <div className="w-full py-4 text-center bg-gray-100 rounded-2xl text-gray-400 font-bold">Action Restricted for Vendors</div>
                                ) : selectedItem.stock_quantity > 0 ? (
                                    <Button onClick={() => { handleAddToCart(selectedItem); setSelectedItem(null); }} className="w-full h-14 bg-orange-600 text-white font-bold rounded-2xl gap-3">
                                        <ShoppingCart className="w-6 h-6" /> Add to Cart
                                    </Button>
                                ) : (
                                    <div className="w-full py-4 text-center bg-red-50 text-red-600 rounded-2xl font-bold flex items-center justify-center gap-2 border border-red-100 shadow-sm">
                                        <X className="w-5 h-5" /> Currently Out of Stock
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Samagri;
