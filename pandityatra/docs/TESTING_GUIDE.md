# Testing Guide for Pandit Verification

## Quick Test Steps

### 1. Test Pandit Registration

1. **Open browser:** http://localhost:3000/login
2. **Click:** "Register as Pandit" button at bottom
3. **Fill form with test data:**
   - Full Name: `Test Pandit`
   - Phone: `9841234567`
   - Email: `test@pandit.com`
   - Expertise: `Griha Pravesh, Vivah Puja`
   - Language: Select `Nepali`
   - Experience: `5`
   - Bio: `Experienced in traditional rituals`
   - Certification: Upload any PDF/image file
4. **Submit form**
5. **Expected:** Success message and redirect to login

### 2. Test Admin Verification Dashboard

1. **Create admin user** (if not exists):
   ```bash
   docker compose exec web python manage.py createsuperuser
   ```
   - Username: `admin`
   - Password: `admin123`

2. **Login to Django Admin:**
   - Open: http://localhost:8000/admin/
   - Login with admin credentials

3. **Get admin JWT token:**
   ```bash
   # Use Postman or curl
   POST http://localhost:8000/api/users/login/
   {
     "phone_number": "admin_phone",
     "password": "admin123"
   }
   ```

4. **View pending pandits:**
   - Login to frontend as admin
   - Navigate to: http://localhost:3000/admin/verify-pandits
   - Should see the test pandit registered in step 1

5. **Test approve:**
   - Click green "Approve" button
   - Should see success message
   - Pandit should disappear from pending list

6. **Test reject:**
   - Register another test pandit
   - Click red "Reject" button
   - Enter rejection reason
   - Click "Reject" in modal
   - Should see success message

### 3. Test Approved Pandit Login

1. **Go to login page:** http://localhost:3000/login
2. **Enter approved pandit phone:** `9841234567`
3. **Login with OTP or password**
4. **Expected:** Redirect to `/pandit/dashboard`

## API Testing with Postman

### 1. Register Pandit
```
POST http://localhost:8000/api/pandits/register/
Content-Type: multipart/form-data

Form Data:
- full_name: Test Pandit
- phone_number: 9841234567
- email: test@pandit.com
- expertise: Griha Pravesh, Vivah Puja
- language: Nepali
- experience_years: 5
- bio: Experienced in traditional rituals
- certification_file: [upload file]
```

### 2. List Pending (Admin)
```
GET http://localhost:8000/api/pandits/pending/
Authorization: Bearer <admin_token>
```

### 3. Approve Pandit (Admin)
```
POST http://localhost:8000/api/pandits/1/verify/
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "notes": "Approved for testing"
}
```

### 4. Reject Pandit (Admin)
```
POST http://localhost:8000/api/pandits/1/reject/
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reason": "Testing rejection flow"
}
```

## Expected Behaviors

### Pandit Registration:
- ✅ Form validates required fields
- ✅ File upload shows selected filename
- ✅ Success message appears
- ✅ Redirects to login after 3 seconds
- ✅ File saved in `media/pandit_certifications/`

### Admin Dashboard:
- ✅ Shows all pending pandits
- ✅ Displays contact info, expertise, experience
- ✅ Certification file link works
- ✅ Approve button turns pandit to APPROVED
- ✅ Reject button opens modal
- ✅ Rejection requires reason
- ✅ List refreshes after action

### Database:
- ✅ User created with role='pandit'
- ✅ Pandit profile created with verification_status='PENDING'
- ✅ After approval: verification_status='APPROVED', is_verified=True
- ✅ After rejection: verification_status='REJECTED'

## Troubleshooting

### Issue: 401 Unauthorized on admin endpoints
**Solution:** Ensure you're logged in as admin and using valid JWT token

### Issue: File upload fails
**Solution:** 
- Check Django media settings in settings.py
- Ensure `MEDIA_ROOT` and `MEDIA_URL` are configured
- Check folder permissions

### Issue: Frontend form doesn't submit
**Solution:**
- Check browser console for errors
- Verify backend is running: http://localhost:8000/admin/
- Check network tab for API call details

### Issue: Pandit not showing in pending list
**Solution:**
- Check database: `docker compose exec web python manage.py shell`
  ```python
  from pandits.models import Pandit
  Pandit.objects.filter(verification_status='PENDING')
  ```
- Verify API endpoint returns data
- Check admin permissions

## Database Queries for Verification

```bash
# Enter Django shell
docker compose exec web python manage.py shell
```

```python
from pandits.models import Pandit
from users.models import User

# Check all pandits
Pandit.objects.all()

# Check pending pandits
Pandit.objects.filter(verification_status='PENDING')

# Check approved pandits
Pandit.objects.filter(is_verified=True)

# Get specific pandit
pandit = Pandit.objects.get(id=1)
print(f"Name: {pandit.full_name}")
print(f"Status: {pandit.verification_status}")
print(f"Verified: {pandit.is_verified}")
print(f"File: {pandit.certification_file.url if pandit.certification_file else 'None'}")

# Manually approve a pandit
from django.utils import timezone
pandit = Pandit.objects.get(id=1)
pandit.verification_status = 'APPROVED'
pandit.is_verified = True
pandit.verified_date = timezone.now()
pandit.save()
```

## Success Criteria

- ✅ Pandit can register with file upload
- ✅ Admin can see pending list
- ✅ Admin can approve pandits
- ✅ Admin can reject with reason
- ✅ Approved pandits can login
- ✅ Rejected pandits cannot access pandit features
- ✅ File downloads work
- ✅ UI is responsive and user-friendly
- ✅ Error messages are clear
- ✅ Success feedback is immediate

## Next Steps After Testing

1. **Add email notifications** (optional)
2. **Add file type validation** (PDF, images only)
3. **Add file size limits** (5MB max)
4. **Add filtering in admin dashboard**
5. **Add search functionality**
6. **Add export to CSV**
7. **Deploy to production**



lets build chat real time chat application with daphne redis django channel server side and cliunet side for real time communication for poandiyta this is also one of the main features of my 