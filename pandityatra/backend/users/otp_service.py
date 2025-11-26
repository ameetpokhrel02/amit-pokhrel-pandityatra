import random
from django.core.cache import cache

# Set the OTP expiration time (60 seconds)
OTP_EXPIRATION_SECONDS = 60
OTP_CACHE_PREFIX = "otp_"

def generate_otp():
    """Generates a random 6-digit OTP."""
    return str(random.randint(100000, 999999))

def set_otp(phone_number, otp_code):
    """Stores the OTP in the cache with a TTL."""
    cache_key = f"{OTP_CACHE_PREFIX}{phone_number}"
    cache.set(cache_key, otp_code, timeout=OTP_EXPIRATION_SECONDS)

def verify_otp(phone_number, otp_code):
    """Retrieves and verifies the OTP."""
    cache_key = f"{OTP_CACHE_PREFIX}{phone_number}"
    stored_otp = cache.get(cache_key)

    if stored_otp and stored_otp == otp_code:
        # OTP is valid, delete it to ensure single use
        cache.delete(cache_key)
        return True
    return False

# --- SMS Sending Simulation ---
def send_otp_via_sms(phone_number, otp_code):
    """
    Placeholder for integrating with a real SMS provider (e.g., Twilio).
    
    In a real application, this is where you call the external API.
    For local development, you will just log the code.
    """
    print(f"--- SMS SENT ---")
    print(f"To: {phone_number}")
    print(f"Code: {otp_code}")
    print(f"----------------")
    return True # Assume success for development