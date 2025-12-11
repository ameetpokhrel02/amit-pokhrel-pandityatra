import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { ShoppingCart, Eye } from 'lucide-react';

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
    <Card className="w-full group overflow-hidden hover:shadow-lg transition-all duration-300 border-slate-200">
      <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 relative">
        {image ? (
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-slate-400 bg-slate-50">
            <ShoppingCart className="w-12 h-12 opacity-20" />
          </div>
        )}
        {/* Quick Actions Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
          {externalLink && (
            <a href={externalLink} target="_blank" rel="noreferrer">
              <Button size="icon" variant="secondary" className="rounded-full bg-white hover:bg-white text-slate-800 hover:scale-110 transition-transform">
                <Eye className="w-4 h-4" />
              </Button>
            </a>
          )}
          <Button size="icon" className="rounded-full bg-orange-600 hover:bg-orange-700 text-white hover:scale-110 transition-transform shadow-lg border-0" onClick={handleAdd}>
            <ShoppingCart className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-bold text-slate-800 line-clamp-1 mb-1 group-hover:text-orange-600 transition-colors">{title}</h3>
        <p className="text-sm text-slate-500 line-clamp-2 min-h-[2.5rem] leading-relaxed">{description}</p>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div className="text-lg font-bold text-slate-800">₹{price.toFixed(2)}</div>
        <Button
          size="sm"
          className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-0 font-medium"
          onClick={handleAdd}
        >
          Add
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
