import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { X, Plus, Minus, ShoppingBag, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const CartDrawer: React.FC = () => {
  const { items, removeItem, updateQuantity, clear, total, drawerOpen, closeDrawer } = useCart();

  return (
    <Sheet open={drawerOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <SheetContent className="w-full max-w-md p-0 flex flex-col bg-slate-50">
        <SheetHeader className="px-6 py-4 border-b bg-white">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold text-slate-800">Your Cart</SheetTitle>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground font-medium">
                {items.length} {items.length === 1 ? 'Item' : 'Items'}
              </div>
              {items.length > 0 && (
                <button
                  onClick={clear}
                  className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
          </div>
          <SheetDescription className="sr-only">
            Review and manage items in your cart before checkout.
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Your cart is empty</h3>
              <p className="text-slate-500 text-sm mt-1">Looks like you haven't added anything yet.</p>
            </div>
            <Button onClick={closeDrawer} variant="outline" className="mt-4">
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                <AnimatePresence>
                  {items.map((it) => (
                    <motion.div
                      key={it.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      layout
                      className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex gap-4"
                    >
                      {/* Product Image */}
                      <div className="w-24 h-24 bg-slate-50 rounded-lg flex-shrink-0 overflow-hidden border border-slate-100">
                        {it.meta?.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={it.meta.image} alt={it.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <ShoppingBag className="w-8 h-8" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-slate-800 line-clamp-2 text-sm leading-tight pr-2">
                              {it.title}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1 font-medium">₹{it.price.toFixed(2)}</p>
                          </div>
                          <button
                            onClick={() => removeItem(it.id)}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1 -mr-2 -mt-2"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1 border border-slate-200/50">
                            <button
                              onClick={() => updateQuantity(it.id, Math.max(1, it.quantity - 1))}
                              className="w-6 h-6 flex items-center justify-center rounded-md bg-white shadow-sm text-slate-600 hover:text-orange-600 active:scale-95 transition-all text-xs"
                              disabled={it.quantity <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-semibold w-4 text-center text-slate-700">{it.quantity}</span>
                            <button
                              onClick={() => updateQuantity(it.id, it.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center rounded-md bg-white shadow-sm text-slate-600 hover:text-orange-600 active:scale-95 transition-all text-xs"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="font-bold text-slate-800">
                            ₹{(it.price * it.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="border-t bg-white p-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Subtotal</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Tax (5%)</span>
                  <span>₹{(total * 0.05).toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold text-slate-800">
                  <span>Total</span>
                  <span>₹{(total * 1.05).toFixed(2)}</span>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full text-base font-semibold bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-200 rounded-xl"
                onClick={() => alert('Proceeding to checkout...')}
              >
                Checkout
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};


export default CartDrawer;
