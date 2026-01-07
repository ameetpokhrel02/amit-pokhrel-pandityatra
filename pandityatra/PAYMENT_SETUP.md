# Payment System - Quick Setup Guide

## ✅ What's Been Implemented

### Backend (Complete ✅)
- Payment models updated with dual currency support
- Stripe & Khalti integration
- Currency conversion utility
- Webhook handlers
- Video room creation (Daily.co)
- API endpoints for payment flow

### Frontend (Complete ✅)
- Payment page with gateway selection
- Success page with booking details
- Failure page with retry option
- Khalti verification page
- Payment API service
- Routes added to App.tsx

---

## 🚀 Setup Steps

### 1. Install Frontend Dependencies
```bash
cd frontend
npm install @stripe/stripe-js
```

### 2. Run Database Migrations
```powershell
cd E:\Final-Year-Project\Final-Year-Project\pandityatra
.\setup-payments.ps1
```

Or manually:
```bash
docker exec pandityatra-web-1 python manage.py makemigrations payments bookings
docker exec pandityatra-web-1 python manage.py migrate
```

### 3. Add Environment Variables

**Backend (.env in backend/)**
```env
# Stripe
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here

# Khalti  
KHALTI_SECRET_KEY=your_khalti_secret
KHALTI_PUBLIC_KEY=your_khalti_public

# Daily.co (optional for video calls)
DAILY_API_KEY=your_daily_api_key

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

**Frontend (.env in frontend/)**
```env
VITE_API_URL=http://localhost:8000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

### 4. Restart Services
```powershell
cd pandityatra
docker-compose down
docker-compose up -d
```

---

## 🧪 Testing the Payment Flow

### Test Anita's Story (from Australia)

1. **Create a Booking**
   - Login as a user
   - Browse pandits at `/pandits`
   - Select a pandit and create a booking
   - Go to "My Bookings"

2. **Navigate to Payment**
   - Click "Pay Now" button on the booking
   - Should redirect to `/payment/{bookingId}`

3. **Select Payment Method**
   - **For USD/Stripe:**
     - Click "USD" currency
     - Click "Pay with Stripe"
     - Use test card: `4242 4242 4242 4242`
     - Any future expiry, any CVC
   
   - **For NPR/Khalti:**
     - Click "NPR" currency
     - Click "Pay with Khalti"
     - Use Khalti test credentials

4. **Verify Success**
   - After payment, redirected to `/payment/success`
   - See booking details and video room link (if online puja)
   - Check "My Bookings" - status should be "Accepted"

---

## 🔑 Getting Test API Keys

### Stripe Test Keys
1. Go to https://dashboard.stripe.com/
2. Sign up / Login
3. Switch to "Test mode" (top right toggle)
4. Get keys from **Developers > API Keys**
5. Get webhook secret:
   - Go to **Developers > Webhooks**
   - Click "Add endpoint"
   - URL: `http://localhost:8000/api/payments/webhook/stripe/`
   - Events: Select "checkout.session.completed"
   - Copy the signing secret

### Khalti Test Keys
1. Go to https://khalti.com/
2. Sign up as merchant
3. Go to dashboard
4. Get Test keys from Settings

### Daily.co API Key
1. Go to https://dashboard.daily.co/
2. Sign up
3. Go to **Developers**
4. Create API key

---

## 📱 Payment Flow Overview

```
User Journey:
1. Create booking → My Bookings page
2. Click "Pay Now" → Payment page (/payment/{id})
3. Select currency (NPR/USD)
4. Select gateway (Khalti/Stripe)
5. Click "Pay" button

Stripe Flow:
→ Redirect to Stripe checkout
→ Complete payment
→ Stripe webhook updates backend
→ Redirect to /payment/success

Khalti Flow:
→ Redirect to Khalti payment
→ Complete payment
→ Redirect to /payment/khalti/verify
→ Backend verifies with Khalti
→ Redirect to /payment/success
```

---

## 🎯 Key Features

✅ **Auto Currency Detection** - Detects user location (Nepal = NPR, Other = USD)
✅ **Real-time Exchange Rates** - Cached for 1 hour
✅ **Dual Gateway Support** - Khalti for Nepal, Stripe for international
✅ **Video Room Creation** - Automatic Daily.co room for online pujas
✅ **Webhook Verification** - Secure payment confirmation
✅ **Payment Status Tracking** - Real-time status updates
✅ **Responsive UI** - Works on mobile and desktop
✅ **Error Handling** - Clear error messages and retry options

---

## 🐛 Troubleshooting

### "Stripe not configured" error
- Check if `STRIPE_SECRET_KEY` is set in backend/.env
- Restart backend: `docker-compose restart web`

### Khalti payment fails immediately
- Verify `KHALTI_SECRET_KEY` is correct
- Check Khalti dashboard for test mode status

### Payment succeeds but booking not updated
- Check webhook logs: `docker exec pandityatra-web-1 python manage.py shell`
- Query: `from payments.models import PaymentWebhook; PaymentWebhook.objects.all()`

### Video room not created
- Check `DAILY_API_KEY` is set
- Verify Daily.co account is active
- Check Docker logs: `docker logs pandityatra-web-1`

### Exchange rate shows 0 or incorrect
- Test API: `curl http://localhost:8000/api/payments/exchange-rate/`
- Check internet connectivity in Docker container
- Clear cache: `docker exec pandityatra-redis-1 redis-cli FLUSHALL`

---

## 📂 File Structure

```
backend/
├── payments/
│   ├── models.py          # Payment & Booking models
│   ├── views.py           # Payment views & webhooks
│   ├── urls.py            # Payment endpoints
│   └── utils.py           # Currency, video room utils

frontend/src/
├── lib/
│   └── payment-api.ts     # Payment API service
├── pages/
│   └── Payment/
│       ├── PaymentPage.tsx
│       ├── PaymentSuccess.tsx
│       ├── PaymentFailure.tsx
│       └── KhaltiVerify.tsx
```

---

## 🚀 Next Steps

1. **Run Migrations**: `.\setup-payments.ps1`
2. **Add API Keys**: Update `.env` files
3. **Install Dependencies**: `cd frontend && npm install @stripe/stripe-js`
4. **Test**: Create booking and complete payment
5. **Deploy**: Configure production webhooks

---

## 📞 Support

For issues or questions:
- Check logs: `docker logs pandityatra-web-1`
- Review webhook logs in Django admin
- See full docs: `docs/PAYMENT_IMPLEMENTATION_GUIDE.md`

**Status**: Frontend & Backend Complete ✅
**Last Updated**: January 7, 2026
