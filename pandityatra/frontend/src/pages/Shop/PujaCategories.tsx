import React, { useEffect, useState } from 'react';
import ProductCard from '@/components/shop/ProductCard';
import { useCart } from '@/hooks/useCart';

interface Product {
  id: number;
  title: string;
  description?: string;
  price: number;
  image?: string;
  externalLink?: string;
}

const FALLBACK: Product[] = [
  { id: 1, title: 'Ganesh Puja', description: 'Traditional Ganesh puja', price: 499, image: '/images/puja1.svg' },
  { id: 2, title: 'Satyanarayan Puja', description: 'Satyanarayan vrat and puja', price: 999, image: '/images/puja2.svg' },
  { id: 3, title: 'Navagraha Puja', description: 'Navagraha shanti', price: 1299, image: '/images/puja1.svg' },
];

const PujaCategories: React.FC = () => {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { items: cartItems } = useCart();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/pujas/');
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
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Puja Categories</h1>
        <div className="text-sm">Cart items: {cartItems.length}</div>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p) => (
            <ProductCard key={p.id} id={p.id} title={p.title} description={p.description} price={p.price} image={(p as any).image} externalLink={(p as any).externalLink} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PujaCategories;
