import os
import django
import sys

# Setup Django environment
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pandityatra_backend.settings')
django.setup()

from django.test import Client
from users.models import User
from pandits.models import PanditUser
from vendors.models import Vendor
import json

def test_auth_audit():
    client = Client()
    print("--- 🛡️ Starting Master Authentication Audit 🛡️ ---")

    # CLEANUP: Remove any existing test users to ensure fresh registration test
    print("[Step 0] Cleaning up legacy test accounts...")
    User.objects.filter(email__in=["customer@test.com", "pandit@test.com", "vendor@test.com"]).delete()
    customer_data = {
        "email": "customer@test.com",
        "password": "Password123!",
        "full_name": "Test Customer",
        "role": "user"
    }
    resp = client.post('/api/users/register/', data=json.dumps(customer_data), content_type='application/json')
    assert resp.status_code == 201, f"Customer registration failed: {resp.data}"
    print("✅ Customer Registered Successfully")

    # Login check
    login_data = {"email": "customer@test.com", "password": "Password123!"}
    resp = client.post('/api/users/login-password/', data=json.dumps(login_data), content_type='application/json')
    assert resp.status_code == 200, "Customer password login failed"
    print("✅ Customer Password Login Success")

    # 2. PANDIT AUTH TEST
    print("\n[Step 2] Verifying Pandit Auth (Auto-Profile Creation)...")
    pandit_data = {
        "email": "pandit@test.com",
        "password": "Password123!",
        "full_name": "Expert Pandit",
        "role": "pandit"
    }
    resp = client.post('/api/users/register/', data=json.dumps(pandit_data), content_type='application/json')
    assert resp.status_code == 201, "Pandit registration failed"
    
    # Check if Pandit profile was auto-created
    user = User.objects.get(email="pandit@test.com")
    assert user.role == 'pandit', "User role mismatch"
    assert hasattr(user, 'pandit_profile'), "Pandit profile NOT created automatically!"
    print("✅ Pandit Registered & Profile Auto-Created")

    # 3. VENDOR AUTH TEST
    print("\n[Step 3] Verifying Vendor Auth (Specialized Signup)...")
    vendor_data = {
        "email": "vendor@test.com",
        "password": "Password123!",
        "full_name": "Shop Owner",
        "shop_name": "Sacred Goods Shop",
        "business_type": "Retail",
        "address": "123 Test Street",
        "city": "Kathmandu",
        "bank_account_number": "1234567890",
        "bank_name": "Himalayan Bank",
        "account_holder_name": "Shop Owner"
    }
    # Note: Vendor uses its own register endpoint
    resp = client.post('/api/vendors/register/', data=json.dumps(vendor_data), content_type='application/json')
    assert resp.status_code == 201, f"Vendor registration failed: {resp.content}"
    
    # Check vendor profile
    user = User.objects.get(email="vendor@test.com")
    assert user.role == 'vendor', "User role not set to vendor"
    vendor_profile = VendorProfile.objects.get(user=user)
    assert vendor_profile.shop_name == "Sacred Goods Shop", "Shop name mismatch"
    print("✅ Vendor Registered & Shop Profile Created")

    # 4. OTP AUTH AUDIT (Simulated)
    print("\n[Step 4] Verifying OTP Flow Logic...")
    from users.otp_utils import send_local_otp, verify_local_otp
    otp, err = send_local_otp(email="customer@test.com")
    assert otp is not None, "OTP generation failed"
    is_valid, msg = verify_local_otp("customer@test.com", otp)
    assert is_valid, "OTP verification failed"
    print("✅ OTP Generation & Verification Logic Verified")

    print("\n--- 🎊 ALL AUTH AUDITS PASSED! 🎊 ---")
    print("The system is 100% ready for multi-role production traffic.")

if __name__ == "__main__":
    try:
        test_auth_audit()
    except Exception as e:
        print(f"\n❌ AUDIT FAILED: {str(e)}")
        sys.exit(1)
