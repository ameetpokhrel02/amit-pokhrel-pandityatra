import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';

interface ProductCardProps {
  id: number | string;
  title: string;
  description?: string;
  price: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({ id, title, description, price }) => {
  const { addItem } = useCart();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="min-h-[48px] text-sm text-muted-foreground">{description}</div>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="text-lg font-semibold">₹{price.toFixed(2)}</div>
        <Button
          onClick={() => addItem({ id, title, price }, 1)}
        >
          Add to cart
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
