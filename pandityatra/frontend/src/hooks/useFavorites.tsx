import React, { createContext, useContext, useEffect, useState } from 'react';

export interface FavoriteItem {
    id: number | string;
    type: 'puja' | 'pandit' | 'samagri';
    name: string; // Unified name/title
    price?: number;
    image?: string;
    description?: string;
}

interface FavoritesContextValue {
    items: FavoriteItem[];
    addItem: (item: FavoriteItem) => void;
    removeItem: (id: string | number) => void;
    toggleFavorite: (item: FavoriteItem) => void;
    isFavorite: (id: string | number) => boolean;
    clear: () => void;
    // UI helpers for drawer
    drawerOpen: boolean;
    openDrawer: () => void;
    closeDrawer: () => void;
    toggleDrawer: () => void;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

const STORAGE_KEY = 'pandityatra_favorites_v1';

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<FavoriteItem[]>(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? (JSON.parse(raw) as FavoriteItem[]) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch { }
    }, [items]);

    const isFavorite = (id: string | number) => items.some(i => i.id === id);

    const addItem = (item: FavoriteItem) => {
        if (!isFavorite(item.id)) {
            setItems(prev => [...prev, item]);
        }
    };

    const removeItem = (id: string | number) => {
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const toggleFavorite = (item: FavoriteItem) => {
        if (isFavorite(item.id)) {
            removeItem(item.id);
        } else {
            addItem(item);
        }
    };

    const clear = () => setItems([]);

    // Drawer UI state
    const [drawerOpen, setDrawerOpen] = useState(false);
    const openDrawer = () => setDrawerOpen(true);
    const closeDrawer = () => setDrawerOpen(false);
    const toggleDrawer = () => setDrawerOpen((s) => !s);

    return (
        <FavoritesContext.Provider value={{ items, addItem, removeItem, toggleFavorite, isFavorite, clear, drawerOpen, openDrawer, closeDrawer, toggleDrawer }}>
            {children}
        </FavoritesContext.Provider>
    );
};

export function useFavorites() {
    const ctx = useContext(FavoritesContext);
    if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
    return ctx;
}
