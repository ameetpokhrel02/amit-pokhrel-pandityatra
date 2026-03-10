import React from 'react';
import { useCart } from '@/hooks/useCart';
import { ShoppingCart } from 'lucide-react';
import type { ChatProductType } from '@/hooks/useChat';

export const ChatProductCard: React.FC<{ product: ChatProductType }> = ({ product }) => {
  const { addItem, openDrawer } = useCart();

  const handleAddToCart = () => {
    addItem({
      id: String(product.id),
      title: product.name,
      price: product.price,
      image: product.image || undefined,
    });
    openDrawer();
  };

  return (
    <div className="flex bg-white rounded-md shadow-sm border border-orange-100 overflow-hidden mt-2 max-w-[240px] transition-transform hover:shadow-md">
      {product.image && (
        <div className="w-20 h-20 flex-shrink-0 bg-orange-50">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="flex flex-col justify-between p-2 flex-grow min-w-0">
        <div>
          <h4 className="text-xs font-semibold text-gray-800 truncate" title={product.name}>{product.name}</h4>
          <p className="text-xs font-medium text-orange-600 mt-0.5">Rs {product.price}</p>
        </div>
        <button
          onClick={handleAddToCart}
          className="flex items-center justify-center space-x-1 mt-2 bg-orange-600 hover:bg-orange-700 text-white text-[10px] uppercase font-bold py-1.5 px-2 rounded transition-colors w-full"
        >
          <ShoppingCart className="w-3 h-3" />
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  );
};
