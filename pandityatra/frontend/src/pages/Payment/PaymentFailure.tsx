/**
 * Payment Failure/Cancel Page
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, HelpCircle, RefreshCw } from 'lucide-react';

interface LocationState {
  error?: string;
}

const PaymentFailure: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  const backendError = state?.error;

  const handleRetry = () => {
    // Get booking ID from session storage
    const bookingId = sessionStorage.getItem('pending_booking_id');
    if (bookingId) {
      navigate(`/payment/${bookingId}`);
    } else {
      navigate('/my-bookings');
    }
  };

  const handleChangeMethod = () => {
    // Go back to payment page to select a different method
    const bookingId = sessionStorage.getItem('pending_booking_id');
    if (bookingId) {
      navigate(`/payment/${bookingId}`, { state: { changeMethod: true } });
    } else {
      navigate('/my-bookings');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardContent className="pt-8 pb-6 px-6 space-y-6">
          {/* Failure Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-red-100 p-4">
              <XCircle className="w-16 h-16 text-red-600" />
            </div>
          </div>

          {/* Failure Message */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Payment Cancelled</h1>
            <p className="text-gray-600">
              Your payment was not completed. Don't worry, you can try again.
            </p>
            {backendError && (
              <div className="mt-2 text-xs text-red-500 bg-red-50 border border-red-200 rounded p-2">
                <strong>Reason:</strong> {backendError}
              </div>
            )}
          </div>

          {/* Reasons */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              Common reasons for payment failure:
            </h3>
            <ul className="text-sm text-amber-800 space-y-1 ml-6 list-disc">
              <li>Insufficient balance in account</li>
              <li>Payment window was closed before completion</li>
              <li>Network connectivity issues</li>
              <li>Incorrect payment details</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleRetry}
              className="w-full h-12 bg-primary hover:bg-primary/90"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Payment Again
            </Button>

            <Button
              onClick={handleChangeMethod}
              variant="secondary"
              className="w-full h-12"
            >
              Change Payment Method
            </Button>

            <Button
              onClick={() => navigate('/my-bookings')}
              variant="outline"
              className="w-full h-12"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to My Bookings
            </Button>
          </div>

          {/* Help Section */}
          <div className="border-t pt-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-900 mb-2">
                <strong>Need assistance?</strong>
              </p>
              <p className="text-xs text-blue-800 mb-3">
                Our support team is here to help you complete your booking
              </p>
              <div className="flex gap-3 justify-center text-xs">
                <a 
                  href="mailto:support@pandityatra.com" 
                  className="text-blue-600 hover:underline"
                >
                  📧 Email Support
                </a>
                <span className="text-blue-400">|</span>
                <a 
                  href="tel:+977-9841234567" 
                  className="text-blue-600 hover:underline"
                >
                  📞 Call Us
                </a>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-center text-xs text-gray-500">
            <p>No amount has been deducted from your account</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentFailure;
