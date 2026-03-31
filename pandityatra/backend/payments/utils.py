import requests
from django.core.cache import cache
from decimal import Decimal
import logging
import stripe
from django.conf import settings

logger = logging.getLogger(__name__)

EXCHANGE_RATE_API_URL = "https://api.exchangerate-api.com/v4/latest/NPR"

# Stripe init
stripe.api_key = settings.STRIPE_SECRET_KEY


# ===============================
# Exchange Rate
# ===============================

def get_exchange_rate():
    cache_key = "npr_usd_rate"
    rate = cache.get(cache_key)

    if rate:
        return Decimal(str(rate))

    try:
        response = requests.get(EXCHANGE_RATE_API_URL, timeout=5)
        response.raise_for_status()
        data = response.json()
        usd_rate = data["rates"]["USD"]

        cache.set(cache_key, usd_rate, 3600)
        return Decimal(str(usd_rate))

    except Exception as e:
        logger.error(f"Exchange rate fetch failed: {e}")
        return Decimal("0.0075")  # fallback


def convert_npr_to_usd(amount_npr):
    rate = get_exchange_rate()
    return (Decimal(str(amount_npr)) * rate).quantize(Decimal("0.01"))


def convert_usd_to_npr(amount_usd):
    rate = get_exchange_rate()
    return (Decimal(str(amount_usd)) / rate).quantize(Decimal("0.01"))


# ===============================
# Currency + Gateway
# ===============================

def detect_currency_from_location(country_code):
    return "NPR" if country_code == "NP" else "USD"


def get_recommended_gateway(currency):
    return "KHALTI" if currency == "NPR" else "STRIPE"


# ===============================
# Daily.co Video Room
# ===============================

def create_video_room(booking_id, booking_date, service_name):
    try:
        if not settings.DAILY_API_KEY:
            logger.warning("DAILY_API_KEY missing")
            return None

        from datetime import datetime, timedelta

        room_name = f"puja-{booking_id}-{datetime.now().strftime('%Y%m%d')}"
        expiry = booking_date + timedelta(days=1)

        response = requests.post(
            "https://api.daily.co/v1/rooms",
            headers={
                "Authorization": f"Bearer {settings.DAILY_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "name": room_name,
                "properties": {
                    "enable_chat": True,
                    "enable_screenshare": True,
                    "exp": int(expiry.timestamp()),
                },
            },
            timeout=10,
        )

        if response.status_code == 200:
            return response.json().get("url")

        logger.error(response.text)
        return None

    except Exception as e:
        logger.error(f"Daily error: {e}")
        return None


# ===============================
# Khalti
# ===============================

def verify_khalti_payment(pidx, amount):
    try:
        response = requests.post(
            f"{settings.KHALTI_API_URL}/payment/verify/",
            headers={"Authorization": f"Key {settings.KHALTI_SECRET_KEY}"},
            data={"token": pidx, "amount": int(amount * 100)},
            timeout=10,
        )

        if response.status_code == 200:
            data = response.json()
            return True, data.get("idx"), data

        logger.error(response.text)
        return False, None, {}

    except Exception as e:
        logger.error(f"Khalti verify error: {e}")
        return False, None, {}


def initiate_khalti_payment(amount_npr, order_id, return_url, website_url, user_info=None):
    try:
        # Clean URL to avoid double slashes
        base_url = settings.KHALTI_API_URL.rstrip('/')
        secret_key = settings.KHALTI_SECRET_KEY

        # Debugging: Check if key is loaded
        if not secret_key:
            logger.error("Khalti Secret Key is missing in settings!")
            return False, "Khalti Configuration Error: Missing Secret Key", None

        # Debug log for key (partial)
        logger.info(f"Using Khalti Key: {secret_key[:5]}...{secret_key[-5:] if len(secret_key) > 10 else ''}")

        payload = {
            "return_url": return_url,
            "website_url": website_url,
            "amount": int(amount_npr * 100),
            "purchase_order_id": order_id,
            "purchase_order_name": f"Booking {order_id}",
        }

        if user_info:
            payload["customer_info"] = user_info
        
        # Ensure header format is "Key <secret_key>"
        # Note: Khalti Sandbox ("dev.khalti.com") might require strictly "Key" or sometimes "test_secret_key" depending on version.
        # But per official docs for v2/epayment, it remains "Key <secret_key>".
        headers = {
            "Authorization": f"Key {secret_key.strip()}",
            "Content-Type": "application/json",
        }

        response = requests.post(
            f"{base_url}/epayment/initiate/",
            headers=headers,
            json=payload,
            timeout=60,
        )

        if response.status_code == 200:
            data = response.json()
            return True, data["pidx"], data["payment_url"]

        logger.error(f"Khalti Error: {response.text}")
        try:
            error_data = response.json()
            # return the first error found
            if 'detail' in error_data:
                return False, error_data['detail'], None
            # or flatten validation errors
            return False, str(error_data), None
        except:
            return False, f"Khalti Status {response.status_code}", None

    except Exception as e:
        logger.error(f"Khalti init error: {e}")
        return False, str(e), None


# ===============================
# Refunds (Admin)
# ===============================

def refund_stripe(payment_intent):
    stripe.Refund.create(payment_intent=payment_intent)


def refund_khalti(pidx):
    requests.post(
        f"{settings.KHALTI_API_URL}/payment/refund/",
        headers={"Authorization": f"Key {settings.KHALTI_SECRET_KEY}"},
        json={"pidx": pidx},
        timeout=10,
    )


