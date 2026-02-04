import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ShoppingBag, Home } from 'lucide-react';
import { motion } from 'framer-motion';

const ShopPaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    // Optionally: Verify payment status with backend here if needed
    // const sessionId = searchParams.get('session_id');
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-orange-50/30 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="max-w-md w-full border-0 shadow-2xl bg-white/80 backdrop-blur-xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-green-400 to-green-600" />
          <CardContent className="pt-10 pb-10 px-8 text-center space-y-6">

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="flex justify-center"
            >
              <div className="rounded-full bg-green-100 p-6 shadow-green-200/50 shadow-lg">
                <CheckCircle className="w-20 h-20 text-green-600" strokeWidth={2.5} />
              </div>
            </motion.div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Order Placed!</h1>
              <p className="text-gray-600 text-lg">
                Your samagri order has been successfully confirmed.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100/50 flex flex-col gap-3">
              <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Order ID</p>
              <p className="text-2xl font-mono font-bold text-gray-800">#{orderId || 'Unknown'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <Button
                variant="outline"
                className="h-12 text-base border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                onClick={() => navigate('/')}
              >
                <Home className="w-4 h-4 mr-2" /> Home
              </Button>
              <Button
                className="h-12 text-base bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-500/20"
                onClick={() => navigate('/shop/samagri')}
              >
                <ShoppingBag className="w-4 h-4 mr-2" /> Shop More
              </Button>
            </div>

          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ShopPaymentSuccess;
