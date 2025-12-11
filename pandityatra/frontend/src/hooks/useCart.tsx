import React, { createContext, useContext, useEffect, useState } from 'react';

export interface CartItem {
  id: number | string;
  title: string;
  price: number;
  quantity: number;
  meta?: Record<string, any>;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (id: string | number) => void;
  updateQuantity: (id: string | number, quantity: number) => void;
  clear: () => void;
  total: number;
  // UI helpers for cart drawer
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = 'pandityatra_cart_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const addItem = (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.id === item.id);
      if (existing) {
        return prev.map((p) => (p.id === item.id ? { ...p, quantity: p.quantity + quantity } : p));
      }
      return [...prev, { ...item, quantity }];
    });
  };

  const removeItem = (id: string | number) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  const updateQuantity = (id: string | number, quantity: number) => {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, quantity } : p)));
  };

  const clear = () => setItems([]);

  const total = items.reduce((s, it) => s + it.price * it.quantity, 0);

  // Drawer UI state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const openDrawer = () => setDrawerOpen(true);
  const closeDrawer = () => setDrawerOpen(false);
  const toggleDrawer = () => setDrawerOpen((s) => !s);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clear, total, drawerOpen, openDrawer, closeDrawer, toggleDrawer }}>
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

export default CartProvider;
