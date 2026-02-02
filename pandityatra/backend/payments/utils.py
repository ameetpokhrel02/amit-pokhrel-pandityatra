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
