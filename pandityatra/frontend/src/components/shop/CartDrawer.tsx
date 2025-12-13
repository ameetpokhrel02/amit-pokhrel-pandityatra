import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { Trash2, ShoppingCart, Plus, Minus } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const CartDrawer: React.FC = () => {
  const { items, updateQuantity, removeItem, clear, total, drawerOpen, closeDrawer } = useCart();

  return (
    <Sheet open={drawerOpen} onOpenChange={(open) => { if (!open) closeDrawer(); }}>
      <SheetContent className="flex flex-col h-full w-full sm:max-w-md p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Your Cart
          </SheetTitle>
          <SheetDescription>
            {items.length} item{items.length !== 1 ? 's' : ''} in your cart.
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4 p-8 text-center bg-gray-50/50">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <ShoppingCart className="h-8 w-8 text-gray-300" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900">Your cart is empty</h3>
              <p className="text-sm text-gray-500 mt-1">Looks like you haven't added anything yet.</p>
            </div>
            <Button variant="outline" onClick={closeDrawer} className="mt-4">
              Start Shopping
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-2">
              <div className="space-y-4 pt-4 pb-20"> {/* pb-20 for footer spacing */}
                {items.map((it) => (
                  <div key={it.id} className="flex gap-4 bg-white/50 p-2 rounded-lg group">
                    <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 border border-gray-100">
                      {it.meta?.image ? (
                        <img src={it.meta.image} alt={it.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No img</div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-medium text-sm text-gray-900 line-clamp-2 leading-tight">{it.title}</h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-gray-400 hover:text-red-500 -mt-1 -mr-1"
                          onClick={() => removeItem(it.id)}
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-end justify-between mt-2">
                        <div className="flex items-center border rounded-md bg-white shadow-sm">
                          <button
                            className="p-1 px-2 hover:bg-gray-50 text-gray-600 disabled:opacity-50"
                            onClick={() => updateQuantity(it.id, Math.max(1, it.quantity - 1))}
                            disabled={it.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-semibold w-6 text-center">{it.quantity}</span>
                          <button
                            className="p-1 px-2 hover:bg-gray-50 text-gray-600"
                            onClick={() => updateQuantity(it.id, it.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-semibold text-gray-900">₹{(it.price * it.quantity).toLocaleString()}</div>
                          <div className="text-xs text-gray-500">₹{it.price.toLocaleString()} / unit</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t bg-white p-6 space-y-4 shadow-[0_-5px_15px_rgba(0,0,0,0.02)] z-10">
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Taxes</span>
                  <span>Calculated at checkout</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={clear}>
                  Clear Cart
                </Button>
                <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                  Checkout
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
