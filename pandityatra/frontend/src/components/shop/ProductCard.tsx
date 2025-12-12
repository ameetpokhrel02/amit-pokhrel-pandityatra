import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';

interface ProductCardProps {
  id: number | string;
  title: string;
  description?: string;
  price: number;
  image?: string;
  externalLink?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ id, title, description, price, image, externalLink }) => {
  const { addItem } = useCart();

  const handleAdd = () => {
    // pass image into meta so CartDrawer can show thumbnail
    addItem({ id, title, price, meta: image ? { image } : undefined } as any, 1);
  };

  return (
    <Card className="w-full">
      {image ? (
        <div className="h-40 w-full overflow-hidden rounded-t-lg bg-muted">
          <img src={image} alt={title} className="h-full w-full object-cover" />
        </div>
      ) : null}
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="min-h-[48px] text-sm text-muted-foreground">{description}</div>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="text-lg font-semibold">₹{price.toFixed(2)}</div>
        <div className="flex items-center gap-2">
          {externalLink && (
            <a href={externalLink} target="_blank" rel="noreferrer">
              <Button variant="outline">View</Button>
            </a>
          )}
          <Button onClick={handleAdd}>Add to cart</Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