# ===============================
# eSewa Integration
# ===============================
import hmac
import hashlib
import base64
import uuid

def generate_esewa_signature(message, secret_key):
    """Generate HMAC SHA256 signature for eSewa"""
    key = secret_key.encode('utf-8')
    msg = message.encode('utf-8')
    signature = hmac.new(key, msg, hashlib.sha256).digest()
    return base64.b64encode(signature).decode('utf-8')


def initiate_esewa_payment(amount_npr, order_id, return_url, failure_url):
    """
    Initiate eSewa payment
    Returns form data to be submitted to eSewa
    """
    try:
        test_mode = str(getattr(settings, 'ESEWA_TEST_MODE', 'true')).lower() in ('true', '1', 'yes', 'on')
        if test_mode:
            esewa_url = getattr(settings, 'ESEWA_SANDBOX_API_URL', 'https://rc-epay.esewa.com.np')
        else:
            esewa_url = getattr(settings, 'ESEWA_API_URL', 'https://epay.esewa.com.np')
        secret_key = getattr(settings, 'ESEWA_SECRET_KEY', '8gBm/:&EnhH.1/q')
        product_code = getattr(settings, 'ESEWA_PRODUCT_CODE', 'EPAYTEST')
        
        # Generate unique transaction UUID
        transaction_uuid = str(uuid.uuid4())
        
        # eSewa uses paisa (1 NPR = 100 paisa)
        total_amount = int(amount_npr)
        
        # Create signature message: total_amount,transaction_uuid,product_code
        signature_message = f"total_amount={total_amount},transaction_uuid={transaction_uuid},product_code={product_code}"
        signature = generate_esewa_signature(signature_message, secret_key)
        
        # Form data for eSewa
        form_data = {
            'amount': str(total_amount),
            'tax_amount': '0',
            'total_amount': str(total_amount),
            'transaction_uuid': transaction_uuid,
            'product_code': product_code,
            'product_service_charge': '0',
            'product_delivery_charge': '0',
            'success_url': return_url,
            'failure_url': failure_url,
            'signed_field_names': 'total_amount,transaction_uuid,product_code',
            'signature': signature,
        }
        
        payment_url = f"{esewa_url}/api/epay/main/v2/form"
        
        return True, payment_url, form_data, transaction_uuid
        
    except Exception as e:
        logger.error(f"eSewa init error: {e}")
        return False, str(e), None, None


def verify_esewa_payment(encoded_data):
    """
    Verify eSewa payment from the callback
    The callback contains base64 encoded JSON data
    """
    try:
        import json
        
        # Decode base64/url-safe base64 data (eSewa may omit padding)
        padded = encoded_data + '=' * (-len(encoded_data) % 4)
        try:
            decoded_data = base64.b64decode(padded).decode('utf-8')
        except Exception:
            decoded_data = base64.urlsafe_b64decode(padded).decode('utf-8')
        payment_data = json.loads(decoded_data)
        
        transaction_code = payment_data.get('transaction_code')
        status = payment_data.get('status')
        total_amount = payment_data.get('total_amount')
        transaction_uuid = payment_data.get('transaction_uuid')
        product_code = payment_data.get('product_code')
        signed_field_names = payment_data.get('signed_field_names')
        signature = payment_data.get('signature')
        
        # Verify signature
        secret_key = getattr(settings, 'ESEWA_SECRET_KEY', '8gBm/:&EnhH.1/q')
        
        # Dynamically construct signature message based on signed_field_names provided in response
        if not signed_field_names:
             logger.error("eSewa response missing signed_field_names")
             return False, None, "Missing signed_field_names"
             
        # Extract fields in the exact order requested by eSewa
        fields = signed_field_names.split(',')
        message_parts = [f"{field}={payment_data.get(field, '')}" for field in fields]
        expected_message = ",".join(message_parts)
        
        expected_signature = generate_esewa_signature(expected_message, secret_key)
        
        if signature != expected_signature:
            logger.error(f"eSewa signature mismatch. Expected: {expected_signature}, Got: {signature}")
            return False, None, "Invalid signature"

        configured_product_code = getattr(settings, 'ESEWA_PRODUCT_CODE', 'EPAYTEST')
        if product_code != configured_product_code:
            logger.error("eSewa product code mismatch")
            return False, None, "Invalid product code"
        
        if status == 'COMPLETE':
            return True, transaction_code, payment_data
        else:
            return False, None, f"Payment status: {status}"
            
    except Exception as e:
        logger.error(f"eSewa verify error: {e}")
        return False, None, str(e)


def refund_esewa(transaction_code, amount):
    """Initiate eSewa refund (placeholder - requires merchant access)"""
    logger.info(f"eSewa refund requested for {transaction_code}, amount: {amount}")
    # eSewa refunds typically require contacting their support
    return True


# ===============================
# PANDIT REFUND & EARNING REVERSAL
# ===============================
from pandits.models import PanditWallet

def reverse_pandit_earning(booking):
    """
    If a booking is refunded/cancelled after completion, we must deduct
    the amount from the pandit's wallet.
    """
    try:
        pandit_wallet = booking.pandit.wallet
        # Calculate what they earned (80%)
        pandit_share = booking.total_fee * Decimal("0.80")
        
        # Deduct
        pandit_wallet.available_balance -= pandit_share
        pandit_wallet.total_earned -= pandit_share
        pandit_wallet.save()
        return True
    except Exception as e:
        print(f"Error reversing pandit earning: {e}")
        return False
