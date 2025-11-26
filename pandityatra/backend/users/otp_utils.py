import random
import time
from datetime import datetime, timedelta

# In-memory store for OTPs: {phone_number: {"code": "123456", "expires_at": timestamp}}
# NOTE: In a production app, this would be stored in a Redis cache or a database table.
OTP_STORE = {}

# Set the expiration time for the OTP (e.g., 5 minutes)
OTP_EXPIRATION_MINUTES = 5

def generate_otp():
    """Generates a random 6-digit numerical OTP."""
    # Generate a random number between 100000 and 999999 (6 digits)
    return str(random.randint(100000, 999999))

def send_local_otp(phone_number):
    """
    Simulates sending an OTP and stores it locally.
    
    Returns the generated OTP for local testing purposes.
    """
    otp_code = generate_otp()
    
    # Calculate expiration time
    expiration_time = datetime.now() + timedelta(minutes=OTP_EXPIRATION_MINUTES)
    
    OTP_STORE[phone_number] = {
        "code": otp_code,
        "expires_at": expiration_time.timestamp()
    }
    
    print(f"\n--- [SIMULATED SMS] ---")
    print(f"To: {phone_number}")
    print(f"Your PanditYatra verification code is: {otp_code}")
    print(f"Code expires in {OTP_EXPIRATION_MINUTES} minutes.")
    print(f"-----------------------\n")
    
    # In a real service, you would call the Twilio/SMS API here.
    return otp_code

def verify_local_otp(phone_number, otp_code, remove_after_verify=True):
    """
    Checks if the provided OTP is valid and not expired.
    
    Args:
        phone_number: The phone number associated with the OTP
        otp_code: The OTP code to verify
        remove_after_verify: If True, removes OTP after successful verification (default: True)
    """
    # 1. Check if the phone number has a stored OTP
    if phone_number not in OTP_STORE:
        return False, "OTP not requested or has expired."

    stored_data = OTP_STORE[phone_number]
    
    # 2. Check if the code matches
    if stored_data['code'] != otp_code:
        return False, "Invalid OTP code."

    # 3. Check for expiration
    current_timestamp = datetime.now().timestamp()
    if current_timestamp > stored_data['expires_at']:
        # Remove the expired OTP
        del OTP_STORE[phone_number]
        return False, "OTP has expired. Please request a new one."
    
    # 4. Success: Remove the OTP (one-time use) if requested and return True
    if remove_after_verify:
        del OTP_STORE[phone_number]
    return True, "OTP verified successfully."