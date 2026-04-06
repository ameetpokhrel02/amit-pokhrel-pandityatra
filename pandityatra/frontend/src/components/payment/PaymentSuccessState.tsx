import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, CreditCard, ExternalLink, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PaymentSuccessStateProps {
  gateway: 'ESEWA' | 'KHALTI' | 'STRIPE' | 'CASH' | string;
  transactionId?: string;
  amount?: string | number;
  currency?: string;
  title?: string;
  subtitle?: string;
  isFirstBooking?: boolean;
  onAction?: () => void;
  actionText?: string;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  children?: React.ReactNode;
}

export const PaymentSuccessState: React.FC<PaymentSuccessStateProps> = ({
  gateway,
  transactionId,
  amount,
  currency = 'NPR',
  title = "Payment Successful!",
  subtitle = "Thank you for your trust.",
  isFirstBooking = false,
  onAction,
  actionText = "View Details",
  secondaryActionText = "Go Home",
  onSecondaryAction,
  children
}) => {
  
  const getGatewayLogo = () => {
    switch (gateway?.toUpperCase()) {
      case 'ESEWA':
        return (
          <img 
            src="/images/esewa.jpg" 
            alt="eSewa" 
            className="h-10 object-contain rounded shadow-sm"
          />
        );
      case 'KHALTI':
        return (
          <img 
            src="/images/khalti.jpeg" 
            alt="Khalti" 
            className="h-10 object-contain rounded shadow-sm"
          />
        );
      case 'STRIPE':
        return (
          <div className="flex items-center gap-2 bg-[#635BFF] py-1.5 px-3 rounded text-white shadow-sm">
            <CreditCard size={18} />
            <span className="font-bold text-sm tracking-tight">Stripe</span>
          </div>
        );
      default:
        return (
          <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center">
            <CreditCard className="text-gray-400" />
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl overflow-hidden rounded-3xl">
        <div className="h-2 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600" />
        
        <CardContent className="p-8 pt-10 space-y-8">
          
          {/* Success Icon Section */}
          <div className="flex flex-col items-center text-center space-y-4">
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="relative"
            >
              <div className="rounded-full bg-green-50 p-6 ring-8 ring-green-50/50 shadow-lg shadow-green-100">
                <CheckCircle className="w-16 h-16 text-green-600" strokeWidth={3} />
              </div>
              {isFirstBooking && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="absolute -top-4 -right-8 bg-orange-100 text-orange-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-orange-200 shadow-sm"
                >
                  NEW USERS FOR BOOKING PANDIT PUJA
                </motion.div>
              )}
            </motion.div>

            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 tracking-tight">
                {title}
              </h1>
              <p className="text-gray-600 font-medium">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Gateway & Details Section */}
          <div className="bg-orange-50/40 rounded-2xl p-6 border border-orange-100/50 space-y-5">
            <div className="flex justify-between items-center pb-4 border-b border-orange-100/60">
              <div className="space-y-1">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Paid via</p>
                {getGatewayLogo()}
              </div>
              <div className="text-right space-y-1">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Amount Paid</p>
                <div className="text-lg font-bold text-gray-900">
                  {amount} {currency}
                </div>
              </div>
            </div>

            {transactionId && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Transaction ID</span>
                <code className="bg-white px-2 py-1 rounded font-mono text-[11px] text-orange-700 border border-orange-100">
                  {transactionId}
                </code>
              </div>
            )}
          </div>

          {/* Optional Content */}
          {children}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {onAction && (
              <Button 
                onClick={onAction}
                className="h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-100 transition-all hover:-translate-y-0.5"
              >
                {actionText}
              </Button>
            )}
            {onSecondaryAction && (
              <Button 
                variant="outline"
                onClick={onSecondaryAction}
                className="h-14 rounded-2xl border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
              >
                {secondaryActionText}
              </Button>
            )}
          </div>

          {/* Helpful Tip */}
          <div className="flex items-start gap-3 bg-blue-50/50 p-4 rounded-xl border border-blue-50">
            <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700 leading-relaxed font-medium">
              A detailed confirmation of your payment and booking has been emailed to you. You can also access your invoices under your profile settings.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
