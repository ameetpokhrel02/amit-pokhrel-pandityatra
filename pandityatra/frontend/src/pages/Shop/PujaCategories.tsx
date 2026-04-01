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
  X,
  Heart,
  Sparkles,
  Image as ImageIcon
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
import { fetchPujaCategories, type PujaCategory } from '@/lib/api';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useFavorites } from '@/hooks/useFavorites';

interface Puja {
  id: number;
  name?: string;
  description: string;
  price: number;
  duration_minutes: number;
  pandit_name: string;
  pandit: number;
  image?: string;
  category?: number;
}

// Fallback images per puja type
const pujaImages: Record<string, string> = {
  'Ganesh Puja':      'https://images.unsplash.com/photo-1635865165118-917ed9e20036?w=600&q=80',
  'Durga Puja':       'https://images.unsplash.com/photo-1604413191066-4dd20bedf486?w=600&q=80',
  'Lakshmi Puja':     'https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=600&q=80',
  'Shiva Puja':       'https://images.unsplash.com/photo-1618309236583-5673d72b39c5?w=600&q=80',
  'Havan':            'https://images.unsplash.com/photo-1604413191066-4dd20bedf486?w=600&q=80',
  'Satyanarayan Puja':'https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=600&q=80',
  'Birthday':         'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&q=80',
  'Marriage Ceremony':'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80',
};

const defaultPujaImage = 'https://images.unsplash.com/photo-1635865165118-917ed9e20036?w=600&q=80';

