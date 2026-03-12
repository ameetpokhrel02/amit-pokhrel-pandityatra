import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';

export interface FavoriteItem {
    id: number | string;
    type: 'puja' | 'pandit' | 'samagri';
    name: string; // Unified name/title
    price?: number;
    image?: string;
    description?: string;
}

interface WishlistApiItem {
    id: number;
    item: {
        id: number;
        name: string;
        price: string | number;
        image: string | null;
        description: string | null;
        category_name?: string;
    };
    created_at: string;
}

interface FavoritesContextValue {
    items: FavoriteItem[];
    addItem: (item: FavoriteItem) => void;
    removeItem: (id: string | number) => void;
    toggleFavorite: (item: FavoriteItem) => void;
    isFavorite: (id: string | number) => boolean;
    clear: () => void;
    loading: boolean;
    // UI helpers for drawer
    drawerOpen: boolean;
    openDrawer: () => void;
    closeDrawer: () => void;
    toggleDrawer: () => void;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

const STORAGE_KEY = 'pandityatra_favorites_v1';

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { token, user } = useAuth();
    const [items, setItems] = useState<FavoriteItem[]>(() => {
        // Load from localStorage for initial state (offline support)
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? (JSON.parse(raw) as FavoriteItem[]) : [];
        } catch {
            return [];
        }
    });
    const [loading, setLoading] = useState(false);

    // Sync with backend when user is logged in
    useEffect(() => {
        if (token && user) {
            fetchWishlistFromApi();
        }
    }, [token, user]);

    // Save to localStorage whenever items change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch { }
    }, [items]);

    const fetchWishlistFromApi = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/samagri/wishlist/');
            const apiItems: WishlistApiItem[] = response.data;
            
            // Transform API data to FavoriteItem format
            const transformedItems: FavoriteItem[] = apiItems.map(wi => ({
                id: wi.item.id,
                type: 'samagri' as const,
                name: wi.item.name,
                price: typeof wi.item.price === 'string' ? parseFloat(wi.item.price) : wi.item.price,
                image: wi.item.image || undefined,
                description: wi.item.description || undefined,
            }));
            
            setItems(transformedItems);
        } catch (error) {
            console.error('Failed to fetch wishlist from API:', error);
            // Keep localStorage items as fallback
        } finally {
            setLoading(false);
        }
    };

    const isFavorite = useCallback((id: string | number) => {
        return items.some(i => String(i.id) === String(id));
    }, [items]);

    const addItem = async (item: FavoriteItem) => {
        if (isFavorite(item.id)) return;

        // Optimistic update
        setItems(prev => [...prev, item]);

        // Sync with backend if logged in
        if (token && item.type === 'samagri') {
            try {
                await apiClient.post('/samagri/wishlist/add/', { item_id: Number(item.id) });
            } catch (error) {
                console.error('Failed to add to wishlist:', error);
                // Revert on error
                setItems(prev => prev.filter(i => String(i.id) !== String(item.id)));
            }
        }
    };

    const removeItem = async (id: string | number) => {
        const itemToRemove = items.find(i => String(i.id) === String(id));
        
        // Optimistic update
        setItems(prev => prev.filter(i => String(i.id) !== String(id)));

        // Sync with backend if logged in
        if (token && itemToRemove?.type === 'samagri') {
            try {
                await apiClient.delete(`/samagri/wishlist/remove/${id}/`);
            } catch (error) {
                console.error('Failed to remove from wishlist:', error);
                // Revert on error
                if (itemToRemove) {
                    setItems(prev => [...prev, itemToRemove]);
                }
            }
        }
    };

    const toggleFavorite = async (item: FavoriteItem) => {
        if (isFavorite(item.id)) {
            await removeItem(item.id);
        } else {
            await addItem(item);
        }
    };

    const clear = () => setItems([]);

    // Drawer UI state
    const [drawerOpen, setDrawerOpen] = useState(false);
    const openDrawer = () => setDrawerOpen(true);
    const closeDrawer = () => setDrawerOpen(false);
    const toggleDrawer = () => setDrawerOpen((s) => !s);

    return (
        <FavoritesContext.Provider value={{ 
            items, 
            addItem, 
            removeItem, 
            toggleFavorite, 
            isFavorite, 
            clear, 
            loading,
            drawerOpen, 
            openDrawer, 
            closeDrawer, 
            toggleDrawer 
        }}>
            {children}
        </FavoritesContext.Provider>
    );
};

export function useFavorites() {
    const ctx = useContext(FavoritesContext);
    if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
    return ctx;
}
