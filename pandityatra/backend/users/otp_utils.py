import random
import time
from datetime import datetime, timedelta
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

# In-memory store for OTPs: {phone_number: {"code": "123456", "expires_at": timestamp}}
# NOTE: In a production app, this would be stored in a Redis cache or a database table.
OTP_STORE = {}

# Set the expiration time for the OTP (e.g., 5 minutes)
OTP_EXPIRATION_MINUTES = 5

def generate_otp():
    """Generates a random 6-digit numerical OTP."""
    # Generate a random number between 100000 and 999999 (6 digits)
    return str(random.randint(100000, 999999))

def send_local_otp(phone_number=None, email=None):
    """
    Generates and sends an OTP.
    
    If 'email' is provided, sends via Email (SMTP).
    If 'phone_number' is provided (and no email), simulates SMS (prints to console).
    
    Returns the generated OTP.
    """
    otp_code = generate_otp()
    
    # Calculate expiration time
    expiration_time = datetime.now() + timedelta(minutes=OTP_EXPIRATION_MINUTES)
    
    # Store OTP using phone number as key if available, else email
    key = phone_number if phone_number else email
    if not key:
        return None

    OTP_STORE[key] = {
        "code": otp_code,
        "expires_at": expiration_time.timestamp()
    }
    
    if email:
        # Send via Email
        try:
            subject = 'Your PanditYatra Verification Code'
            message = f'Your verification code is: {otp_code}. It expires in {OTP_EXPIRATION_MINUTES} minutes.'
            from_email = settings.DEFAULT_FROM_EMAIL
            recipient_list = [email]
            
            send_mail(subject, message, from_email, recipient_list)
            print(f"--- [EMAIL SENT] To: {email} | Code: {otp_code} ---")
        except Exception as e:
            print(f"FAILED TO SEND EMAIL: {e}")
            # Fallback to console print for dev
            print(f"--- [EMAIL FAIL FALLBACK] To: {email} | Code: {otp_code} ---")

    elif phone_number:
        # Simulate SMS
        print(f"\n--- [SIMULATED SMS] ---")
        print(f"To: {phone_number}")
        print(f"Your PanditYatra verification code is: {otp_code}")
        print(f"Code expires in {OTP_EXPIRATION_MINUTES} minutes.")
        print(f"-----------------------\n")
    
    return otp_code

def verify_local_otp(phone_number, otp_code, remove_after_verify=True):
    """
    Checks if the provided OTP is valid and not expired.
    
    Args:
        phone_number: The identifier (phone or email) associated with the OTP
        otp_code: The OTP code to verify
        remove_after_verify: If True, removes OTP after successful verification (default: True)
    """
    # 1. Check if the key (phone/email) has a stored OTP
    key = phone_number
    if key not in OTP_STORE:
        return False, "OTP not requested or has expired."

    stored_data = OTP_STORE[key]
    
    # 2. Check if the code matches
    if stored_data['code'] != otp_code:
        return False, "Invalid OTP code."

    # 3. Check for expiration
    current_timestamp = datetime.now().timestamp()
    if current_timestamp > stored_data['expires_at']:
        # Remove the expired OTP
        del OTP_STORE[key]
        return False, "OTP has expired. Please request a new one."
    
    # 4. Success: Remove the OTP (one-time use) if requested and return True
    if remove_after_verify:
        del OTP_STORE[key]
    return True, "OTP verified successfully."