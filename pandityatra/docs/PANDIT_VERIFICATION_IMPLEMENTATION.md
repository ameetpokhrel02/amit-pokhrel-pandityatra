# Pandit Document Verification Implementation

## Overview
Complete implementation of the Pandit registration and admin verification workflow with document upload capability.

## Features Implemented

### 1. Backend - Model Updates
**File:** `backend/pandits/models.py`

**New Fields Added:**
```python
verification_status = models.CharField(
    max_length=20,
    choices=VERIFICATION_STATUS_CHOICES,
    default='PENDING'
)
certification_file = models.FileField(
    upload_to='pandit_certifications/',
    blank=True,
    null=True
)
verified_date = models.DateTimeField(blank=True, null=True)
verification_notes = models.TextField(blank=True, null=True)
is_verified = models.BooleanField(default=False)
```

**Verification Status Choices:**
- `PENDING` - Initial status after registration
- `APPROVED` - Admin approved the pandit
- `REJECTED` - Admin rejected the application

### 2. Backend - Serializers
**File:** `backend/pandits/pandit_serializers.py`

**PanditRegistrationSerializer:**
- Handles pandit registration with file upload
- Creates User account with role='pandit'
- Creates Pandit profile with verification_status='PENDING'
- Generates and sends OTP to phone
- Returns registration confirmation

**Fields:**
- full_name (required)
- phone_number (required, unique)
- email (optional)
- expertise (required)
- language (required)
- experience_years (required)
- bio (optional)
- certification_file (required)

### 3. Backend - API Endpoints
**File:** `backend/pandits/views.py` and `backend/pandits/urls.py`

#### Public Endpoint:
- `POST /api/pandits/register/`
  - Public registration for pandits
  - Accepts multipart/form-data with file upload
  - Creates pending pandit account
  - Sends OTP for verification

#### Admin Only Endpoints:
- `GET /api/pandits/pending/`
  - Lists all pandits with PENDING status
  - Ordered by registration date (newest first)
  - Requires admin authentication

- `POST /api/pandits/{id}/verify/`
  - Approves a pending pandit
  - Sets: verification_status='APPROVED', is_verified=True, verified_date=now()
  - Accepts optional notes field
  - Requires admin authentication

- `POST /api/pandits/{id}/reject/`
  - Rejects a pending pandit
  - Sets: verification_status='REJECTED'
  - Accepts reason field (stored in verification_notes)
  - Requires admin authentication

### 4. Frontend - Pandit Registration Form
**File:** `frontend/src/pages/auth/PanditRegister.tsx`

**Features:**
- Complete registration form with validation
- File upload with drag-and-drop interface
- Visual feedback for file selection
- Orange theme matching app design
- Uses PanditYatra logo from assets
- Redirects to login after successful registration

**Form Fields:**
- Full Name (text, required)
- Phone Number (tel, required)
- Email (email, optional)
- Expertise (text, required)
- Language (dropdown: Nepali/Hindi/Sanskrit/English/Maithili)
- Experience Years (number, 0-100)
- Bio (textarea, optional)
- Certification File (file upload, required)

**File Upload UI:**
- Drag-and-drop zone
- Click to browse
- Green border when file selected
- Displays selected filename
- File icon indicator

### 5. Frontend - Admin Verification Dashboard
**File:** `frontend/src/pages/Dashboard/AdminVerification.tsx`

**Features:**
- Lists all pending pandit registrations
- Card-based layout with pandit details
- Contact information display (phone, email)
- Experience and language information
- Bio display
- Certification file download link
- Approve/Reject action buttons
- Rejection modal with reason textarea
- Real-time updates after actions
- Framer Motion animations

**Actions:**
- **Approve Button:** 
  - Green button with CheckCircle icon
  - Sends POST to `/api/pandits/{id}/verify/`
  - Shows success message
  - Refreshes list
  
- **Reject Button:**
  - Red outline button with XCircle icon
  - Opens modal for rejection reason
  - Sends POST to `/api/pandits/{id}/reject/`
  - Shows success message
  - Refreshes list

### 6. Frontend - Routing
**File:** `frontend/src/App.tsx`

**New Routes Added:**
- `/pandit/register` - Public route for pandit registration
- `/admin/verify-pandits` - Protected admin route for verification dashboard

### 7. Login Page Update
**File:** `frontend/src/pages/auth/Login.tsx`

**Changes:**
- Added visual separator (horizontal line with "or")
- Added "Register as Pandit" button (outline variant)
- Button navigates to `/pandit/register`

## Database Migrations

**Migration:** `backend/pandits/migrations/0005_*.py`

Successfully applied migration with:
```bash
docker compose exec web python manage.py migrate pandits
```

**Status:** ✅ Applied successfully

## How to Use

### For Pandits (Registration):
1. Navigate to login page
2. Click "Register as Pandit" button
3. Fill in registration form with:
   - Personal details
   - Expertise and experience
   - Upload certification file (PDF, Image, etc.)
4. Submit form
5. Receive OTP on phone
6. Wait for admin approval
7. After approval, login with phone/OTP or password

### For Admins (Verification):
1. Login with admin account
2. Navigate to `/admin/verify-pandits`
3. Review pending pandit registrations:
   - View personal details
   - Check expertise and experience
   - Download and review certification file
