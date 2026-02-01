
import os
import sys
import django
import requests

# Setup Django environment
sys.path.append('/home/amit/Documents/Final-Year-Project/pandityatra/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pandityatra_backend.settings')
django.setup()

from django.conf import settings

def test_khalti_connection():
    print(f"--- Khalti Connection Test ---")
    
    # 1. Check Settings
    api_url = getattr(settings, 'KHALTI_API_URL', 'Not Set')
    secret_key = getattr(settings, 'KHALTI_SECRET_KEY', None)
    
    print(f"API URL: {api_url}")
    if secret_key:
        masked_key = f"{secret_key[:5]}...{secret_key[-5:]}" if len(secret_key) > 10 else secret_key
        print(f"Secret Key found: {masked_key}")
        print(f"Key Length: {len(secret_key)}")
    else:
        print("ERROR: KHALTI_SECRET_KEY is missing/empty in settings!")
        return

    # 2. Test Request (Initiate a dummy payment)
    print("\nAttempting to initiate dummy payment...")
    
    url = f"{api_url.rstrip('/')}/epayment/initiate/"
    headers = {
        "Authorization": f"Key {secret_key.strip()}",
        "Content-Type": "application/json",
    }
    payload = {
        "return_url": "http://localhost:5173/payment/verify",
        "website_url": "http://localhost:5173",
        "amount": 1000 * 100, # 1000 Rs
        "purchase_order_id": "TEST-CONNECTION-1",
        "purchase_order_name": "Test Connection",
        "customer_info": {
            "name": "Test User",
            "email": "test@example.com",
            "phone": "9800000000"
        }
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("\nSUCCESS: Connection API key are working!")
        else:
            print("\nFAILURE: API rejected the request.")
            
    except Exception as e:
        print(f"\nEXCEPTION: {e}")

if __name__ == "__main__":
    test_khalti_connection()
