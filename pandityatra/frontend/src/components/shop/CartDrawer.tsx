import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';

const CartDrawer: React.FC = () => {
  const { items, updateQuantity, clear, total, drawerOpen, closeDrawer } = useCart();

  return (
    <Dialog open={drawerOpen} onOpenChange={(open) => { if (!open) closeDrawer(); }}>
      <DialogContent className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-background p-4 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-right-1/2 data-[state=closed]:slide-out-to-right-1/2">
        <DialogTitle className="sr-only">Your Cart</DialogTitle>
        <DialogDescription className="sr-only">Contains {items.length} item{items.length !== 1 ? 's' : ''} in your cart.</DialogDescription>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Your Cart</h2>
          <div className="flex items-center gap-2">
            <DialogClose asChild>
              <button aria-label="Close cart" className="p-2 rounded hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </DialogClose>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-muted-foreground">Your cart is empty.</div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto space-y-3 pb-32">
              {items.map((it) => (
                  <motion.div key={it.id} whileHover={{ scale: 1.02 }} className="flex items-center gap-4 bg-card border rounded p-3">
                  <div className="w-20 h-20 bg-muted rounded flex items-center justify-center overflow-hidden">
                    {/** if image exists in meta, show; otherwise placeholder */}
                    {it.meta?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.meta.image} alt={it.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-sm text-muted-foreground">No image</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{it.title}</div>
                      <div className="text-sm font-semibold">₹{(it.price).toFixed(2)}</div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-2 flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => updateQuantity(it.id, Math.max(1, it.quantity - 1))}>-</Button>
                        <div className="px-3">{it.quantity}</div>
                        <Button size="sm" variant="outline" onClick={() => updateQuantity(it.id, it.quantity + 1)}>+</Button>
                      </div>
                      <div>Subtotal: ₹{(it.price * it.quantity).toFixed(2)}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-lg font-semibold">Total: ₹{total.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">{items.length} item{items.length !== 1 ? 's' : ''}</div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => clear()}>Clear</Button>
                <Button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white" onClick={() => alert('Checkout not implemented (frontend-only).')}>Checkout</Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CartDrawer;
