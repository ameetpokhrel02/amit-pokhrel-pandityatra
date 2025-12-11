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
  { id: 101, title: 'Puja Thali Set', description: 'Complete thali for small puja', price: 299, image: '/images/puja1.svg' },
  { id: 102, title: 'Incense Pack', description: 'Agarbatti and dhoop', price: 99, image: '/images/puja2.svg' },
  { id: 103, title: 'Camphor & Ghee', description: 'Camphor (Kapoor) and ghee pack', price: 199, image: '/images/puja1.svg' },
];

const Samagri: React.FC = () => {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/samagri/');
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
            <h1 className="text-3xl font-bold text-slate-900">Puja Samagri</h1>
            <p className="text-slate-600 mt-2">Authentic puja materials sourced for purity and tradition.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
            <span className="ml-2 text-slate-600">Loading samagri...</span>
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

export default Samagri;
