import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { X, Trash2, Plus, Minus } from 'lucide-react';

const USD_RATE = 0.0075; // 1 NPR = 0.0075 USD (approx)

const CartDrawer: React.FC = () => {
  const { items, updateQuantity, clear, total, drawerOpen, closeDrawer, removeItem } = useCart();
  
  const totalUSD = total * USD_RATE;

  return (
    <Dialog open={drawerOpen} onOpenChange={(open) => { if (!open) closeDrawer(); }}>
      <DialogContent className="fixed inset-0 sm:inset-auto sm:right-0 sm:top-0 sm:h-full z-50 w-full sm:w-full sm:max-w-md bg-background p-0 shadow-lg border-0 sm:border-l rounded-none sm:rounded-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom sm:data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-bottom sm:data-[state=closed]:slide-out-to-right">
        <div className="flex flex-col h-full w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b shrink-0">
            <div className="flex-1">
              <DialogTitle className="text-lg sm:text-xl font-bold">Your Cart</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm mt-1">
                {items.length} item{items.length !== 1 ? 's' : ''} in cart
              </DialogDescription>
            </div>
            <button
              onClick={() => closeDrawer()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors shrink-0 ml-2"
              aria-label="Close cart"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4">
            {items.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-center">
                <div>
                  <p className="text-base sm:text-lg font-medium mb-2">Your cart is empty</p>
                  <p className="text-xs sm:text-sm">Add items to get started</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((it) => {
                  const itemTotal = Number(it.price || 0) * it.quantity;
                  const itemTotalUSD = itemTotal * USD_RATE;
                  
                  return (
                    <Card key={it.id} className="overflow-hidden bg-white dark:bg-gray-800">
                      <CardContent className="p-3">
                        <div className="flex gap-3">
                          {/* Product Image */}
                          <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                            {it.image ? (
                              <img 
                                src={it.image} 
                                alt={it.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <span className="text-xs">No image</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Product Details */}
                          <div className="flex-1 min-w-0 flex flex-col">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <CardTitle className="text-sm sm:text-base line-clamp-2 flex-1">
                                {it.title}
                              </CardTitle>
                              <button
                                onClick={() => removeItem(it.id)}
                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors text-red-600 shrink-0"
                                aria-label="Remove item"
                                title="Remove from cart"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            
                            {/* Price */}
                            <div className="mb-2">
                              <p className="text-orange-600 font-semibold text-sm">
                                NPR ₹{Number(it.price || 0).toLocaleString('en-IN')}
                              </p>
                              <p className="text-gray-500 dark:text-gray-400 text-xs">
                                ${(Number(it.price || 0) * USD_RATE).toFixed(2)} USD
                              </p>
                            </div>
                            
                            {/* Quantity Controls */}
                            <div className="flex items-center justify-between mt-auto">
                              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="h-7 w-7 p-0 hover:bg-white dark:hover:bg-gray-600"
                                  onClick={() => updateQuantity(it.id, Math.max(1, it.quantity - 1))}
                                  title="Decrease quantity"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="font-semibold w-8 text-center text-sm">
                                  {it.quantity}
                                </span>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="h-7 w-7 p-0 hover:bg-white dark:hover:bg-gray-600"
                                  onClick={() => updateQuantity(it.id, it.quantity + 1)}
                                  title="Increase quantity"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              
                              {/* Item Total */}
                              <div className="text-right">
                                <p className="font-bold text-sm">
                                  ₹{itemTotal.toLocaleString('en-IN')}
                                </p>
                                <p className="text-xs text-gray-500">
                                  ${itemTotalUSD.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer - Total and Actions */}
          {items.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 shrink-0 px-3 sm:px-4 py-3 sm:py-4 space-y-3 bg-white dark:bg-gray-900/50">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Subtotal (NPR):</span>
                  <span>₹{Number(total || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Subtotal (USD):</span>
                  <span>${totalUSD.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Delivery:</span>
                  <span className="text-green-600">FREE</span>
                </div>
                <div className="flex items-center justify-between font-bold text-base sm:text-lg pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-orange-600">Total:</p>
                  </div>
                  <div className="text-right">
                    <p className="text-orange-600">₹{Number(total || 0).toLocaleString('en-IN')}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">${totalUSD.toFixed(2)} USD</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 text-xs sm:text-sm h-10 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-950"
                  onClick={() => {
                    if (confirm('Are you sure you want to clear the cart?')) {
                      clear();
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear Cart
                </Button>
                <Button 
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm h-10 font-semibold uppercase"
                  onClick={() => alert('Checkout not implemented yet')}
                >
                  Checkout
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CartDrawer;
