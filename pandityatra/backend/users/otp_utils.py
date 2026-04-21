import random
import time
from datetime import datetime, timedelta
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

# In-memory store for OTPs: {phone_number: {"code": "123456", "expires_at": timestamp, "attempts": 0, "locked_until": timestamp}}
# NOTE: In a production app, this would be stored in a Redis cache or a database table.
OTP_STORE = {}

# Set the expiration time for the OTP (e.g., 5 minutes)
OTP_EXPIRATION_MINUTES = 5
MAX_OTP_ATTEMPTS = 3
LOCKOUT_DURATION_SECONDS = 3600 # 1 hour

def generate_otp():
    """Generates a random 6-digit numerical OTP."""
    # Generate a random number between 100000 and 999999 (6 digits)
    return str(random.randint(100000, 999999))

def send_local_otp(phone_number=None, email=None):
    """
    Generates and sends an OTP.
    
    If 'email' is provided, sends via Email (SMTP).
    If 'phone_number' is provided (and no email), simulates SMS (prints to console).
    
    Returns (otp_code, error_message).
    """
    # Calculate key
    key = phone_number if phone_number else email
    if not key:
        return None, "No identifier provided."

    # Check for lockout
    current_time = time.time()
    if key in OTP_STORE:
        locked_until = OTP_STORE[key].get('locked_until', 0)
        if current_time < locked_until:
            wait_mins = int((locked_until - current_time) / 60)
            return None, f"Too many failed attempts. Account is locked. Please try again in {wait_mins} minutes."

    otp_code = generate_otp()
    
    # Calculate expiration time
    expiration_time = datetime.now() + timedelta(minutes=OTP_EXPIRATION_MINUTES)
    
    # Store OTP
    # Keep attempts and lockout status if user exists
    existing_data = OTP_STORE.get(key, {})
    OTP_STORE[key] = {
        "code": otp_code,
        "expires_at": expiration_time.timestamp(),
        "attempts": existing_data.get('attempts', 0),
        "locked_until": existing_data.get('locked_until', 0)
    }
    
    if email:
        # Send via Email Task (Mailjet + Celery)
        from notifications.tasks import send_email_task
        
        subject = 'Your PanditYatra Verification Code'
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #ff9933; text-align: center;">PanditYatra Verification</h2>
            <p style="font-size: 16px; color: #333;">Namaste,</p>
            <p style="font-size: 16px; color: #333;">Your verification code is:</p>
            <div style="text-align: center; margin: 30px 0;">
                <span style="font-size: 32px; font-weight: bold; color: #333; letter-spacing: 5px; background-color: #f9f9f9; padding: 10px 20px; border-radius: 5px; border: 1px dashed #ccc;">{otp_code}</span>
            </div>
            <p style="font-size: 14px; color: #666;">This code expires in {OTP_EXPIRATION_MINUTES} minutes.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
                Please do not reply to this email. This mailbox is not monitored.<br>
                If you did not request this code, please ignore this email.
            </p>
        </div>
        """
        
        # Create EmailNotification record
        from notifications.models import EmailNotification
        notif = EmailNotification.objects.create(
            recipient_email=email,
            subject=subject,
            message=html_content, # message field stores the HTML/content
            status='PENDING',
            sender_role='SYSTEM'
        )
        
        # Dispatch to background task using ID
        send_email_task.delay(notif.id)
        print(f"--- [EMAIL QUEUED] To: {email} | ID: {notif.id} | Code: {otp_code} ---")

    elif phone_number:
        # Simulate SMS
        print(f"\n--- [SIMULATED SMS] ---")
        print(f"To: {phone_number}")
        print(f"Your PanditYatra verification code is: {otp_code}")
        print(f"Code expires in {OTP_EXPIRATION_MINUTES} minutes.")
        print(f"-----------------------\n")
    
    return otp_code, None

def verify_local_otp(phone_number, otp_code, remove_after_verify=True):
    """
    Checks if the provided OTP is valid and not expired.
    
    Args:
        phone_number: The identifier (phone or email) associated with the OTP
        otp_code: The OTP code to verify
        remove_after_verify: If True, removes OTP after successful verification (default: True)
    """
    key = phone_number
    current_time = time.time()

    # 1. Check if the key (phone/email) has a stored OTP
    if key not in OTP_STORE:
        return False, "OTP not requested or has expired."

    stored_data = OTP_STORE[key]

    # 2. Check for lockout
    if current_time < stored_data.get('locked_until', 0):
        wait_mins = int((stored_data['locked_until'] - current_time) / 60)
        return False, f"Account is temporarily locked due to too many failed attempts. Try again in {wait_mins} minutes."

    # 3. Check for expiration
    if current_time > stored_data['expires_at']:
        # Don't delete yet, might need attempt count
        return False, "OTP has expired. Please request a new one."
    
    # 4. Check if the code matches
    if stored_data['code'] != otp_code:
        # Increment attempts
        stored_data['attempts'] = stored_data.get('attempts', 0) + 1
        
        if stored_data['attempts'] >= MAX_OTP_ATTEMPTS:
            stored_data['locked_until'] = current_time + LOCKOUT_DURATION_SECONDS
            stored_data['attempts'] = 0 # Reset attempts for next lockout cycle
            return False, "Too many failed attempts. Account locked for 1 hour."
            
        remaining = MAX_OTP_ATTEMPTS - stored_data['attempts']
        return False, f"Invalid OTP code. {remaining} attempts remaining."

    # 5. Success: Remove the OTP (one-time use) if requested and return True
    if remove_after_verify:
        del OTP_STORE[key]
    else:
        # If not removing, at least reset attempts
        stored_data['attempts'] = 0
        
    return True, "OTP verified successfully."