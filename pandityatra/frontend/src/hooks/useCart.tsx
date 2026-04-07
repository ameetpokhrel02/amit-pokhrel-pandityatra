import React, { createContext, useContext, useEffect, useState } from 'react';
import apiClient from '../lib/api-client';

export interface CartItem {
  id: number | string;
  cartItemId?: number; // Backend cart item ID
  title: string;
  price: number;
  quantity: number;
  stock_quantity?: number;
  image?: string;
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
  // Loading state for server syncing
  syncing: boolean;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = 'pandityatra_cart_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [syncing, setSyncing] = useState(false);
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  // Check authentication token to decide if we should sync
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // On mount and when token changes, sync cart with server if logged in
  useEffect(() => {
    if (token) {
      fetchServerCart();
    } else {
      // If user logs out, maybe reload from local storage (or leave as is since local logic handles it)
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setItems(JSON.parse(raw) as CartItem[]);
      }
    }
  }, [token]);

  // Sync to server local storage as backup and for offline
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const fetchServerCart = async () => {
    setSyncing(true);
    try {
      const res = await apiClient.get('/samagri/cart/');
      if (res.data) {
        const serverItems: CartItem[] = res.data.map((ci: any) => ({
          id: ci.item.id,
          cartItemId: ci.id,
          title: ci.item.name,
          price: parseFloat(ci.item.price),
          quantity: ci.quantity,
          stock_quantity: ci.item.stock_quantity,
          image: ci.item.image,
        }));
        setItems(serverItems);
      }
    } catch (e) {
      console.error("Failed to fetch server cart", e);
    } finally {
      setSyncing(false);
    }
  };

  const addItem = async (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    // Optimistic UI update
    setItems((prev) => {
      const existing = prev.find((p) => p.id === item.id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        if (existing.stock_quantity !== undefined && newQty > existing.stock_quantity) {
          return prev.map((p) => (p.id === item.id ? { ...p, quantity: existing.stock_quantity as number } : p));
        }
        return prev.map((p) => (p.id === item.id ? { ...p, quantity: newQty } : p));
      }
      return [...prev, { ...item, quantity }];
    });

    // Server update
    if (token) {
      try {
        await apiClient.post('/samagri/cart/', { item_id: item.id, quantity });
        // Fetch to ensure cartItemId is updated
        fetchServerCart();
      } catch (e) {
        console.error("Failed to add to server cart", e);
        // Might rollback in production app, ignoring for now for simplicity
      }
    }
  };

  const removeItem = async (id: string | number) => {
    const itemToRemove = items.find(i => i.id === id);
    setItems((prev) => prev.filter((p) => p.id !== id));

    if (token && itemToRemove?.cartItemId) {
      try {
        await apiClient.delete(`/samagri/cart/${itemToRemove.cartItemId}/`);
      } catch (e) {
        console.error("Failed to remove item from server cart", e);
      }
    }
  };

  const updateQuantity = async (id: string | number, quantity: number) => {
    const itemToUpdate = items.find(i => i.id === id);
    if (!itemToUpdate) return;

    // Stock check
    let finalQty = quantity;
    if (itemToUpdate.stock_quantity !== undefined && quantity > itemToUpdate.stock_quantity) {
      finalQty = itemToUpdate.stock_quantity;
    }

    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, quantity: finalQty } : p)));

    if (token && itemToUpdate?.cartItemId) {
      try {
        await apiClient.patch(`/samagri/cart/${itemToUpdate.cartItemId}/`, { quantity: finalQty });
      } catch (e) {
        console.error("Failed to update item quantity on server cart", e);
      }
    }
  };

  const clear = async () => {
    setItems([]);
    if (token) {
      try {
        // Assume server has a clear endpoint, else you could manually delete all cartItemIds
        await apiClient.delete('/samagri/cart/clear/');
      } catch (e) {
        console.error("Failed to clear server cart", e);
      }
    }
  };

  const total = items.reduce((s, it) => s + it.price * it.quantity, 0);

  // Drawer UI state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const openDrawer = () => setDrawerOpen(true);
  const closeDrawer = () => setDrawerOpen(false);
  const toggleDrawer = () => setDrawerOpen((s) => !s);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clear, total, drawerOpen, openDrawer, closeDrawer, toggleDrawer, syncing }}>
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
