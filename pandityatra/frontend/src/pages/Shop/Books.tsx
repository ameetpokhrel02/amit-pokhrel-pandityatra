import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Book,
    Search,
    Filter,
    ShoppingCart,
    Loader2,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    Eye,
    Star,
    X,
    ShoppingBag
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
import {
    fetchSamagriItems,
    fetchSamagriCategories,
    type SamagriItem,
    type SamagriCategory
} from '@/lib/api';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const Books = () => {
    const [books, setBooks] = useState<SamagriItem[]>([]);
    const [categories, setCategories] = useState<SamagriCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<string>('featured');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const { toast } = useToast();
    const { addItem, openDrawer } = useCart();
    const [selectedBook, setSelectedBook] = useState<SamagriItem | null>(null);

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

            // Find the "Book" category
            const bookCategory = categoriesData.find(c => c.name.toLowerCase() === 'book');

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

    // Processing Data
    const filteredItems = books.filter(item => {
        const term = searchQuery.toLowerCase();
        return item.name.toLowerCase().includes(term) || (item.description && item.description.toLowerCase().includes(term));
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

    useEffect(() => { setCurrentPage(1); }, [searchQuery, sortBy]);

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

                        <div className="relative max-w-lg mx-auto">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <Input
                                type="text"
                                placeholder="Search for Gita, Ramayana, etc..."
                                className="pl-10 h-12 bg-white text-gray-900 border-none shadow-xl rounded-full focus-visible:ring-2 focus-visible:ring-orange-300"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </motion.div>
                </div>
            </section>

            <main className="flex-1 container mx-auto py-12 px-4">
                {/* Controls */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                    <div className="text-sm font-medium text-gray-700">
                        Browse Collection
                    </div>

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
                                <SelectItem value="name-asc">Title: A to Z</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex items-center gap-2 text-sm text-gray-500 whitespace-nowrap">
                            <Filter className="w-4 h-4" />
                            <span>{sortedItems.length} items</span>
                        </div>
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-orange-600" />
                    </div>
                ) : paginatedItems.length > 0 ? (
                    <motion.div
                        layout
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
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
                                    <Card className="h-full border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group bg-white flex flex-col">
                                        <div className="aspect-[3/4] bg-stone-100 relative overflow-hidden p-8 flex items-center justify-center">
                                            {book.image ? (
                                                <img
                                                    src={book.image}
                                                    alt={book.name}
                                                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
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
                                                <div className="flex justify-between items-center">
                                                    <span className="text-lg font-bold text-orange-700">
                                                        NPR {book.price}
                                                    </span>
                                                    {book.stock_quantity < 5 && book.stock_quantity > 0 && (
                                                        <span className="text-[10px] text-red-500 font-bold animate-pulse uppercase">
                                                            Only {book.stock_quantity} Left!
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
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
                    <div className="flex justify-center mt-12 gap-2">
                        <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center px-4 font-medium text-sm">Page {currentPage} of {totalPages}</div>
                        <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                )}
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
                            <div className="md:w-1/2 bg-gray-50 p-8 flex items-center justify-center relative">
                                <button
                                    onClick={() => setSelectedBook(null)}
                                    className="absolute top-4 left-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors md:hidden"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>

                                {selectedBook.image ? (
                                    <img
                                        src={selectedBook.image}
                                        alt={selectedBook.name}
                                        className="w-full h-auto object-contain max-h-[300px] drop-shadow-2xl"
                                    />
                                ) : (
                                    <div className="w-3/4 h-[300px] bg-orange-800 rounded-r-md shadow-lg border-l-4 border-orange-900 flex flex-col items-center justify-center p-6 text-center">
                                        <Book className="text-orange-200 w-16 h-16 mb-4" />
                                        <h3 className="text-orange-50 font-serif text-xl">{selectedBook.name}</h3>
                                    </div>
                                )}
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
                                    <span className="text-3xl font-bold text-orange-600 font-sans">NPR {selectedBook.price}</span>
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
                                    <Button
                                        onClick={() => { handleAddToCart(selectedBook); setSelectedBook(null); }}
                                        disabled={selectedBook.stock_quantity === 0}
                                        className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg rounded-2xl shadow-xl shadow-orange-600/20 gap-3"
                                    >
                                        <ShoppingCart className="w-6 h-6" /> Add to Cart
                                    </Button>
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
