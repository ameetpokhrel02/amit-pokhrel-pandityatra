import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import Confetti from 'react-confetti';
import { PaymentSuccessState } from '@/components/payment/PaymentSuccessState';

const ShopPaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get order ID from search params or session storage
  const orderId = searchParams.get('order_id') || sessionStorage.getItem('last_order_id');
  
  // Get payment metadata from session storage
  const lastPaymentMethod = sessionStorage.getItem('last_payment_method') || 'ESEWA';
  const lastTransactionId = sessionStorage.getItem('last_transaction_id') || '';

  return (
    <div className="min-h-screen bg-orange-50/10 flex items-center justify-center p-4 relative overflow-hidden font-inter">
      <Confetti
        recycle={false}
        numberOfPieces={500}
        gravity={0.15}
      />
      
      <PaymentSuccessState
        gateway={lastPaymentMethod}
        transactionId={lastTransactionId}
        title="Order Placed!"
        subtitle="Your samagri order has been successfully confirmed."
        onAction={() => navigate('/shop/samagri')}
        actionText="Shop More Samagri"
        onSecondaryAction={() => navigate('/')}
        secondaryActionText="Back to Home"
      >
        <div className="bg-white/50 border border-orange-100/50 rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
          <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mb-2">
            <ShoppingBag size={24} />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Order ID</p>
            <p className="text-2xl font-mono font-bold text-gray-800">#{orderId || 'N/A'}</p>
          </div>
          <p className="text-xs text-gray-500 mt-2 px-4">
            Our vendors are notified and will prepare your samagari for delivery as scheduled.
          </p>
        </div>
      </PaymentSuccessState>

      <div className="absolute bottom-8 left-0 right-0 text-center relative z-10">
        <p className="text-gray-400 text-xs">
          Secure Shopping Experience on PanditYatra Samagri Store
        </p>
      </div>
    </div>
  );
};

export default ShopPaymentSuccess;
