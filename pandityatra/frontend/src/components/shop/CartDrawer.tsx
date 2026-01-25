import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const USD_RATE = 0.0075; // 1 NPR = 0.0075 USD (approx)

const CartDrawer: React.FC = () => {
  const { items, updateQuantity, clear, total, drawerOpen, closeDrawer, removeItem } = useCart();
  const navigate = useNavigate();

  const totalUSD = total * USD_RATE;

  return (
    <Sheet open={drawerOpen} onOpenChange={(open) => { if (!open) closeDrawer(); }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col h-full border-l shadow-2xl bg-white dark:bg-gray-900"
      >
        <SheetHeader className="px-6 py-6 border-b bg-orange-50/30 dark:bg-orange-950/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/50 rounded-xl flex items-center justify-center text-orange-600">
              <ShoppingCart size={20} />
            </div>
            <div>
              <SheetTitle className="text-xl font-bold text-gray-900 dark:text-white">Your Cart</SheetTitle>
              <SheetDescription className="text-xs sm:text-sm font-medium text-orange-800 dark:text-orange-400">
                {items.length} item{items.length !== 1 ? 's' : ''} in your cart
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-60">
              <div className="w-24 h-24 bg-orange-50 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <span className="text-4xl text-orange-300">🛒</span>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">Your cart is empty</p>
                <p className="text-sm text-gray-500">Pick some sacred items to get started!</p>
              </div>
              <Button
                variant="outline"
                className="border-orange-500 text-orange-600 hover:bg-orange-50 rounded-full"
                onClick={() => closeDrawer()}
              >
                Browse Shop
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((it) => {
                const itemTotal = Number(it.price || 0) * it.quantity;

                return (
                  <div key={it.id} className="group relative flex gap-4 p-3 bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl hover:border-orange-200 transition-all">
                    {/* Item Image */}
                    <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden shrink-0 border border-gray-100/50">
                      {it.image ? (
                        <img src={it.image} alt={it.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-orange-200 bg-orange-50/30 font-bold text-lg uppercase">
                          {it.title.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight truncate line-clamp-2">{it.title}</h4>
                        <button
                          onClick={() => removeItem(it.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div>
                          <p className="text-sm font-bold text-orange-600">₹{Number(it.price || 0).toLocaleString()}</p>
                          <p className="text-[10px] text-gray-400 italic">${(Number(it.price || 0) * USD_RATE).toFixed(2)} USD</p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-full p-1 h-8">
                          <button
                            onClick={() => updateQuantity(it.id, Math.max(1, it.quantity - 1))}
                            className="w-6 h-6 flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 rounded-full"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{it.quantity}</span>
                          <button
                            onClick={() => updateQuantity(it.id, it.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 rounded-full"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 bg-gradient-to-t from-gray-50 dark:from-gray-950 to-white dark:to-gray-900 border-t space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span className="font-medium">₹{total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Delivery</span>
                <span className="text-green-600 font-bold uppercase text-[10px]">Free</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-dashed">
                <span className="font-bold text-lg">Total</span>
                <div className="text-right">
                  <p className="font-black text-2xl text-orange-600 leading-none">₹{total.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-1">${totalUSD.toFixed(2)} USD</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Button
                className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white font-black text-lg rounded-2xl shadow-lg ring-offset-background transition-all active:scale-[0.98]"
                onClick={() => {
                  closeDrawer();
                  navigate('/shop/checkout');
                }}
              >
                PROCEED TO CHECKOUT
              </Button>
              <button
                onClick={() => { if (confirm('Clear all items?')) clear(); }}
                className="text-xs text-gray-400 hover:text-red-500 font-medium transition-colors"
              >
                Clear Cart
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
