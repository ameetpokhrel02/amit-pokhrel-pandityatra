/**
 * Payment API Service
 * Handles payment gateway integrations (Stripe + Khalti)
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface PaymentIntent {
  success: boolean;
  gateway: 'STRIPE' | 'KHALTI';
  session_id?: string;
  checkout_url?: string;
  pidx?: string;
  payment_url?: string;
  payment_id: number;
}

export interface PaymentStatus {
  payment_status: string;
  payment_method: string;
  amount_npr: number;
  amount_usd: number;
  currency: string;
  transaction_id: string;
  completed_at: string | null;
}

export interface ExchangeRate {
  rate: number;
  base: string;
  target: string;
  converted?: {
    npr: number;
    usd: number;
  };
}

/**
 * Create payment intent (Stripe or Khalti)
 */
export const createPayment = async (
  bookingId: number,
  gateway: 'STRIPE' | 'KHALTI',
  currency: 'NPR' | 'USD',
  token: string
): Promise<PaymentIntent> => {
  const response = await axios.post(
    `${API_URL}/api/payments/create/`,
    {
      booking_id: bookingId,
      gateway,
      currency,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};

/**
 * Get payment status for a booking
 */
export const getPaymentStatus = async (
  bookingId: number,
  token: string
): Promise<PaymentStatus> => {
  const response = await axios.get(
    `${API_URL}/api/payments/status/${bookingId}/`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

/**
 * Get current exchange rate
 */
export const getExchangeRate = async (nprAmount?: number): Promise<ExchangeRate> => {
  const url = nprAmount
    ? `${API_URL}/api/payments/exchange-rate/?npr=${nprAmount}`
    : `${API_URL}/api/payments/exchange-rate/`;
  
  const response = await axios.get(url);
  return response.data;
};

/**
 * Verify Khalti payment
 */
export const verifyKhaltiPayment = async (
  pidx: string,
  token: string
): Promise<{ success: boolean; booking_id: number; transaction_id: string }> => {
  const response = await axios.get(
    `${API_URL}/api/payments/khalti/verify/?pidx=${pidx}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

/**
 * Load Stripe.js dynamically
 */
export const loadStripe = async (publishableKey: string) => {
  // Dynamically import Stripe
  const { loadStripe: stripeLoader } = await import('@stripe/stripe-js');
  return await stripeLoader(publishableKey);
};

/**
 * Open Khalti payment popup
 */
export const openKhaltiPopup = (paymentUrl: string) => {
  const width = 600;
  const height = 700;
  const left = (window.innerWidth - width) / 2;
  const top = (window.innerHeight - height) / 2;

  window.open(
    paymentUrl,
    'KhaltiPayment',
    `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
  );
};

/**
 * Format currency
 */
export const formatCurrency = (amount: number, currency: 'NPR' | 'USD'): string => {
  if (currency === 'NPR') {
    return `NPR ${amount.toFixed(2)}`;
  }
  return `$${amount.toFixed(2)}`;
};

/**
 * Detect user's preferred currency based on location
 */
export const detectPreferredCurrency = async (): Promise<'NPR' | 'USD'> => {
  try {
    // Try to get user's country from IP
    const response = await axios.get('https://ipapi.co/json/', { timeout: 3000 });
    const countryCode = response.data.country_code;
    
    // Nepal uses NPR, everyone else USD
    return countryCode === 'NP' ? 'NPR' : 'USD';
  } catch (error) {
    // Default to USD if geolocation fails
    return 'USD';
  }
};
