# 📊 PanditYatra - Project Structure & Completeness Analysis

## 🏗️ **Backend Architecture Overview**

### ✅ **Existing Modules**
```
backend/
├── users/              ✅ Authentication (OTP, JWT)
├── pandits/            ⚠️ Pandit profiles (missing verification flow)
├── services/           ✅ Puja services with CRUD
├── bookings/           ⚠️ Model exists (missing views & endpoints)
├── payments/           ❌ Empty (no model, no logic)
├── samagri/            ⚠️ Models exist (missing APIs/views)
├── recommender/        ❌ Empty (no model, no logic)
├── kundali/            ❌ Empty (no model, no logic)
└── pandityatra_backend/ ✅ Settings & URL routing
```

---

## 📋 **Database Models Status**

### 1️⃣ **Users** ✅ COMPLETE
```python
Fields: username, password, phone_number, full_name, email, profile_pic_url, role
Roles: user, pandit, admin
Status: READY TO USE
```

### 2️⃣ **Pandits** ⚠️ PARTIAL
```python
Current Fields: user (OneToOne), expertise, language, experience_years, rating, bio, is_available, is_verified
MISSING:
  ❌ certification_file (for document upload)
  ❌ verification_status (PENDING/APPROVED/REJECTED)
  ❌ verified_date
  ❌ location / city
  ❌ rating_count
```

### 3️⃣ **Services/Pujas** ✅ COMPLETE
```python
Fields: pandit (FK), name, description, duration_minutes, price, is_available
Status: READY - API endpoints working
```

### 4️⃣ **Bookings** ⚠️ PARTIAL
```python
Current Fields: user, pandit, service_name, service_location, booking_date, booking_time, status, fee, payment_status
MISSING:
  ❌ puja (FK to Puja model - should link to services)
  ❌ samagri_items (M2M for recommended items)
  ❌ special_notes (from customer)
  ❌ video_room_link (Whereby)
  ❌ recorded_video_url
```

### 5️⃣ **Payments** ❌ EMPTY
```python
NEEDS:
  ✅ Model: Payment
  Fields: booking (FK), amount, currency, payment_method (Khalti/Stripe), transaction_id, status, created_at
  ✅ Views: Payment creation, webhook handling
  ✅ Serializers: Payment serialization
```

### 6️⃣ **Samagri** ⚠️ PARTIAL
```python
Models Exist:
  - SamagriCategory
  - SamagriItem
  - PujaSamagriRequirement
MISSING:
  ❌ API Views (no endpoints)
  ❌ Serializers
  ❌ URL routing partially missing
```

### 7️⃣ **Recommender** ❌ EMPTY
```python
NEEDS:
  ✅ Model: AIRecommendation or SamagriRecommendation
  Fields: puja (FK), samagri_item (FK), is_recommended, reason, created_date
  ✅ Views: Recommend samagri for a puja
  ✅ Logic: Rule-based recommendation engine (by occasion)
```

### 8️⃣ **Kundali** ❌ EMPTY
```python
NEEDS:
  ✅ Model: Kundali
  Fields: user (FK), name, dob, time_of_birth, place_of_birth, chart_data (JSON), predictions (JSON)
  ✅ Views: Generate offline Kundali
  ✅ Logic: Link to WebAssembly for calculations
```

---

## 🔌 **API Endpoints Coverage**

### ✅ WORKING
```
POST   /api/users/register/           - User registration
POST   /api/users/request-otp/        - Request OTP
POST   /api/users/login-otp/          - Verify OTP & login
GET    /api/pandits/                  - List all pandits
POST   /api/pandits/                  - Create pandit profile
GET    /api/pandits/{id}/             - Get pandit detail
PUT    /api/pandits/{id}/             - Update pandit
DELETE /api/pandits/{id}/             - Delete pandit
GET    /api/services/                 - List all pujas
POST   /api/services/                 - Create puja (admin)
GET    /api/services/{id}/            - Get puja detail
PUT    /api/services/{id}/            - Update puja
DELETE /api/services/{id}/            - Delete puja
```

### ❌ MISSING
```
BOOKINGS:
POST   /api/bookings/                 - Create booking (customer)
GET    /api/bookings/                 - List bookings (user's own)
GET    /api/bookings/{id}/            - Get booking detail
PATCH  /api/bookings/{id}/status/     - Update booking status (pandit)
DELETE /api/bookings/{id}/            - Cancel booking

PAYMENTS:
POST   /api/payments/                 - Create payment
GET    /api/payments/                 - List payments
POST   /api/payments/webhook/         - Handle Stripe/Khalti webhook
GET    /api/payments/{id}/            - Get payment detail

SAMAGRI:
GET    /api/samagri/                  - List samagri items
GET    /api/samagri/categories/       - List categories
POST   /api/samagri/recommend/        - Recommend samagri for puja

KUNDALI:
POST   /api/kundali/generate/         - Generate kundali
GET    /api/kundali/                  - Get user's kundalis

REVIEWS:
POST   /api/reviews/                  - Create review (customer)
GET    /api/reviews/pandit/{id}/      - Get reviews for pandit

AVAILABILITY:
GET    /api/pandits/{id}/availability/ - Get pandit availability
PATCH  /api/pandits/{id}/availability/ - Update availability (block dates)

PANDITS (ADMIN):
GET    /api/pandits/pending/          - List pending pandits
POST   /api/pandits/{id}/verify/      - Approve pandit
POST   /api/pandits/{id}/reject/      - Reject pandit
```

---

## 📂 **Frontend Pages Structure**

