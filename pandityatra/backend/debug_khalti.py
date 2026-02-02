
import os
import requests
from dotenv import load_dotenv

load_dotenv()

secret_key = os.getenv('KHALTI_SECRET_KEY')
public_key = os.getenv('KHALTI_PUBLIC_KEY')

print(f"Secret Key present: {bool(secret_key)}")
if secret_key:
    print(f"Secret Key: {secret_key[:5]}...")

endpoints = [
    "https://a.khalti.com/api/v2/epayment/initiate/",
    "https://dev.khalti.com/api/v2/epayment/initiate/",
    "https://khalti.com/api/v2/epayment/initiate/"
]

payload = {
    "return_url": "http://localhost:5173/payment/success",
    "website_url": "http://localhost:5173",
    "amount": 1000, # 10 Rs
    "purchase_order_id": "test_123",
    "purchase_order_name": "Test Booking",
    "customer_info": {
        "name": "Test User",
        "email": "test@example.com",
        "phone": "9800000000"
    }
}

headers = {
    "Authorization": f"Key {secret_key}",
    "Content-Type": "application/json",
}

print("\n--- Testing Endpoints ---")
for url in endpoints:
    print(f"\nTesting: {url}")
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=60)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:200]}")
    except Exception as e:
        print(f"Error: {e}")
