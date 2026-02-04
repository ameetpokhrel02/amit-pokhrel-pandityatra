import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, RefreshCw, Home } from 'lucide-react';
import { motion } from 'framer-motion';

const ShopPaymentFailure: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-red-50/30 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="max-w-md w-full border-0 shadow-2xl bg-white/80 backdrop-blur-xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-red-400 to-red-600" />
          <CardContent className="pt-10 pb-10 px-8 text-center space-y-6">

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="flex justify-center"
            >
              <div className="rounded-full bg-red-100 p-6 shadow-red-200/50 shadow-lg">
                <XCircle className="w-20 h-20 text-red-600" strokeWidth={2.5} />
              </div>
            </motion.div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Payment Failed</h1>
              <p className="text-gray-600 text-lg">
                We couldn't process your payment. Please try again or use a different payment method.
              </p>
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
                className="h-12 text-base bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20"
                onClick={() => navigate('/cart')}
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Try Again
              </Button>
            </div>

          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ShopPaymentFailure;
