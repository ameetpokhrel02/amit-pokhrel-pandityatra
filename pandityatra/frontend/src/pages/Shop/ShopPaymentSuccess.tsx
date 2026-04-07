import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import Confetti from 'react-confetti';
import { PaymentSuccessState } from '@/components/payment/PaymentSuccessState';
import apiClient from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

const ShopPaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // Get order ID from search params or session storage
  const orderId = searchParams.get('order_id') || sessionStorage.getItem('last_order_id');
  
  // Get payment metadata from session storage
  const sessionId = searchParams.get('session_id');
  const lastPaymentMethod = sessionStorage.getItem('last_payment_method') || (sessionId ? 'STRIPE' : 'ESEWA');
  const lastTransactionId = sessionStorage.getItem('last_transaction_id') || '';

  const [verifying, setVerifying] = React.useState(!!sessionId);
  const [paymentStatus, setPaymentStatus] = React.useState('PENDING');
  const [orderData, setOrderData] = React.useState<{
    order_id: string;
    amount: string;
    transaction_id: string;
    date: string;
  } | null>(null);

  React.useEffect(() => {
    const verifyStripeRef = async () => {
      // If we have a sessionId, it's definitely a Stripe session we should verify
      if (sessionId) {
        try {
          const response = await apiClient.get(`/payments/verify-stripe/?session_id=${sessionId}&order_id=${orderId}`);
          if (response.data.success) {
            setPaymentStatus('PAID');
            // Format Stripe timestamp if it exists, otherwise use current date
            const dateStr = response.data.date 
              ? new Date(response.data.date * 1000).toLocaleDateString("en-IN", {
                  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })
              : new Date().toLocaleDateString();

            setOrderData({
              order_id: response.data.order_id || orderId || 'N/A',
              amount: response.data.amount ? `Rs. ${response.data.amount}` : (sessionStorage.getItem('last_order_amount') || 'N/A'),
              transaction_id: response.data.transaction_id || 'N/A',
              date: dateStr,
            });
            toast({
              title: "Payment Verified",
              description: "Your order status has been updated to PAID.",
            });
          } else {
            console.error("Payment not verified", response.data.message);
            setPaymentStatus('FAILED');
          }
        } catch (error) {
          console.error("Stripe verification failed:", error);
        } finally {
          setVerifying(false);
        }
      }
    };

    verifyStripeRef();
  }, [sessionId, orderId, toast]);

  return (
    <div className="min-h-screen bg-orange-50/10 flex items-center justify-center p-4 relative overflow-hidden font-inter">
      <Confetti
        recycle={false}
        numberOfPieces={500}
        gravity={0.15}
      />
      
      <PaymentSuccessState
        gateway={lastPaymentMethod}
        transactionId={orderData?.transaction_id || sessionId || lastTransactionId}
        amount={orderData?.amount || sessionStorage.getItem('last_order_amount') || ''}
        title={verifying ? "Verifying Payment..." : "Order Placed!"}
        subtitle={verifying 
          ? "Please wait while we confirm your transaction." 
          : paymentStatus === 'PAID' 
            ? "Your samagri order has been successfully confirmed and paid." 
            : "Your order has been placed successfully."
        }
        onAction={() => navigate('/shop/samagri')}
        actionText="Shop More Samagri"
        onSecondaryAction={() => navigate('/dashboard')}
        secondaryActionText="View My Orders"
      >
        <div className="bg-white/50 border border-orange-100/50 rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
          <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mb-2">
            <ShoppingBag size={24} />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Order ID</p>
            <p className="text-2xl font-mono font-bold text-gray-800">#{orderData?.order_id || orderId || 'N/A'}</p>
          </div>
          {orderData?.date && (
            <p className="text-[10px] text-gray-400 font-medium">
              Confirmed on {orderData.date}
            </p>
          )}
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