const CategoryScroll = ({ 
    categories, 
    selectedCategory, 
    onCategoryChange 
}: { 
    categories: PujaCategory[], 
    selectedCategory: string | number, 
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
                        <Flame className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                </div>
                <span className={`text-xs md:text-sm font-bold whitespace-nowrap tracking-wide ${
                    selectedCategory === 'all' ? 'text-orange-600' : 'text-gray-500'
                }`}>
                    All Pujas
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

const PujaCategories = () => {
  const [pujas, setPujas] = useState<Puja[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState<PujaCategory[]>([]);
  const itemsPerPage = 8;
  const { toast } = useToast();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addItem, openDrawer } = useCart();
  const navigate = useNavigate();
  const [selectedPuja, setSelectedPuja] = useState<Puja | null>(null);

  const handleBookNow = (puja: Puja) => {
    navigate(`/booking?pujaId=${puja.id}`);
  };

  const handleAddToCart = (puja: Puja | null) => {
    if (!puja) return;
    addItem({
      id: `puja-${puja.id}`,
      title: puja.name || 'Puja Service',
      price: puja.price,
      meta: { type: 'puja', panditId: puja.pandit, duration: puja.duration_minutes }
    }, 1);
    toast({
      title: "✅ Added to Cart",
      description: `${puja.name || 'Puja service'} has been added to your cart.`,
      className: "bg-green-600 text-white border-none shadow-2xl"
    });
  };

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [data, categoriesData] = await Promise.all([
          fetchPujas(),
          fetchPujaCategories()
      ]);
      setCategories(categoriesData);
      const mappedData = (Array.isArray(data) ? data : []).map((item: any) => ({
        ...item,
        price: item.base_price ? Number(item.base_price) : 0,
        duration_minutes: item.base_duration_minutes || 60,
        pandit_name: "PanditYatra Verified",
        pandit: 0
      }));
      setPujas(mappedData);
    } catch (error) {
      console.error('Failed to load pujas:', error);
      toast({ title: "Error", description: "Failed to load services.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = pujas.filter(item => {
    const term = searchQuery.toLowerCase();
    const matchesSearch = (item.name || '').toLowerCase().includes(term) || item.description.toLowerCase().includes(term);
    const matchesCategory = selectedCategory === 'all' || item.category?.toString() === selectedCategory;
    return matchesSearch && matchesCategory;
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
  const paginatedItems = sortedItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, sortBy, selectedCategory]);

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf8]">
      <Navbar />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-orange-700 via-orange-600 to-amber-500 text-white py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="container mx-auto text-center max-w-3xl relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge className="bg-white/20 text-white hover:bg-white/30 border-none mb-4 px-4 py-1.5 text-sm">
              <Sparkles className="w-4 h-4 mr-2" /> Divine Services
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-playfair">Online Puja Services</h1>
            <p className="text-orange-100 text-lg mb-8 leading-relaxed max-w-xl mx-auto">
              Book experienced Pandits for authentic Vedic rituals. Compare, review, and book instantly.
            </p>
            <div className="relative max-w-lg mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search Ganesh Puja, Havan, Vivah..."
                className="pl-12 h-14 bg-white text-gray-900 border-none shadow-2xl rounded-2xl focus-visible:ring-orange-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category Scroller */}
      <div className="bg-orange-50/30 border-y border-orange-100 mt-0 mb-4 overflow-visible">
          <div className="container mx-auto px-4 overflow-visible">
              <CategoryScroll 
                  categories={categories} 
                  selectedCategory={selectedCategory} 
                  onCategoryChange={setSelectedCategory} 
              />
          </div>
      </div>

      <main className="flex-1 container mx-auto py-12 px-4">
        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="font-semibold text-gray-800 text-lg">Available Pujas</span>
          </div>
          <div className="flex items-center gap-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] bg-white border-gray-200 shadow-sm">
                <ArrowUpDown className="w-4 h-4 mr-2 text-gray-400" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="name-asc">Name: A to Z</SelectItem>
                <SelectItem value="duration-desc">Duration: Longest</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
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
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {paginatedItems.map((puja: any) => {
                const imageSrc = puja.image || pujaImages[puja.name] || defaultPujaImage;
                return (
                  <motion.div
                    layout
                    key={puja.id}
                    initial={{ opacity: 0, scale: 0.93 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.93 }}
                    whileHover={{ y: -6 }}
                    transition={{ duration: 0.22 }}
                  >
                    <Card className="h-full border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group bg-white flex flex-col rounded-xl">

                      {/* Full-bleed image — same as shop cards */}
                      <div className="aspect-square relative overflow-hidden bg-orange-50">

                        {/* Sacred badge */}
                        <Badge className="absolute top-3 left-3 bg-orange-500 hover:bg-orange-600 text-white border-none px-3 py-1 rounded-full z-10 text-xs font-semibold shadow">
                          Sacred
                        </Badge>

                        {/* Favorite */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite({ id: puja.id, type: 'puja', name: puja.name || 'Puja', price: puja.price, description: puja.description });
                          }}
                          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center z-10 transition-all duration-200 ${
                            isFavorite(puja.id)
                              ? 'bg-red-500 text-white shadow-lg shadow-red-200'
                              : 'bg-white/90 text-gray-400 hover:text-red-500 hover:bg-white shadow-md'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isFavorite(puja.id) ? 'fill-current' : ''}`} />
                        </button>

                        <img
                          src={imageSrc}
                          alt={puja.name}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          onError={(e) => { (e.target as HTMLImageElement).src = defaultPujaImage; }}
                        />

                        {/* Bottom gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
                      </div>

                      <CardContent className="p-5 flex-1 flex flex-col">
                        {/* Duration chip */}
                        <div className="mb-2">
                          <span className="text-xs font-bold text-orange-600 uppercase tracking-wider flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {puja.duration_minutes} min
                          </span>
                        </div>

                        <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1 group-hover:text-orange-600 transition-colors">
                          {puja.name || 'Puja Service'}
                        </h3>

                        <div className="flex items-center gap-1.5 mb-4">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs text-gray-500">{puja.pandit_name}</span>
                        </div>

                        <div className="mt-auto pt-4 border-t border-gray-50">
                          <span className="block text-xl font-bold text-gray-900 mb-3">
                            ₹{Number(puja.price).toLocaleString('en-IN')}
                          </span>
                          <div className="grid grid-cols-2 gap-2.5">
                            <Button
                              onClick={() => handleBookNow(puja)}
                              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium flex items-center justify-center gap-1.5 h-10 rounded-lg text-xs shadow-sm hover:shadow-md transition-all"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" /> Book Now
                            </Button>
                            <Button
                              variant="secondary"
                              className="w-full bg-white hover:bg-orange-50 text-orange-600 border border-orange-200 font-medium flex items-center justify-center gap-1.5 h-10 rounded-lg text-xs transition-all"
                              onClick={() => setSelectedPuja(puja)}
                            >
                              <Eye className="w-3.5 h-3.5" /> Details
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
          <div className="flex justify-center items-center mt-12 gap-2">
            <Button
              variant="ghost"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="bg-white hover:bg-orange-50 text-gray-600 hover:text-orange-600 rounded-xl px-4"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "ghost"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-xl font-bold transition-all ${
                  currentPage === page
                    ? "bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20 scale-105"
                    : "text-gray-500 hover:bg-orange-50 hover:text-orange-600"
                }`}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="ghost"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="bg-white hover:bg-orange-50 text-gray-600 hover:text-orange-600 rounded-xl px-4"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </main>

      <Footer />

      {/* Details Modal */}
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
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col md:flex-row"
            >
              {/* Image side */}
              <div className="md:w-1/2 relative overflow-hidden min-h-[260px] md:min-h-full">
                <button
                  onClick={() => setSelectedPuja(null)}
                  className="absolute top-4 left-4 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg hover:bg-white transition-all z-10 md:hidden"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
                <img
                  src={selectedPuja.image || pujaImages[selectedPuja.name || ''] || defaultPujaImage}
                  alt={selectedPuja.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = defaultPujaImage; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
              </div>

              {/* Details side */}
              <div className="md:w-1/2 p-8 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <Badge className="bg-orange-100 text-orange-600 hover:bg-orange-100 border-none mb-2">
                      <Clock className="w-3 h-3 mr-1" /> {selectedPuja.duration_minutes} min
                    </Badge>
                    <h2 className="text-2xl font-bold text-gray-900 font-playfair">{selectedPuja.name}</h2>
                    <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                      <Users className="w-3.5 h-3.5" />
                      <span>By {selectedPuja.pandit_name}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPuja(null)}
                    className="hidden md:block p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <p className="text-gray-600 leading-relaxed mb-6">
                    {selectedPuja.description || "Authentic and sacred puja performed by experienced Pandits following traditional Vedic rituals."}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                      <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Duration</div>
                      <div className="font-bold text-gray-900 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-orange-500" /> {selectedPuja.duration_minutes} min
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                      <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Dakshina</div>
                      <div className="font-bold text-green-700 text-lg">
                        ₹{Number(selectedPuja.price).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-gray-100 space-y-3">
                  <Button
                    className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-bold text-base rounded-xl shadow-lg shadow-orange-600/20"
                    onClick={() => { handleBookNow(selectedPuja); setSelectedPuja(null); }}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" /> Book Now
                  </Button>
                  <p className="text-center text-xs text-gray-400 italic">Performed by verified Pandits</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PujaCategories;
