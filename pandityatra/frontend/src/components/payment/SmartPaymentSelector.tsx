import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, Smartphone, MapPin, Globe } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';
import apiClient from '@/lib/api-client';

interface PaymentMethod {
  id: 'KHALTI' | 'STRIPE';
  name: string;
  description: string;
  icon: React.ReactNode;
  currency: string;
  recommended: boolean;
  available: boolean;
  processingFee: string;
}

interface SmartPaymentSelectorProps {
  bookingId: number;
  amount: number;
  onPaymentInitiated: (paymentUrl: string, gateway: string) => void;
  onError: (error: string) => void;
}

export const SmartPaymentSelector: React.FC<SmartPaymentSelectorProps> = ({
  bookingId,
  amount,
  onPaymentInitiated,
  onError
}) => {
  const { 
    country, 
    currency, 
    recommendedPaymentGateway, 
    getLocationContext 
  } = useLocation();
  
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);

  useEffect(() => {
    // Auto-select recommended payment method
    setSelectedMethod(recommendedPaymentGateway);
    
    // Fetch exchange rate if needed
    if (currency !== 'NPR') {
      fetchExchangeRate();
    }
  }, [recommendedPaymentGateway, currency]);

  const fetchExchangeRate = async () => {
    try {
      const response = await apiClient.get('/payments/exchange-rate/', {
        params: { npr: amount }
      });
      setExchangeRate(response.data.rate);
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
    }
  };

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'KHALTI',
      name: 'Khalti',
      description: 'Digital wallet for Nepal',
      icon: <Smartphone className="w-5 h-5" />,
      currency: 'NPR',
      recommended: recommendedPaymentGateway === 'KHALTI',
      available: true,
      processingFee: '2.5%'
    },
    {
      id: 'STRIPE',
      name: 'Credit/Debit Card',
      description: 'International cards accepted',
      icon: <CreditCard className="w-5 h-5" />,
      currency: currency === 'NPR' ? 'USD' : currency,
      recommended: recommendedPaymentGateway === 'STRIPE',
      available: true,
      processingFee: '3.4% + $0.30'
    }
  ];

  const getConvertedAmount = (method: PaymentMethod) => {
    if (method.currency === 'NPR') {
      return { amount, currency: 'NPR', symbol: '₹' };
    }
    
    if (exchangeRate && method.currency === 'USD') {
      const usdAmount = amount / exchangeRate;
      return { 
        amount: usdAmount.toFixed(2), 
        currency: 'USD', 
        symbol: '$' 
      };
    }
    
    return { amount, currency: method.currency, symbol: '$' };
  };

  const handlePayment = async (methodId: string) => {
    setLoading(true);
    try {
      const locationContext = getLocationContext();
      
      const response = await apiClient.post('/payments/create-intent/', {
        booking_id: bookingId,
        gateway: methodId,
        currency: methodId === 'KHALTI' ? 'NPR' : currency,
        location_context: locationContext
      });

      if (response.data.success) {
        const paymentUrl = response.data.checkout_url || response.data.payment_url;
        onPaymentInitiated(paymentUrl, methodId);
      } else {
        onError('Failed to initiate payment');
      }
    } catch (error: any) {
      console.error('Payment initiation failed:', error);
      onError(error.response?.data?.error || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Location Context */}
      {country && (
        <Alert className="bg-blue-50 border-blue-200">
          <MapPin className="w-4 h-4" />
          <AlertDescription className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Detected location: {country}
            <Badge variant="outline" className="ml-2">
              {currency} recommended
            </Badge>
          </AlertDescription>
        </Alert>
      )}

      {/* Payment Methods */}
      <div className="grid gap-4">
        {paymentMethods.map((method) => {
          const convertedAmount = getConvertedAmount(method);
          const isSelected = selectedMethod === method.id;
          const isRecommended = method.recommended;

          return (
            <Card 
              key={method.id}
              className={`cursor-pointer transition-all ${
                isSelected 
                  ? 'ring-2 ring-orange-500 border-orange-500' 
                  : 'hover:border-gray-300'
              } ${isRecommended ? 'bg-orange-50' : ''}`}
              onClick={() => setSelectedMethod(method.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      method.id === 'KHALTI' ? 'bg-purple-100' : 'bg-blue-100'
                    }`}>
                      {method.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{method.name}</h3>
                        {isRecommended && (
                          <Badge className="bg-orange-500 text-white text-xs">
                            Recommended
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{method.description}</p>
                      <p className="text-xs text-gray-500">
                        Processing fee: {method.processingFee}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {convertedAmount.symbol}{convertedAmount.amount}
                    </div>
                    <div className="text-sm text-gray-500">
                      {convertedAmount.currency}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Exchange Rate Info */}
      {exchangeRate && currency !== 'NPR' && (
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          <div className="flex justify-between">
            <span>Exchange Rate:</span>
            <span>1 USD = ₹{exchangeRate.toFixed(2)} NPR</span>
          </div>
        </div>
      )}

      {/* Pay Button */}
      <Button
        onClick={() => selectedMethod && handlePayment(selectedMethod)}
        disabled={!selectedMethod || loading}
        className="w-full h-12 text-base bg-orange-600 hover:bg-orange-700"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Processing...
          </>
        ) : (
          `Pay Now`
        )}
      </Button>
    </div>
  );
};

export default SmartPaymentSelector;