### ✅ EXISTING
```
frontend/src/pages/
├── Home.tsx                ✅ Home page
├── AboutUs.tsx             ✅ About page
├── auth/                   ⚠️ Login/signup flows
├── Dashboard/              ⚠️ User dashboard
├── Booking/                ❌ Empty
├── MyBookings.tsx          ❌ Not showing bookings
├── PanditRecommendations.tsx ⚠️ Recommendations page
├── Kundali/                ⚠️ Kundali generation
└── Shop/
    └── PujaCategories.tsx  ✅ Puja list (just updated)
```

### ❌ MISSING PAGES
```
CUSTOMER:
- /shop/cart           - Shopping cart
- /shop/checkout       - Checkout flow
- /bookings/{id}       - View booking detail
- /bookings/{id}/join  - Join video puja
- /reviews/create      - Write review
- /profile             - Edit profile
- /samagri/shop        - Browse samagri

PANDIT:
- /pandit/dashboard    - Pandit dashboard
- /pandit/profile      - Edit pandit profile
- /pandit/services     - Manage services
- /pandit/bookings     - View bookings
- /pandit/earnings     - Earnings dashboard
- /pandit/availability - Manage availability

ADMIN:
- /admin/dashboard     - Admin dashboard
- /admin/pandits/pending - Approve pandits
- /admin/users         - Manage users
- /admin/bookings      - View all bookings
- /admin/payments      - View payments
```

---

## 🎯 **Business Logic Missing**

### 1. **Booking Workflow** ❌
```
Current: Booking model exists but incomplete
Missing:
  - Validate booking date/time against pandit availability
  - Calculate total price (puja + samagri)
  - Reserve time slot
  - Send SMS notifications
  - Create video room link (Whereby)
  - Handle cancellation with refund logic
```

### 2. **Payment Processing** ❌
```
Missing:
  - Stripe integration (webhook handling)
  - Khalti integration (webhook handling)
  - Payment status tracking
  - Refund logic
  - Currency conversion (NPR/USD/AUD)
  - Invoice generation
```

### 3. **Availability Management** ❌
```
Missing:
  - Pandit can block/unblock dates
  - Check available time slots
  - Prevent double booking
  - Auto-generate time slots
```

### 4. **AI Recommendation Engine** ❌
```
Missing:
  - Rule-based samagri recommendations by puja type
  - Store recommendations in database
  - API endpoint to get recommendations
  - Rule configuration (admin panel)
```

### 5. **Reviews & Ratings** ❌
```
Missing:
  - Review model (not found in any app)
  - Create review endpoint
  - List reviews by pandit
  - Calculate average rating
  - Prevent multiple reviews by same user
```

### 6. **Video Integration** ❌
```
Missing:
  - Whereby room creation
  - Room link storage in booking
  - Join video endpoint
  - Recording storage/retrieval
```

### 7. **Kundali Generation** ❌
```
Missing:
  - Kundali model & API
  - WebAssembly integration
  - Offline generation capability
  - PDF export
```

---

## 🚨 **Critical Issues to Fix**

### Priority 1: ARCHITECTURE (Must do)
- [ ] Create Review model and app
- [ ] Complete Payments model and logic
- [ ] Fix Booking model (link to Puja instead of service_name)
- [ ] Add Availability model for pandit schedules
- [ ] Update Pandit model with verification fields

### Priority 2: API ENDPOINTS (Core features)
- [ ] Complete Booking CRUD & workflow
- [ ] Complete Payment integration
- [ ] Add Samagri endpoints
- [ ] Add Review endpoints
- [ ] Add Availability endpoints
- [ ] Add Pandit verification (admin)

### Priority 3: BUSINESS LOGIC
- [ ] Booking date/time validation
- [ ] AI recommendation logic
- [ ] Video room creation (Whereby)
- [ ] Payment webhook handling
- [ ] Notification system (SMS)

### Priority 4: FRONTEND PAGES
- [ ] Create all customer pages
- [ ] Create all pandit pages
- [ ] Create admin dashboard
- [ ] Connect to working APIs

---

## 📋 **Folder/App Structure Normalization**

### Current Issues:
1. **payments/** - App exists but is completely empty
2. **recommender/** - App exists but no models/logic
3. **kundali/** - App exists but is completely empty
4. Missing: **reviews/** app (no review model anywhere)
5. Missing: **availability/** logic (no separate app, should be in pandits)
6. Missing: **cart/** logic (no app, should handle shopping cart)

### Recommended Structure:
```
backend/
├── users/              ✅ Authentication
├── pandits/            ✅ Pandit profiles + availability
├── services/           ✅ Puja services
├── bookings/           ⚠️ Bookings + workflow
├── payments/           ❌→ COMPLETE THIS
├── samagri/            ⚠️ Samagri items + recommendations
├── reviews/            ❌ CREATE NEW APP
├── kundali/            ❌ COMPLETE THIS
├── recommender/        ⚠️ Recommendation engine
├── cart/               ❌ CREATE NEW APP (for shopping)
└── pandityatra_backend/ ✅ Settings
```

---

## ✅ **Quick Summary**

| Component | Status | Priority |
|-----------|--------|----------|
| User Auth | ✅ 90% | Done (except pandit verification) |
| Pandit Profiles | ⚠️ 60% | High - add verification |
| Services/Pujas | ✅ 100% | Complete |
| Bookings | ⚠️ 50% | High - implement logic |
| Payments | ❌ 0% | Critical - must implement |
| Samagri | ⚠️ 50% | Medium - add APIs |
| Reviews | ❌ 0% | Medium - create app |
| Kundali | ❌ 0% | Low - can wait |
| Recommender | ❌ 0% | Medium - implement logic |
| Frontend | ⚠️ 20% | High - create pages |

---

**Next Action**: Which area should we focus on first?
1. **Payment System** (critical for platform)
2. **Booking Workflow** (core feature)
3. **Reviews System** (user engagement)
4. **Frontend Pages** (user experience)
