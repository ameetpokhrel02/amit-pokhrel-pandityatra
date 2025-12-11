import React, { useEffect, useState } from 'react';
import ProductCard from '@/components/shop/ProductCard';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Loader2 } from 'lucide-react';

interface Product {
  id: number;
  title: string;
  description?: string;
  price: number;
  image?: string;
  externalLink?: string;
}

const FALLBACK: Product[] = [
  { id: 201, title: 'Vedic Pooja Handbook', description: 'Step-by-step guide for pujas', price: 349, image: '/images/book1.svg', externalLink: 'https://example.com/book/vedic-pooja-handbook' },
  { id: 202, title: 'Mantra Collection', description: 'Compilation of common mantras', price: 199, image: '/images/book1.svg', externalLink: 'https://example.com/book/mantra-collection' },
  { id: 203, title: 'Puja Recipes', description: 'Guide for offerings and samagri', price: 249, image: '/images/book1.svg', externalLink: 'https://example.com/book/puja-recipes' },
];

const Books: React.FC = () => {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/books/');
        if (!res.ok) throw new Error('no');
        const data = await res.json();
        if (mounted) setItems(data);
      } catch (e) {
        setItems(FALLBACK);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Spiritual Books</h1>
            <p className="text-slate-600 mt-2">Enhance your knowledge with our collection of sacred texts and guides.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
            <span className="ml-2 text-slate-600">Loading library...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((p) => (
              <ProductCard key={p.id} id={p.id} title={p.title} description={p.description} price={p.price} image={(p as any).image} externalLink={(p as any).externalLink} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Books;