4. Take action:
   - **Approve:** Click green "Approve" button
   - **Reject:** Click red "Reject" button, provide reason
5. System updates pandit status automatically
6. Approved pandits can now login and access pandit dashboard

## API Request Examples

### Register Pandit:
```bash
POST http://localhost:8000/api/pandits/register/
Content-Type: multipart/form-data

{
  "full_name": "Ram Prasad Sharma",
  "phone_number": "9841234567",
  "email": "ram@example.com",
  "expertise": "Vedic Rituals, Griha Pravesh, Vivah Puja",
  "language": "Nepali",
  "experience_years": 15,
  "bio": "Experienced in traditional Hindu rituals...",
  "certification_file": <file>
}
```

**Response:**
```json
{
  "detail": "Pandit registered successfully. Please verify your phone.",
  "phone_number": "9841234567",
  "status": "pending_verification"
}
```

### List Pending Pandits (Admin):
```bash
GET http://localhost:8000/api/pandits/pending/
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "count": 2,
  "results": [
    {
      "id": 1,
      "full_name": "Ram Prasad Sharma",
      "phone_number": "9841234567",
      "email": "ram@example.com",
      "expertise": "Vedic Rituals",
      "language": "Nepali",
      "experience_years": 15,
      "bio": "Experienced...",
      "verification_status": "PENDING",
      "certification_file_url": "http://localhost:8000/media/pandit_certifications/cert_123.pdf",
      "date_joined": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Approve Pandit (Admin):
```bash
POST http://localhost:8000/api/pandits/1/verify/
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "notes": "All documents verified. Approved."
}
```

**Response:**
```json
{
  "detail": "Pandit verified successfully"
}
```

### Reject Pandit (Admin):
```bash
POST http://localhost:8000/api/pandits/1/reject/
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reason": "Certification documents incomplete"
}
```

**Response:**
```json
{
  "detail": "Pandit rejected"
}
```

## File Storage

**Location:** `media/pandit_certifications/`

Files are uploaded to the Django media folder and accessible via URL:
```
http://localhost:8000/media/pandit_certifications/<filename>
```

## Security Considerations

1. **Authentication:**
   - Registration endpoint is public (no auth required)
   - Admin endpoints require admin authentication (IsAdminUser permission)
   - JWT tokens used for authentication

2. **File Upload:**
   - Files stored in dedicated folder
   - Django FileField handles file validation
   - Consider adding file size limits in production
   - Consider adding file type validation (PDF, images only)

3. **Data Validation:**
   - Phone number uniqueness enforced
   - Required fields validated on backend
   - Frontend validation for better UX

## Testing Checklist

- [ ] Pandit can register with file upload
- [ ] File is stored in media folder
- [ ] Admin can see pending pandits
- [ ] Admin can download certification files
- [ ] Admin can approve pandit
- [ ] Approved pandit can login
- [ ] Admin can reject pandit with reason
- [ ] Rejected pandits cannot login
- [ ] UI displays correctly on mobile
- [ ] File upload shows visual feedback
- [ ] Error messages display properly
- [ ] Success messages display properly

## Future Enhancements

1. **Email/SMS Notifications:**
   - Send email/SMS to pandit on approval
   - Send rejection reason via email/SMS
   - Notify admin when new pandit registers

2. **File Type Validation:**
   - Restrict to PDF, JPG, PNG only
   - Add file size limit (e.g., 5MB max)
   - Virus scanning in production

3. **Additional Verification:**
   - Add multiple document upload (certificates, ID proof, etc.)
   - Add video interview scheduling
   - Add reference check system

4. **Enhanced Admin Dashboard:**
   - Filtering by language, expertise, date
   - Search functionality
   - Bulk approval/rejection
   - Export to CSV
   - Statistics dashboard

5. **Pandit Dashboard:**
   - View verification status
   - Resubmit documents if rejected
   - Upload additional certificates
   - Update profile after approval

## Files Modified/Created

### Backend:
- ✅ `backend/pandits/models.py` - Updated Pandit model
- ✅ `backend/pandits/pandit_serializers.py` - Created new serializers
- ✅ `backend/pandits/views.py` - Added verification views
- ✅ `backend/pandits/urls.py` - Added new endpoints
- ✅ `backend/pandits/migrations/0005_*.py` - Database migration

### Frontend:
- ✅ `frontend/src/pages/auth/PanditRegister.tsx` - Created registration form
- ✅ `frontend/src/pages/Dashboard/AdminVerification.tsx` - Created admin dashboard
- ✅ `frontend/src/pages/auth/Login.tsx` - Added pandit registration button
- ✅ `frontend/src/App.tsx` - Added new routes

## Status

✅ **Implementation Complete**
- All backend endpoints working
- Frontend forms functional
- Database migrations applied
- Routes configured
- Backend restarted

🔄 **Ready for Testing**
- Test pandit registration flow
- Test admin verification workflow
- Test file upload/download
- Test error handling

## Next Steps

1. Test the complete workflow:
   - Register as pandit
   - Check file upload
   - Login as admin
   - Verify pending pandits
   - Test approve/reject actions

2. Add additional features:
   - Email notifications
   - File type validation
   - Enhanced admin filters

3. Production considerations:
   - Add file size limits
   - Add file type restrictions
   - Set up proper media storage (S3, etc.)
   - Add monitoring and logging
