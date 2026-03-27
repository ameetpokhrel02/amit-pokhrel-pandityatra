import os
import django
from django.test import Client
from django.urls import resolve, Resolver404

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pandityatra_backend.settings')
django.setup()

def test_routes():
    client = Client()
    
    # List of major API prefixes to check (FINAL Standardised)
    prefixes = [
        '/api/v-admin/pending/',
        '/api/v-admin/all/',
        '/api/users/profile/',
        '/api/pandits/register/',
        '/api/services/listing/',
        '/api/bookings/bookings/',
        '/api/samagri/items/',
        '/api/kundali/list/',
        '/api/chat/rooms/',
        '/api/ai/chat/',
        '/api/payments/config/',
        '/api/banners/active/',
        '/api/reviews/site-reviews/',
        '/api/reviews/pandit-reviews/',
        '/api/reviews/admin-reviews/',
        '/api/notifications/list/',
        '/api/video/webhook/',
    ]
    
    print("🔍 Final API Route Integrity Check...")
    print("-" * 50)
    
    passed = 0
    failed = 0
    
    for url in prefixes:
        try:
            match = resolve(url)
            response = client.get(url)
            status_code = response.status_code
            
            # 404 is the only critical failure here (missing route)
            # 401/403/405/200 are all indicative of a REACHABLE route
            if status_code != 404:
                print(f"✅ [MATCH] {url.ljust(35)} -> Status: {status_code}")
                passed += 1
            else:
                print(f"❌ [404]   {url.ljust(35)} -> NOT FOUND")
                failed += 1
                
        except Resolver404:
            print(f"❌ [FAIL]  {url.ljust(35)} -> RESOLVER ERROR (404)")
            failed += 1
        except Exception as e:
            # Handle methods not allowed or other issues as "resolved but restricted"
            print(f"⚠️ [ERR]   {url.ljust(35)} -> {str(e)[:50]}")
            failed += 1

    print("-" * 50)
    print(f"📊 Results: {passed} PASSED, {failed} FAILED")
    
    if failed == 0:
        print("\n✨ All API routes are correctly registered and prioritized!")
    else:
        print(f"\n🚨 Integrity failure: {failed} routes are misconfigured.")

if __name__ == "__main__":
    test_routes()
