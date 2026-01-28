import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Search,
  Filter,
  ShoppingCart,
  Loader2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Star,
  Users,
  Clock,
  ArrowUp,
  X,
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
import { useNavigate } from 'react-router-dom';
import { fetchPujas } from '../../services/api';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useFavorites } from '@/hooks/useFavorites';
// import { useCart } from '@/hooks/useCart'; // Pending Cart Implementation

interface Puja {
  id: number;
  name?: string;
  description: string;
  price: number;
  duration_minutes: number;
  pandit_name: string;
  pandit: number;
}

// Helper to map Puja names to Images (Same as before)
const pujaData: { [key: string]: { icon: React.ReactNode; image: string } } = {
  'Ganesh Puja': { icon: <Flame className="h-6 w-6" />, image: '/images/puja1.svg' },
  'Durga Puja': { icon: <Star className="h-6 w-6" />, image: '/images/puja2.svg' },
  'Lakshmi Puja': { icon: <Flame className="h-6 w-6" />, image: '/images/puja1.svg' },
  'Shiva Puja': { icon: <Flame className="h-6 w-6" />, image: '/images/puja2.svg' },
  'Havan': { icon: <Flame className="h-6 w-6" />, image: '/images/puja1.svg' },
  'Satyanarayan Puja': { icon: <Star className="h-6 w-6" />, image: '/images/puja2.svg' },
};

const PujaCategories = () => {
  const [pujas, setPujas] = useState<Puja[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const { toast } = useToast();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addItem, openDrawer } = useCart();
  const navigate = useNavigate();
  const [selectedPuja, setSelectedPuja] = useState<Puja | null>(null);

  // ... (useEffect and loadData)

  const handleBookNow = (puja: Puja) => {
    // Navigate to booking form for this puja
    navigate(`/booking?pujaId=${puja.id}`);
  };

  const handleAddToCart = (puja: Puja | null) => {
    if (!puja) return;
    
    addItem({
      id: `puja-${puja.id}`,
      title: puja.name || 'Puja Service',
      price: puja.price,
      meta: { 
        type: 'puja', 
        panditId: puja.pandit,
        duration: puja.duration_minutes
      }
    }, 1);
    
    toast({
      title: "Added to Cart",
      description: `${puja.name || 'Puja service'} has been added to your cart.`,
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchPujas();
      setPujas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load pujas:', error);
      toast({
        title: "Error",
        description: "Failed to load services.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Processing Data
  const filteredItems = pujas.filter(item => {
    const term = searchQuery.toLowerCase();
    const nameMatch = (item.name || '').toLowerCase().includes(term);
    const descMatch = item.description.toLowerCase().includes(term);
    return nameMatch || descMatch;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc': return a.price - b.price;
      case 'price-desc': return b.price - a.price;
      case 'name-asc': return (a.name || '').localeCompare(b.name || '');
      case 'duration-desc': return b.duration_minutes - a.duration_minutes;
      default: return 0;
    }
  });

  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const paginatedItems = sortedItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

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
              <Flame className="w-4 h-4 mr-2" />
              Divine Services
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 font-playfair">
              Online Puja Services
            </h1>
            <p className="text-orange-100 text-lg mb-8 leading-relaxed">
              Book experienced Pandits for authenticated Vedic rituals.
              Review details, compare prices, and book instantly.
            </p>

            <div className="relative max-w-lg mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search for Ganesh Puja, Havan, etc..."
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
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {/* Left side spacer or additional filters if needed */}
            <span className="font-medium text-gray-700">Available Pujas</span>
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
                <SelectItem value="name-asc">Name: A to Z</SelectItem>
                <SelectItem value="duration-desc">Duration: Longest First</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 text-sm text-gray-500 whitespace-nowrap">
              <Filter className="w-4 h-4" />
              <span>{sortedItems.length} services</span>
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
              {paginatedItems.map((puja) => {
                const info = pujaData[puja.name || ''] || { image: '/images/puja1.svg' };
                return (
                  <motion.div
                    layout
                    key={puja.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="h-full border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group bg-white flex flex-col">
                      <div className="aspect-[4/3] bg-orange-50/50 relative overflow-hidden p-6 flex items-center justify-center">
                        {/* Favorite Button Overlay */}
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleFavorite({ id: puja.id, type: 'puja', name: puja.name || 'Puja', price: puja.price, description: puja.description }); }}
                          className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-sm hover:bg-white transition-colors z-10"
                        >
                          <Heart className={`w-4 h-4 ${isFavorite(puja.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                        </button>

                        <img
                          src={info.image}
                          alt={puja.name}
                          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>

                      <CardContent className="p-5 flex-1 flex flex-col">
                        <div className="mb-2 flex items-center gap-2">
                          <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                            <Clock className="w-3 h-3 mr-1" />
                            {puja.duration_minutes} min
                          </Badge>
                        </div>

                        <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1 group-hover:text-orange-600 transition-colors">
                          {puja.name || 'Puja Service'}
                        </h3>

                        <div className="flex items-center gap-2 mb-4">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            {puja.pandit_name}
                          </span>
                        </div>

                        <div className="mt-auto flex flex-col gap-3 pt-4 border-t border-gray-50">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-lg font-bold text-gray-900">
                              ₹{Number(puja.price).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              onClick={() => handleBookNow(puja)}
                              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium flex items-center justify-center gap-2 h-9 text-xs"
                            >
                              <ShoppingCart className="w-3 h-3" /> Book Now
                            </Button>
                            <Button
                              variant="secondary"
                              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium flex items-center justify-center gap-2 h-9 text-xs"
                              onClick={() => setSelectedPuja(puja)}
                            >
                              <Eye className="w-3 h-3" /> Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed">
            <Flame className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pujas Found</h3>
            <p className="text-gray-500">Try adjusting your search.</p>
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


      {/* Details Modal (Preserved & Styled) */}
      <AnimatePresence>
        {selectedPuja && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPuja(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedPuja.name}</h2>
                  <div className="flex items-center gap-2 text-orange-600 mt-1">
                    <Users className="w-4 h-4" />
                    <span className="font-medium text-sm">By {selectedPuja.pandit_name}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedPuja(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <p className="text-gray-600 leading-relaxed mb-6">
                  {selectedPuja.description}
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                    <div className="text-sm text-gray-500 mb-1">Duration</div>
                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-500" />
                      {selectedPuja.duration_minutes} Minutes
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                    <div className="text-sm text-gray-500 mb-1">Dakshina</div>
                    <div className="font-semibold text-gray-900 flex items-center gap-1">
                      <span className="text-green-600">₹</span>
                      {Number(selectedPuja.price).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                <Button
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                  onClick={() => { handleAddToCart(selectedPuja); setSelectedPuja(null); }}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" /> Book Now
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PujaCategories;
