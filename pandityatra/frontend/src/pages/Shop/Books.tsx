import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Book,
    Search,
    Filter,
    ShoppingCart,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Eye,
    X,
    ShoppingBag,
    Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/useCart';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import {
    fetchSamagriItems,
    fetchSamagriCategories,
    type SamagriItem,
    type SamagriCategory
} from '@/lib/api';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ShopFilterSidebar from '@/components/shop/ShopFilterSidebar';
import { BannerCarousel } from '@/components/shop/BannerCarousel';
import { fetchActiveBanners } from '@/lib/api';

const Books = () => {
    const [books, setBooks] = useState<SamagriItem[]>([]);
    const [categories, setCategories] = useState<SamagriCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<string>('featured');
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 99999]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const { toast } = useToast();
    const { addItem, openDrawer } = useCart();
    const { toggleFavorite, isFavorite } = useFavorites();
    const [selectedBook, setSelectedBook] = useState<SamagriItem | null>(null);
    const { user } = useAuth();
    const [hasBanners, setHasBanners] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [itemsData, categoriesData, bannersData] = await Promise.all([
                fetchSamagriItems(),
                fetchSamagriCategories(),
                fetchActiveBanners()
            ]);

            setHasBanners(bannersData.length > 0);

            // Find the "Book" or "Books" category
            const bookCategory = categoriesData.find(c => 
                c.name.toLowerCase() === 'book' || c.name.toLowerCase() === 'books'
            );

            if (bookCategory) {
                // Filter items that belong to the "Book" category
                const bookItems = itemsData.filter(item => item.category === bookCategory.id);
                setBooks(bookItems);
            } else {
                setBooks([]);
            }

            setCategories(categoriesData);
        } catch (error) {
            console.error('Failed to load books:', error);
            toast({
                title: "Error",
                description: "Failed to load books. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Computed max price
    const maxPrice = useMemo(() => {
        if (books.length === 0) return 99999;
        return Math.ceil(Math.max(...books.map(i => Number(i.price))));
    }, [books]);

    // Initialize price range once data loads
    useEffect(() => {
        if (books.length > 0) {
            setPriceRange([0, maxPrice]);
        }
    }, [maxPrice, books.length]);

    // Processing Data
    const filteredItems = books.filter(item => {
        const term = searchQuery.toLowerCase();
        const matchesSearch = item.name.toLowerCase().includes(term) || (item.description && item.description.toLowerCase().includes(term));
        const matchesPrice = Number(item.price) >= priceRange[0] && Number(item.price) <= priceRange[1];
        return matchesSearch && matchesPrice;
    });

    const sortedItems = [...filteredItems].sort((a, b) => {
        switch (sortBy) {
            case 'price-asc': return a.price - b.price;
            case 'price-desc': return b.price - a.price;
            case 'name-asc': return a.name.localeCompare(b.name);
            default: return 0;
        }
    });

    const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
    const paginatedItems = sortedItems.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset filters helper
    const handleResetFilters = () => {
        setSortBy('featured');
        setPriceRange([0, maxPrice]);
        setSearchQuery('');
    };

    useEffect(() => { setCurrentPage(1); }, [searchQuery, sortBy, priceRange]);

    const handleAddToCart = (book: SamagriItem) => {
        addItem({
            id: book.id,
            title: book.name,
            price: Number(book.price),
            image: book.image || '/images/bhasma.png',
        });
        toast({
            title: "Added to Cart",
            description: `${book.name} has been added to your cart.`,
        });
        openDrawer();
    };

    const handleToggleFavorite = (book: SamagriItem) => {
        toggleFavorite({
            id: book.id,
            type: 'samagri',
            name: book.name,
            price: Number(book.price),
            image: book.image || undefined,
            description: book.description || undefined,
        });

        const isNowFavorite = !isFavorite(book.id);
        toast({
            title: isNowFavorite ? "❤️ Added to Favorites" : "Removed from Favorites",
            description: isNowFavorite
                ? `${book.name} has been added to your favorites.`
                : `${book.name} has been removed from your favorites.`,
            className: isNowFavorite
                ? "bg-pink-600 text-white border-none shadow-2xl"
                : "bg-gray-600 text-white border-none shadow-2xl"
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
                            <p className="text-sm font-bold tracking-tight">Spiritual Repository: You are in Marketplace Mode.</p>
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

            {/* Hero Section / Banner Carousel */}
            {hasBanners ? (
                <div className="container mx-auto px-4 mt-8">
                    <BannerCarousel />
                </div>
            ) : (
                <section className="bg-gradient-to-r from-orange-600 to-amber-600 text-white py-20 px-4">
                    <div className="container mx-auto text-center max-w-3xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <Badge className="bg-white/20 text-white hover:bg-white/30 border-none mb-4 uppercase tracking-wider">
                                <Book className="w-4 h-4 mr-2" />
                                Sacred Library
                            </Badge>
                            <h1 className="text-4xl md:text-5xl font-bold mb-6 font-playfair">
                                Spiritual Wisdom
                            </h1>
                            <p className="text-orange-100 text-lg mb-8 leading-relaxed">
                                Explore timeless scriptures, epics, and spiritual guides.
                                Nourish your soul with divine knowledge.
                            </p>
                        </motion.div>
                    </div>
                </section>
            )}

            {/* Global Search Bar (moved below hero) */}
            <div className="container mx-auto px-4 mt-8">
                <div className="relative max-w-2xl mx-auto">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                        type="text"
                        placeholder="Search for Gita, Ramayana, etc..."
                        className="pl-12 h-14 bg-white text-gray-900 border border-orange-100 shadow-lg hover:shadow-orange-200/50 transition-shadow rounded-2xl focus-visible:ring-orange-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <main className="flex-1 container mx-auto py-12 px-4">

                {/* Desktop: Sidebar + Grid */}
                <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">

                {/* Desktop Sidebar */}
                <ShopFilterSidebar
                    categories={[]}
                    selectedCategory="all"
                    onCategoryChange={() => {}}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    priceRange={priceRange}
                    onPriceRangeChange={setPriceRange}
                    maxPrice={maxPrice}
                    totalItems={sortedItems.length}
                    onReset={handleResetFilters}
                    sortOptions={[
                        { value: 'featured', label: 'Featured' },
                        { value: 'price-asc', label: 'Price: Low → High' },
                        { value: 'price-desc', label: 'Price: High → Low' },
                        { value: 'name-asc', label: 'Title: A → Z' },
                    ]}
                />

                {/* Grid */}
                <div className="flex-1 min-w-0">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-orange-600" />
                    </div>
                ) : paginatedItems.length > 0 ? (
                    <motion.div
                        layout
                        className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        <AnimatePresence mode='popLayout'>
                            {paginatedItems.map((book) => (
                                <motion.div
                                    layout
                                    key={book.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    whileHover={{ y: -5 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Card className="h-full border border-stone-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group bg-white flex flex-col rounded-xl">
                                        <div className="aspect-square bg-stone-50 relative overflow-hidden">
                                            {/* Favorite Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleFavorite(book);
                                                }}
                                                className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center z-10 transition-all duration-200 ${
                                                    isFavorite(book.id)
                                                        ? 'bg-red-500 text-white shadow-lg shadow-red-200'
                                                        : 'bg-white/90 text-gray-400 hover:text-red-500 hover:bg-white shadow-md'
                                                }`}
                                                title={isFavorite(book.id) ? 'Remove from favorites' : 'Add to favorites'}
                                            >
                                                <Heart className={`w-4 h-4 ${isFavorite(book.id) ? 'fill-current' : ''}`} />
                                            </button>

                                            {book.image ? (
                                                <img
                                                    src={book.image}
                                                    alt={book.name}
                                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                />
                                            ) : (
                                                <div className="w-3/4 h-full bg-orange-800 rounded-r-md shadow-lg border-l-4 border-orange-900 flex flex-col items-center justify-center p-2 text-center">
                                                    <div className="border border-orange-400/30 w-full h-full p-2 flex flex-col items-center justify-center">
                                                        <Book className="text-orange-200 w-8 h-8 mb-2" />
                                                        <span className="text-orange-50 font-serif text-xs line-clamp-3">{book.name}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {book.stock_quantity === 0 && (
                                                <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                                                    <Badge variant="destructive">Out of Stock</Badge>
                                                </div>
                                            )}
                                        </div>

                                        <CardContent className="p-5 flex-1 flex flex-col">
                                            <div className="mb-2">
                                                <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                                                    {categories.find(c => c.id === book.category)?.name || 'Book'}
                                                </span>
                                            </div>

                                            <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2 group-hover:text-orange-600 transition-colors">
                                                {book.name}
                                            </h3>

                                            <div className="mt-auto pt-4 border-t border-gray-50 flex flex-col gap-3">
                                                <div className="flex flex-col mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg font-bold text-orange-700">
                                                            Rs. {book.price}
                                                        </span>
                                                        <span className="text-sm font-medium text-gray-400 border-l border-gray-200 pl-2">
                                                            ${(book as any).price_usd}
                                                        </span>
                                                    </div>
                                                    {book.stock_quantity < 5 && book.stock_quantity > 0 && (
                                                        <span className="text-[10px] text-red-500 font-bold animate-pulse uppercase mt-1">
                                                            Only {book.stock_quantity} Left!
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    {user?.role === 'vendor' ? (
                                                        <div className="col-span-2 w-full text-center py-2 bg-gray-50 rounded-lg text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-center gap-2">
                                                            <Eye size={12} /> Preview Mode
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <Button
                                                                onClick={() => handleAddToCart(book)}
                                                                disabled={book.stock_quantity === 0}
                                                                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium h-9 text-xs"
                                                            >
                                                                <ShoppingCart className="w-3 h-3 mr-2" /> Add
                                                            </Button>
                                                            <Button
                                                                variant="secondary"
                                                                onClick={() => setSelectedBook(book)}
                                                                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium h-9 text-xs"
                                                            >
                                                                <Eye className="w-3 h-3 mr-2" /> View
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed">
                        <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Books Found</h3>
                        <p className="text-gray-500">The sacred collection is currently being refreshed. Please check back soon.</p>
                        <Button
                            variant="link"
                            className="mt-4 text-orange-600"
                            onClick={loadData}
                        >
                            Refresh Collection
                        </Button>
                    </div>
                )}

                {/* Pagination Controls */}
                {sortedItems.length > itemsPerPage && (
                    <div className="flex justify-center items-center mt-12 gap-2">
                        <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                            disabled={currentPage === 1}
                            className="rounded-xl border-gray-200 text-gray-400 hover:text-orange-600 hover:border-orange-200 transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        
                        <div className="flex items-center gap-2">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    variant={currentPage === page ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-10 h-10 rounded-xl font-bold transition-all duration-300 ${
                                        currentPage === page 
                                            ? "bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20" 
                                            : "border-gray-200 text-gray-500 hover:border-orange-200 hover:text-orange-600"
                                    }`}
                                >
                                    {page}
                                </Button>
                            ))}
                        </div>

                        <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                            disabled={currentPage === totalPages}
                            className="rounded-xl border-gray-200 text-gray-400 hover:text-orange-600 hover:border-orange-200 transition-all"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                )}
                </div>{/* end flex-1 min-w-0 */}
                </div>{/* end flex gap-8 */}
            </main>

            <Footer />

            {/* Book Details Modal */}
            <AnimatePresence>
                {selectedBook && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedBook(null)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col md:flex-row"
                        >
                            {/* Product Image */}
                            <div className="md:w-1/2 bg-gray-50 relative overflow-hidden min-h-[300px] md:min-h-full">
                                <button
                                    onClick={() => setSelectedBook(null)}
                                    className="absolute top-4 left-4 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg hover:bg-white transition-all z-10 md:hidden"
                                >
                                    <X className="w-5 h-5 text-gray-600" />
                                </button>

                                {selectedBook.image ? (
                                    <img
                                        src={selectedBook.image}
                                        alt={selectedBook.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-orange-800 to-orange-950 flex flex-col items-center justify-center p-8 text-center text-white">
                                        <Book className="w-20 h-20 mb-4 text-orange-200/50" />
                                        <h3 className="font-serif text-2xl mb-2">{selectedBook.name}</h3>
                                        <p className="text-orange-200/70 text-sm font-medium">Sacred Collection</p>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                            </div>

                            {/* Product Details */}
                            <div className="md:w-1/2 p-8 flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <Badge className="bg-orange-100 text-orange-600 hover:bg-orange-100 border-none mb-2">
                                            {categories.find(c => c.id === selectedBook.category)?.name || 'Book'}
                                        </Badge>
                                        <h2 className="text-3xl font-bold text-gray-900 font-playfair">{selectedBook.name}</h2>
                                    </div>
                                    <button
                                        onClick={() => setSelectedBook(null)}
                                        className="hidden md:block p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <X className="w-6 h-6 text-gray-400" />
                                    </button>
                                </div>

                                <div className="flex items-center gap-3 mb-6">
                                            <div className="flex items-center gap-3 mb-6 p-4 bg-orange-50/50 rounded-2xl border border-orange-100/50">
                                                <span className="text-3xl font-bold text-orange-600">
                                                    Rs. {selectedBook.price}
                                                </span>
                                                <span className="text-xl font-medium text-gray-400 border-l border-orange-200 pl-3">
                                                    ${(selectedBook as any).price_usd}
                                                </span>
                                            </div>
                                    {selectedBook.stock_quantity > 0 ? (
                                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                            In Stock ({selectedBook.stock_quantity})
                                        </Badge>
                                    ) : (
                                        <Badge variant="destructive">Out of Stock</Badge>
                                    )}
                                </div>

                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Description</h4>
                                    <p className="text-gray-600 leading-relaxed mb-6">
                                        {selectedBook.description || "Divine spiritual wisdom for your sacred journey."}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        {user?.role === 'vendor' ? (
                                            <div className="col-span-2 w-full py-4 text-center bg-gray-100 rounded-2xl text-gray-400 font-bold">Action Restricted for Vendors</div>
                                        ) : (
                                            <>
                                                <Button
                                                    onClick={() => { handleAddToCart(selectedBook); setSelectedBook(null); }}
                                                    disabled={selectedBook.stock_quantity === 0}
                                                    className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-xl shadow-orange-600/20 gap-2"
                                                >
                                                    <ShoppingCart className="w-5 h-5" /> Add
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => handleToggleFavorite(selectedBook)}
                                                    className={`w-full h-12 rounded-xl border ${isFavorite(selectedBook.id)
                                                        ? 'border-red-300 text-red-600 bg-red-50 hover:bg-red-100'
                                                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                                                >
                                                    <Heart className={`w-5 h-5 mr-2 ${isFavorite(selectedBook.id) ? 'fill-current' : ''}`} />
                                                    {isFavorite(selectedBook.id) ? 'Saved' : 'Wishlist'}
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                    <p className="text-center text-xs text-gray-400 italic">
                                        Pure knowledge delivered to your doorstep.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Books;
