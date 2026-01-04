# 🔐 PanditYatra Authentication - Current Status vs Roadmap

## ✅ WHAT'S IMPLEMENTED (70% Complete)

### 1. **User Model & Roles** ✅
- ✅ Three roles: `user`, `pandit`, `admin`
- ✅ Phone number field with Nepali validator (98XXXXXXXX format)
- ✅ Full name, email, profile pic URL fields
- ✅ Role-based field (`role` field in User model)

### 2. **OTP Authentication** ✅
- ✅ Phone OTP registration (`RegisterUserView`)
- ✅ OTP login request (`RequestOTPView`)
- ✅ OTP verification & JWT token generation (`OTPVerifyAndTokenView`)
- ✅ Local OTP storage/verification (not SMS yet)
- ✅ Both phone and email login support

### 3. **Pandit Workflow** ⚠️ PARTIAL
- ✅ Pandit profile model linked to User (OneToOneField)
- ✅ Pandit can create profile (auto-links to their user)
- ✅ Pandit CRUD on own profile (expertise, language, experience, bio)
- ❌ **Missing**: Verification document upload & approval workflow
- ❌ **Missing**: Admin verification panel for pending pandits
- ❌ **Missing**: Approval status field (is_verified exists but no admin flow)

### 4. **Access Control** ✅
- ✅ Role-based permissions in Pandit views
- ✅ Admin can CRUD all pandits
- ✅ Pandit can CRUD only own profile
- ✅ Users can view all pandits (public read)
- ✅ Service permissions (IsStaffOrReadOnly) for pujas

### 5. **Separate Pandit Registration** ❌ MISSING
- ❌ No dedicated "Register as Pandit" flow
- ❌ Pandit registration form doesn't exist in API
- ❌ Currently: User can register with `role: 'pandit'` - NOT SECURE
- ❌ No document upload endpoint
- ❌ No pending pandit approval workflow

---

## ❌ WHAT'S MISSING (30% Incomplete)

### 1. **Pandit Registration & Verification**
```
Missing Flow:
User clicks "Register as Pandit" → 
Separate form (docs upload) → 
Submit → Pending status → 
Admin reviews → Approves/Rejects → 
Notification to pandit
```

**Current Problem**: 
- Any user can register with `role: 'pandit'` in request
- No document verification required
- No approval workflow

### 2. **Pandit Document Verification**
- ❌ No file upload endpoint for certificates
- ❌ No admin verification panel
- ❌ No approval/rejection logic
- ❌ No SMS notification after approval

### 3. **Frontend Separate Flows**
- ❌ No "Register as Pandit" button on login screen
- ❌ No special pandit registration form
- ❌ No admin dashboard for verification
- ❌ Login page doesn't differentiate user types

### 4. **SMS Integration**
- ❌ OTP sent via local storage (not real SMS)
- ❌ No Twilio integration
- ❌ Notifications not sent via SMS

### 5. **Admin Panel**
- ❌ No admin verification dashboard
- ❌ No pending pandit management
- ❌ No approval/rejection endpoints

---

## 📋 IMPLEMENTATION CHECKLIST

### Priority 1: Fix Pandit Registration Security
- [ ] Create separate `PanditRegistrationSerializer` (no user can pick `role: 'pandit'`)
- [ ] Create `RegisterPanditView` endpoint
- [ ] Add document upload fields (file upload)
- [ ] Set `is_verified = False` by default
- [ ] Create `PanditVerificationView` (admin only) for approve/reject

### Priority 2: Admin Verification Panel
- [ ] Endpoint: `GET /api/pandits/pending/` (admin only)
- [ ] Endpoint: `POST /api/pandits/{id}/verify/` (admin approve)
- [ ] Endpoint: `POST /api/pandits/{id}/reject/` (admin reject)
- [ ] Send SMS notification after approval

### Priority 3: Frontend Flows
- [ ] Add "Register as Pandit" button on login page
- [ ] Create separate pandit registration form
- [ ] Add admin dashboard page
- [ ] Add pending status badge

### Priority 4: Real SMS Integration
- [ ] Integrate Twilio for OTP delivery
- [ ] Send SMS on pandit approval
- [ ] Send booking reminders via SMS

---

## 🎯 NEXT STEPS

**To implement Pandit Registration Flow properly:**

1. **Backend**:
   - Create `RegisterPanditView` with separate serializer
   - Add document upload to Pandit model
   - Create admin verification endpoints
   - Add SMS on approval

2. **Frontend**:
   - Add "Register as Pandit" button
   - Create pandit registration form
   - Add admin verification dashboard
   - Show pending status

3. **Security**:
   - Remove ability to register with `role: 'pandit'` directly
   - Enforce admin approval before pandit can login
   - Validate documents before approval

---

## 🔗 Related Files
- Backend Auth: `backend/users/views.py`, `backend/users/serializers.py`
- Pandit Model: `backend/pandits/models.py`, `backend/pandits/views.py`
- Frontend Auth: `frontend/src/pages/Auth/Login.tsx` (needs update)
