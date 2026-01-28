import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShoppingBag,
    Search,
    Filter,
    ShoppingCart,
    Plus,
    Loader2,
    ArrowUp,
    Eye,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    Star,
    X
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/useCart';
import {
    fetchSamagriItems,
    fetchSamagriCategories,
    type SamagriItem,
    type SamagriCategory
} from '@/lib/api';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const Samagri = () => {
    const [items, setItems] = useState<SamagriItem[]>([]);
    const [categories, setCategories] = useState<SamagriCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('featured');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const { toast } = useToast();
    const { addItem, openDrawer } = useCart();
    const [selectedItem, setSelectedItem] = useState<SamagriItem | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [itemsData, categoriesData] = await Promise.all([
                fetchSamagriItems(),
                fetchSamagriCategories()
            ]);
            setItems(itemsData);
            setCategories(categoriesData);
        } catch (error) {
            console.error('Failed to load shop data:', error);
            toast({
                title: "Error",
                description: "Failed to load products. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Filtering
    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || item.category?.toString() === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Sorting
    const sortedItems = [...filteredItems].sort((a, b) => {
        switch (sortBy) {
            case 'price-asc': return a.price - b.price;
            case 'price-desc': return b.price - a.price;
            case 'name-asc': return a.name.localeCompare(b.name);
            default: return 0; // featured
        }
    });

    // Pagination
    const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
    const paginatedItems = sortedItems.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedCategory, sortBy]);

    const handleAddToCart = (item: SamagriItem) => {
        addItem({
            id: item.id,
            title: item.name,
            price: Number(item.price),
            image: item.image || '/images/bhasma.png', // Fallback image if null
        });
        toast({
            title: "Added to Cart",
            description: `${item.name} has been added to your cart.`,
            className: "bg-green-600 text-white border-green-700 shadow-lg"
        });
        openDrawer();
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />

            {/* Hero Section */}
            <section className="bg-gradient-to-r from-orange-600 to-amber-600 text-white py-20 px-4">
                <div className="container mx-auto text-center max-w-3xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <Badge className="bg-white/20 text-white hover:bg-white/30 border-none mb-4">
                            <ShoppingBag className="w-4 h-4 mr-2" />
                            Official Samagri Store
                        </Badge>
                        <h1 className="text-4xl md:text-5xl font-bold mb-6 font-playfair">
                            Sacred Puja Materials
                        </h1>
                        <p className="text-orange-100 text-lg mb-8 leading-relaxed">
                            Authentic, pure, and curated samagri kits delivered to your doorstep.
                            Everything you need for a divine ceremony.
                        </p>

                        <div className="relative max-w-lg mx-auto">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <Input
                                type="text"
                                placeholder="Search for diyas, incense, complete kits..."
                                className="pl-10 h-12 bg-white text-gray-900 border-none shadow-xl rounded-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </motion.div>
                </div>
            </section>

            <main className="flex-1 container mx-auto py-12 px-4">
                {/* Category Filters */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                    <Tabs defaultValue="all" className="w-full md:w-auto" onValueChange={setSelectedCategory}>
                        <TabsList className="bg-white p-1 shadow-sm border h-auto flex-wrap justify-start">
                            <TabsTrigger value="all" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-900">
                                All Items
                            </TabsTrigger>
                            {categories.map(cat => (
                                <TabsTrigger
                                    key={cat.id}
                                    value={cat.id.toString()}
                                    className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-900"
                                >
                                    {cat.name}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>

                    <div className="flex items-center gap-4">
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-[180px] bg-white">
                                <ArrowUpDown className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="featured">Featured</SelectItem>
                                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                                <SelectItem value="name-asc">Name: A to Z</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex items-center gap-2 text-sm text-gray-500 whitespace-nowrap">
                            <Filter className="w-4 h-4" />
                            <span>{sortedItems.length} items</span>
                        </div>
                    </div>
                </div>

                {/* Product Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-orange-600" />
                    </div>
                ) : paginatedItems.length > 0 ? (
                    <motion.div
                        layout
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    >
                        <AnimatePresence>
                            {paginatedItems.map((item) => (
                                <motion.div
                                    layout
                                    key={item.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    whileHover={{ y: -5 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Card className="h-full border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group bg-white flex flex-col">
                                        <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden p-6 flex items-center justify-center">
                                            {/* Discount/Hot Badge */}
                                            <Badge className="absolute top-3 left-3 bg-orange-500 hover:bg-orange-600 text-white border-none px-3 py-1 rounded-full z-10">
                                                Hot
                                            </Badge>

                                            {item.image ? (
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                                                />
                                            ) : (
                                                <ShoppingBag className="w-16 h-16 text-orange-200" />
                                            )}
                                        </div>

                                        <CardContent className="p-5 flex-1 flex flex-col">
                                            <div className="mb-2">
                                                <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                                                    {categories.find(c => c.id === item.category)?.name || 'Samagri'}
                                                </span>
                                            </div>

                                            <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1 group-hover:text-orange-600 transition-colors">
                                                {item.name}
                                            </h3>

                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="text-gray-500 font-medium">
                                                    ₹{item.price}
                                                </span>
                                                {item.stock_quantity < 5 && (
                                                    <span className="text-xs text-red-500 font-medium">
                                                        Only {item.stock_quantity} left!
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mt-auto grid grid-cols-2 gap-3 pt-4 border-t border-gray-50">
                                                <Button
                                                    onClick={() => handleAddToCart(item)}
                                                    variant="secondary"
                                                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium flex items-center justify-center gap-2 h-10 rounded-lg text-xs sm:text-sm"
                                                    disabled={item.stock_quantity === 0}
                                                >
                                                    <ShoppingCart className="w-4 h-4" />
                                                    {item.stock_quantity === 0 ? 'Out of Stock' : 'Add'}
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium flex items-center justify-center gap-2 h-10 rounded-lg text-xs sm:text-sm"
                                                    onClick={() => setSelectedItem(item)}
                                                >
                                                    <Eye className="w-4 h-4" /> View
                                                </Button>
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
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Items Found</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                            We couldn't find any samagri matching your search. Try adjusting your filters.
                        </p>
                        <Button
                            variant="link"
                            className="mt-4 text-orange-600"
                            onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                        >
                            Clear all filters
                        </Button>
                    </div>
                )}

                {/* Pagination */}
                {sortedItems.length > itemsPerPage && (
                    <div className="flex justify-center mt-12 gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center px-4 font-medium text-sm">
                            Page {currentPage} of {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </main>

            <Footer />

            {/* Quick View Modal */}
            <AnimatePresence>
                {selectedItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedItem(null)}
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
                            <div className="md:w-1/2 bg-gray-50 p-8 flex items-center justify-center relative">
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="absolute top-4 left-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors md:hidden"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>

                                {selectedItem.image ? (
                                    <img
                                        src={selectedItem.image}
                                        alt={selectedItem.name}
                                        className="w-full h-auto object-contain max-h-[300px] drop-shadow-2xl"
                                    />
                                ) : (
                                    <ShoppingBag className="w-32 h-32 text-orange-200" />
                                )}
                            </div>

                            {/* Product Details */}
                            <div className="md:w-1/2 p-8 flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <Badge className="bg-orange-100 text-orange-600 hover:bg-orange-100 border-none mb-2">
                                            {categories.find(c => c.id === selectedItem.category)?.name || 'Samagri'}
                                        </Badge>
                                        <h2 className="text-3xl font-bold text-gray-900 font-playfair">{selectedItem.name}</h2>
                                    </div>
                                    <button
                                        onClick={() => setSelectedItem(null)}
                                        className="hidden md:block p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <X className="w-6 h-6 text-gray-400" />
                                    </button>
                                </div>

                                <div className="flex items-center gap-3 mb-6">
                                    <span className="text-3xl font-bold text-orange-600">₹{selectedItem.price}</span>
                                    {selectedItem.stock_quantity > 0 ? (
                                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                            In Stock ({selectedItem.stock_quantity})
                                        </Badge>
                                    ) : (
                                        <Badge variant="destructive">Out of Stock</Badge>
                                    )}
                                </div>

                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Description</h4>
                                    <p className="text-gray-600 leading-relaxed mb-6">
                                        {selectedItem.description || "Authentic and pure puja samagri curated for your sacred rituals. High quality and traditionally prepared."}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <Button
                                        onClick={() => { handleAddToCart(selectedItem); setSelectedItem(null); }}
                                        disabled={selectedItem.stock_quantity === 0}
                                        className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg rounded-2xl shadow-xl shadow-orange-600/20 gap-3"
                                    >
                                        <ShoppingCart className="w-6 h-6" /> Add to Cart
                                    </Button>
                                    <p className="text-center text-xs text-gray-400 italic">
                                        Free delivery on orders above ₹1000
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

export default Samagri;
