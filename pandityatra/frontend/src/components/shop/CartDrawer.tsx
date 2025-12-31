import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';

const CartDrawer: React.FC = () => {
  const { items, updateQuantity, clear, total, drawerOpen, closeDrawer, removeItem } = useCart();

  return (
    <Dialog open={drawerOpen} onOpenChange={(open) => { if (!open) closeDrawer(); }}>
      <DialogContent className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-background p-4 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-right-1/2 data-[state=closed]:slide-out-to-right-1/2">
        <DialogTitle className="sr-only">Your Cart</DialogTitle>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Your Cart</h2>
          <Button variant="ghost" size="sm" onClick={() => closeDrawer()}>Close</Button>
        </div>

        {items.length === 0 ? (
          <div className="text-muted-foreground">Your cart is empty.</div>
        ) : (
          <div className="space-y-3">
            {items.map((it) => (
              <Card key={it.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{it.title}</span>
                    <span className="text-sm font-medium">₹{it.price.toFixed(2)}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => updateQuantity(it.id, Math.max(1, it.quantity - 1))}>-</Button>
                      <div className="px-3">{it.quantity}</div>
                      <Button size="sm" variant="outline" onClick={() => updateQuantity(it.id, it.quantity + 1)}>+</Button>
                    </div>
                    <div className="text-sm text-muted-foreground">Subtotal: ₹{(it.price * it.quantity).toFixed(2)}</div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" size="sm" onClick={() => removeItem(it.id)}>Remove</Button>
                </CardFooter>
              </Card>
            ))}

            <div className="mt-4 flex items-center justify-between">
              <div className="text-lg font-semibold">Total: ₹{total.toFixed(2)}</div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => clear()}>Clear</Button>
                <Button onClick={() => alert('Checkout not implemented (frontend-only).')}>Checkout</Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CartDrawer;
