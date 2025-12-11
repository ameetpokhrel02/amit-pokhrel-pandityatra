import React, { useEffect, useState } from 'react';
import ProductCard from '@/components/shop/ProductCard';
import { useCart } from '@/hooks/useCart';

interface Product {
  id: number;
  title: string;
  description?: string;
  price: number;
}

const FALLBACK: Product[] = [
  { id: 201, title: 'Vedic Pooja Handbook', description: 'Step-by-step guide for pujas', price: 349 },
  { id: 202, title: 'Mantra Collection', description: 'Compilation of common mantras', price: 199 },
  { id: 203, title: 'Puja Recipes', description: 'Guide for offerings and samagri', price: 249 },
];

const Books: React.FC = () => {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { items: cartItems } = useCart();

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
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Books</h1>
        <div className="text-sm">Cart items: {cartItems.length}</div>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p) => (
            <ProductCard key={p.id} id={p.id} title={p.title} description={p.description} price={p.price} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Books;
