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
    ArrowUp,
    Heart,
    X
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
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

// Mock Data for Books
interface BookItem {
    id: number;
    title: string;
    author: string;
    price: number;
    category: string;
    description: string;
    image?: string;
    rating: number;
    inStock: boolean;
}

const MOCK_BOOKS: BookItem[] = [
    {
        id: 1,
        title: "The Bhagavad Gita",
        author: "Vyasa",
        price: 450,
        category: "Scriptures",
        description: "The timeless wisdom of Lord Krishna to Arjuna on the battlefield of Kurukshetra.",
        rating: 5,
        inStock: true
    },
    {
        id: 2,
        title: "Ramayana",
        author: "Valmiki",
        price: 1200,
        category: "Epics",
        description: "The epic journey of Lord Rama, Sita, and Hanuman. A tale of dharma and devotion.",
        rating: 5,
        inStock: true
    },
    {
        id: 3,
        title: "Mahabharata",
        author: "Vyasa",
        price: 1500,
        category: "Epics",
        description: "The longest epic poem known and has been described as 'the longest poem ever written'.",
        rating: 4.8,
        inStock: true
    },
    {
        id: 4,
        title: "Upanishads",
        author: "Various Rishis",
        price: 600,
        category: "Philosophy",
        description: "Ancient Sanskrit texts of spiritual teaching and ideas of Hinduism.",
        rating: 4.7,
        inStock: true
    },
    {
        id: 5,
        title: "Vedas (Set of 4)",
        author: "Ancient Seers",
        price: 5000,
        category: "Scriptures",
        description: "The Rigveda, the Yajurveda, the Samaveda and the Atharvaveda.",
        rating: 5,
        inStock: false
    },
    {
        id: 6,
        title: "Hanuman Chalisa",
        author: "Tulsidas",
        price: 50,
        category: "Chants",
        description: "A devotional hymn dedicated to Lord Hanuman.",
        rating: 4.9,
        inStock: true
    },
    {
        id: 7,
        title: "Srimad Bhagavatam",
        author: "Vyasa",
        price: 2500,
        category: "Puranas",
        description: "Focuses on bhakti yoga and the life of Krishna.",
        rating: 4.9,
        inStock: true
    },
    {
        id: 8,
        title: "Garuda Purana",
        author: "Vyasa",
        price: 350,
        category: "Puranas",
        description: "Dialogue between Lord Vishnu and Garuda regarding the afterlife.",
        rating: 4.2,
        inStock: true
    }
];

const Books = () => {
    const [books, setBooks] = useState<BookItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<string>('featured');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const { toast } = useToast();
    const { addItem, openDrawer } = useCart();
    const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);

    useEffect(() => {
        // Simulate API Fetch
        setTimeout(() => {
            setBooks(MOCK_BOOKS);
            setLoading(false);
        }, 800);
    }, []);

    // Processing Data
    const filteredItems = books.filter(item => {
        const term = searchQuery.toLowerCase();
        return item.title.toLowerCase().includes(term) || item.author.toLowerCase().includes(term);
    });

    const sortedItems = [...filteredItems].sort((a, b) => {
        switch (sortBy) {
            case 'price-asc': return a.price - b.price;
            case 'price-desc': return b.price - a.price;
            case 'name-asc': return a.title.localeCompare(b.title);
            default: return 0;
        }
    });

    const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
    const paginatedItems = sortedItems.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => { setCurrentPage(1); }, [searchQuery, sortBy]);

    const handleAddToCart = (book: BookItem) => {
        addItem({
            id: `book-${book.id}`, // Unique ID prefix
            title: book.title,
            price: book.price,
            image: '/images/bhasma.png', // Fallback/Placeholder
        });
        toast({
            title: "Added to Cart",
            description: `${book.title} has been added.`,
            className: "bg-green-600 text-white border-green-700 shadow-lg"
        });
        openDrawer();
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />

            {/* Hero Section */}
            <section className="bg-gradient-to-r from-amber-700 to-orange-800 text-white py-20 px-4">
                <div className="container mx-auto text-center max-w-3xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <Badge className="bg-white/20 text-white hover:bg-white/30 border-none mb-4">
                            <Book className="w-4 h-4 mr-2" />
                            Spiritual Wisdom
                        </Badge>
                        <h1 className="text-4xl md:text-5xl font-bold mb-6 font-playfair">
                            Sacred Library
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
                                className="pl-10 h-12 bg-white text-gray-900 border-none shadow-xl rounded-full"
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
                            <span>{sortedItems.length} books</span>
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
                                            {/* Placeholder Book Cover */}
                                            <div className="w-3/4 h-full bg-orange-800 rounded-r-md shadow-lg border-l-4 border-orange-900 flex flex-col items-center justify-center p-2 text-center">
                                                <div className="border border-orange-400/30 w-full h-full p-2 flex flex-col items-center justify-center">
                                                    <Book className="text-orange-200 w-8 h-8 mb-2" />
                                                    <span className="text-orange-50 font-serif text-sm line-clamp-2">{book.title}</span>
                                                </div>
                                            </div>

                                            {!book.inStock && (
                                                <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                                                    <Badge variant="destructive">Out of Stock</Badge>
                                                </div>
                                            )}
                                        </div>

                                        <CardContent className="p-5 flex-1 flex flex-col">
                                            <div className="mb-2">
                                                <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                                                    {book.category}
                                                </span>
                                            </div>

                                            <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1 group-hover:text-orange-600 transition-colors">
                                                {book.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 mb-3">by {book.author}</p>

                                            <div className="mt-auto pt-4 border-t border-gray-50 grid grid-cols-2 gap-3">
                                                <div className="col-span-2 flex justify-between items-center mb-2">
                                                    <span className="text-lg font-bold text-gray-900">
                                                        ₹{book.price}
                                                    </span>
                                                    <div className="flex items-center text-yellow-500 text-xs">
                                                        <Star className="w-3 h-3 fill-current mr-1" /> {book.rating}
                                                    </div>
                                                </div>

                                                <Button
                                                    onClick={() => handleAddToCart(book)}
                                                    disabled={!book.inStock}
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
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed">
                        <Book className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Books Found</h3>
                        <p className="text-gray-500">Try searching for a different title.</p>
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
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between">
                                <h2 className="text-2xl font-bold">{selectedBook.title}</h2>
                                <button onClick={() => setSelectedBook(null)}><X className="w-6 h-6 text-gray-400" /></button>
                            </div>
                            <div className="p-6">
                                <p className="text-gray-600 mb-4">{selectedBook.description}</p>
                                <div className="flex justify-between items-center font-bold text-lg">
                                    <span>₹{selectedBook.price}</span>
                                    <span className="text-sm font-normal text-gray-500">by {selectedBook.author}</span>
                                </div>
                            </div>
                            <div className="p-6 bg-gray-50 flex gap-3">
                                <Button onClick={() => { handleAddToCart(selectedBook); setSelectedBook(null); }} className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                                    Add to Cart
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Books;
