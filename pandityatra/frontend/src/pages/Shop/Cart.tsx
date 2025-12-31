import React from 'react';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const CartPage: React.FC = () => {
  const { items, removeItem, updateQuantity, clear, total } = useCart();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-4">Your Cart</h1>
      {items.length === 0 ? (
        <div className="text-muted-foreground">Your cart is empty.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {items.map((it) => (
            <Card key={it.id} className="flex items-center justify-between">
              <CardHeader>
                <CardTitle>{it.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">Price: ₹{it.price.toFixed(2)}</div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => updateQuantity(it.id, Math.max(1, it.quantity - 1))}>-</Button>
                    <div className="px-3">{it.quantity}</div>
                    <Button size="sm" variant="outline" onClick={() => updateQuantity(it.id, it.quantity + 1)}>+</Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" onClick={() => removeItem(it.id)}>Remove</Button>
              </CardFooter>
            </Card>
          ))}

          <div className="flex items-center justify-between mt-4">
            <div className="text-lg font-semibold">Total: ₹{total.toFixed(2)}</div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => clear()}>Clear</Button>
              <Button onClick={() => alert('Checkout not implemented (frontend-only).')}>Proceed to Checkout</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
