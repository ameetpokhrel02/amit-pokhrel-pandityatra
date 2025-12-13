import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '@/hooks/useCart';
import { fetchAllPujas, type Puja } from '@/lib/api';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { useToast } from '@/hooks/use-toast';
import {
  Eye,
  ShoppingCart,
  Search,
  Filter
} from 'lucide-react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';

const PujaCategoriesPage: React.FC = () => {
  const [pujas, setPujas] = useState<Puja[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { toast } = useToast();

  // Fallback data in case backend is empty during dev/demo
  const FALLBACK_PUJAS: Puja[] = [
    { id: 1, name: 'Ganesh Puja', description: 'Remove obstacles and ensure success.', base_price: 2100, image: '/src/assets/images/religious.png' } as any,
    { id: 2, name: 'Satyanarayan Puja', description: 'For peace, prosperity and happiness.', base_price: 1500, image: '/src/assets/images/aarati.png' } as any,
    { id: 3, name: 'Griha Pravesh', description: 'House warming ceremony for new beginnings.', base_price: 5100, image: '/src/assets/images/grahiaprabesh.png' } as any,
    { id: 4, name: 'Marriage Ceremony', description: 'Vedic wedding rituals.', base_price: 11000, image: '/src/assets/images/marriage.png' } as any,
  ];

  useEffect(() => {
    const loadPujas = async () => {
      try {
        const data = await fetchAllPujas();
        if (data && data.length > 0) {
          setPujas(data);
        } else {
          setPujas(FALLBACK_PUJAS); // Use fallback if empty list
        }
      } catch (err) {
        console.error("Failed to fetch pujas", err);
        setPujas(FALLBACK_PUJAS); // Fallback on error
      } finally {
        setLoading(false);
      }
    };
    loadPujas();
  }, []);

  const handleAddToCart = (puja: Puja) => {
    addItem({
      id: puja.id,
      title: puja.name,
      price: puja.base_price,
      meta: { image: (puja as any).image }
    }, 1);

    toast({
      title: "Added to Cart",
      description: `${puja.name} has been added to your cart.`,
      duration: 3000,
      className: "bg-green-50 border-green-200"
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      {/* Header / Hero */}
      <div className="bg-white border-b sticky top-[73px] z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Puja Categories</h1>
            <p className="text-sm text-muted-foreground"> Explore our divine collection of vedic ceremonies</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search pujas..."
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50 hover:bg-white transition-colors"
              />
            </div>
            <Button variant="outline" size="icon" className="rounded-full">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <main className="flex-grow container mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-96 bg-gray-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            {pujas.map((puja, index) => (
              <motion.div
                key={puja.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden border border-gray-100 flex flex-col"
              >
                {/* Image Area */}
                <div className="relative h-64 overflow-hidden bg-gray-100">
                  <img
                    src={(puja as any).image || '/src/assets/images/religious.png'}
                    alt={puja.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 ignore-clicks">
                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="rounded-full bg-white/90 hover:bg-white text-gray-900 hover:text-primary shadow-lg"
                        onClick={() => console.log('View', puja.id)}
                        title="View Details"
                      >
                        <Eye className="h-5 w-5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        className={`rounded - full bg - white / 90 hover: bg - white shadow - lg ${isFavorite(puja.id) ? 'text-red-500' : 'text-gray-900 hover:text-red-500'} `}
                        onClick={() => toggleFavorite({
                          id: puja.id,
                          type: 'puja',
                          name: puja.name,
                          price: puja.base_price,
                          image: (puja as any).image,
                        })}
                        title={isFavorite(puja.id) ? "Remove from Favorites" : "Add to Favorites"}
                      >
                        {isFavorite(puja.id) ? (
                          <FaHeart className="h-5 w-5 text-red-500" />
                        ) : (
                          <FaRegHeart className="h-5 w-5 text-gray-900 hover:text-red-500" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Price Badge */}
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                    ₹{puja.base_price.toLocaleString()}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-grow flex flex-col">
                  <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-primary transition-colors line-clamp-1">
                    {puja.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-grow">
                    {puja.description}
                  </p>

                  <Button
                    onClick={() => handleAddToCart(puja)}
                    className="w-full rounded-full bg-gray-900 hover:bg-primary text-white transition-colors duration-300 shadow-md group/btn"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4 transition-transform group-hover/btn:-translate-y-1 group-hover/btn:translate-x-1" />
                    Add to Cart
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default PujaCategoriesPage;
