"""
Payment utility functions for currency conversion, gateway detection, etc.
"""
import requests
from django.core.cache import cache
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

EXCHANGE_RATE_API_URL = "https://api.exchangerate-api.com/v4/latest/NPR"


def get_exchange_rate():
    """
    Get NPR to USD exchange rate with 1-hour caching
    Returns: Decimal exchange rate or None if failed
    """
    cache_key = 'npr_usd_rate'
    rate = cache.get(cache_key)
    
    if rate:
        return Decimal(str(rate))
    
    try:
        response = requests.get(EXCHANGE_RATE_API_URL, timeout=5)
        response.raise_for_status()
        data = response.json()
        usd_rate = data['rates']['USD']
        
        # Cache for 1 hour
        cache.set(cache_key, usd_rate, 3600)
        return Decimal(str(usd_rate))
    except Exception as e:
        logger.error(f"Failed to fetch exchange rate: {e}")
        # Fallback rate (approximate)
        return Decimal('0.0075')


def convert_npr_to_usd(amount_npr):
    """
    Convert NPR amount to USD
    """
    rate = get_exchange_rate()
    amount_usd = Decimal(str(amount_npr)) * rate
    return amount_usd.quantize(Decimal('0.01'))


def convert_usd_to_npr(amount_usd):
    """
    Convert USD amount to NPR
    """
    rate = get_exchange_rate()
    amount_npr = Decimal(str(amount_usd)) / rate
    return amount_npr.quantize(Decimal('0.01'))


def detect_currency_from_location(country_code=None):
    """
    Detect preferred currency based on location
    Returns: 'NPR' or 'USD'
    """
    # Nepal uses NPR
    if country_code == 'NP':
        return 'NPR'
    # All other countries use USD
    return 'USD'


def get_recommended_gateway(currency):
    """
    Recommend payment gateway based on currency
    """
    if currency == 'NPR':
        return 'KHALTI'
    return 'STRIPE'


def create_video_room(booking_id, booking_date, service_name):
    """
    Create Daily.co video room for online puja
    Returns: room URL or None
    
    NOTE: Requires DAILY_API_KEY in settings
    """
    try:
        import os
        from datetime import datetime, timedelta
        
        DAILY_API_KEY = os.getenv('DAILY_API_KEY')
        if not DAILY_API_KEY:
            logger.warning("DAILY_API_KEY not set, skipping room creation")
            return None
        
        # Create room name
        room_name = f"puja-{booking_id}-{datetime.now().strftime('%Y%m%d')}"
        
        # Calculate expiry (puja date + 1 day)
        expiry_date = booking_date + timedelta(days=1)
        expiry_timestamp = int(expiry_date.timestamp())
        
        # Create room via Daily.co API
        response = requests.post(
            "https://api.daily.co/v1/rooms",
            headers={
                "Authorization": f"Bearer {DAILY_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "name": room_name,
                "properties": {
                    "enable_screenshare": True,
                    "enable_chat": True,
                    "start_video_off": False,
                    "start_audio_off": False,
                    "exp": expiry_timestamp
                }
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            return data.get('url')
        else:
            logger.error(f"Failed to create Daily.co room: {response.text}")
            return None
            
    except Exception as e:
        logger.error(f"Error creating video room: {e}")
        return None


def verify_khalti_payment(pidx, amount):
    """
    Verify Khalti payment using pidx
    Returns: (success: bool, transaction_id: str, details: dict)
    """
    try:
        import os
        KHALTI_SECRET_KEY = os.getenv('KHALTI_SECRET_KEY')
        
        if not KHALTI_SECRET_KEY:
            logger.error("KHALTI_SECRET_KEY not set")
            return False, None, {}
        
        response = requests.post(
            "https://khalti.com/api/v2/payment/verify/",
            headers={
                "Authorization": f"Key {KHALTI_SECRET_KEY}"
            },
            data={
                "token": pidx,
                "amount": int(amount * 100)  # Khalti expects paisa (NPR * 100)
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            return True, data.get('idx'), data
        else:
            logger.error(f"Khalti verification failed: {response.text}")
            return False, None, {}
            
    except Exception as e:
        logger.error(f"Error verifying Khalti payment: {e}")
        return False, None, {}


def initiate_khalti_payment(amount_npr, purchase_order_id, return_url, website_url):
    """
    Initiate Khalti payment
    Returns: (success: bool, pidx: str, payment_url: str)
    """
    try:
        import os
        KHALTI_SECRET_KEY = os.getenv('KHALTI_SECRET_KEY')
        
        if not KHALTI_SECRET_KEY:
            logger.error("KHALTI_SECRET_KEY not set")
            return False, None, None
        
        response = requests.post(
            "https://khalti.com/api/v2/epayment/initiate/",
            headers={
                "Authorization": f"Key {KHALTI_SECRET_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "return_url": return_url,
                "website_url": website_url,
                "amount": int(amount_npr * 100),  # Convert to paisa
                "purchase_order_id": purchase_order_id,
                "purchase_order_name": f"Booking {purchase_order_id}",
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            return True, data.get('pidx'), data.get('payment_url')
        else:
            logger.error(f"Khalti initiation failed: {response.text}")
            return False, None, None
            
    except Exception as e:
        logger.error(f"Error initiating Khalti payment: {e}")
        return False, None, None
