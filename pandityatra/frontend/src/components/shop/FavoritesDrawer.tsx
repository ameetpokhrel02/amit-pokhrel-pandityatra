import React from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription
} from '@/components/ui/sheet';
import { Heart, ShoppingCart } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';

const FavoritesDrawer: React.FC = () => {
    const { items, toggleFavorite, drawerOpen, closeDrawer } = useFavorites();
    const { addItem: addToCart } = useCart();

    const handleMoveToCart = (item: any) => {
        addToCart({
            id: item.id,
            title: item.name,
            price: item.price || 0,
        });
    };

    return (
        <Sheet open={drawerOpen} onOpenChange={(open) => { if (!open) closeDrawer(); }}>
            <SheetContent className="flex flex-col h-full w-full sm:max-w-md p-0">
                <SheetHeader className="px-6 py-4 border-b">
                    <SheetTitle className="flex items-center gap-2">
                        <Heart className="h-5 w-5 text-red-500 fill-current" />
                        Your Favorites
                    </SheetTitle>
                    <SheetDescription>
                        {items.length} saved item{items.length !== 1 ? 's' : ''}.
                    </SheetDescription>
                </SheetHeader>

                {items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-4 p-8 text-center bg-gray-50/50 dark:bg-gray-900/50">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                            <Heart className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">No favorites yet</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Save items you love to find them later.</p>
                        </div>
                        <Button variant="outline" onClick={closeDrawer} className="mt-4">
                            Browse Shop
                        </Button>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto px-4 py-2">
                        <div className="space-y-4 pt-4 pb-10">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-3 hover:shadow-md dark:hover:shadow-lg transition-shadow">
                                    <div className="flex-1">
                                        <h4 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-1">{item.name}</h4>
                                        {item.price && (
                                            <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 mt-1">
                                                ₹{Number(item.price).toLocaleString('en-IN')}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                                            {item.description}
                                        </p>

                                        <div className="flex items-center gap-2 mt-3">
                                            <Button
                                                size="sm"
                                                className="h-8 flex-1 text-xs bg-orange-600 hover:bg-orange-700"
                                                onClick={() => handleMoveToCart(item)}
                                            >
                                                <ShoppingCart className="h-3 w-3 mr-1.5" />
                                                Add to Cart
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                className="h-8 w-8 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                onClick={() => toggleFavorite(item)}
                                                title="Remove from favorites"
                                            >
                                                <Heart className="h-4 w-4 fill-current" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
};

export default FavoritesDrawer;

