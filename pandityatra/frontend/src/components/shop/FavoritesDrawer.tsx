import React from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription
} from '@/components/ui/sheet';
import { Heart, Trash2, ShoppingCart } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

const FavoritesDrawer: React.FC = () => {
    const { items, removeItem, drawerOpen, closeDrawer } = useFavorites();
    const { addItem: addToCart } = useCart();

    const handleMoveToCart = (item: any) => {
        addToCart({
            id: item.id,
            title: item.name,
            price: item.price || 0,
            meta: { image: item.image }
        });
        toast({ title: "Moved to Cart", description: `${item.name} moved to cart.` });
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
                    <div className="flex-1 flex flex-col items-center justify-center space-y-4 p-8 text-center bg-gray-50/50">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <Heart className="h-8 w-8 text-gray-300" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg text-gray-900">No favorites yet</h3>
                            <p className="text-sm text-gray-500 mt-1">Save items you love to find them later.</p>
                        </div>
                        <Button variant="outline" onClick={closeDrawer} className="mt-4">
                            Browse Shop
                        </Button>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto px-4 py-2">
                        <div className="space-y-4 pt-4 pb-10">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-4 bg-white border rounded-lg p-3 hover:shadow-sm transition-shadow">
                                    <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No img</div>
                                        )}
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <h4 className="font-medium text-sm text-gray-900 line-clamp-1">{item.name}</h4>
                                            <p className="text-xs text-gray-500 capitalize">{item.type} • ₹{item.price?.toLocaleString()}</p>
                                        </div>

                                        <div className="flex items-center gap-2 mt-2">
                                            <Button
                                                size="sm"
                                                className="h-8 flex-1 text-xs"
                                                onClick={() => handleMoveToCart(item)}
                                            >
                                                <ShoppingCart className="h-3 w-3 mr-1.5" />
                                                Add to Cart
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                className="h-8 w-8 text-gray-500 hover:text-red-500 hover:bg-red-50"
                                                onClick={() => removeItem(item.id)}
                                            >
                                                <Trash2 className="h-3 w-3" />
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
