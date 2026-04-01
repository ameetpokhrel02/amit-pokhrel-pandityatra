"""
Payment Service Layer
Pure business logic functions for payment processing.
These are testable without Django's request/response cycle.
"""


def initiate_payment_logic(booking, gateway, esewa_func=None, khalti_func=None, stripe_func=None):
    """
    Initiate a payment for a booking using the specified gateway.

    Args:
        booking: Booking object (or mock) with .id and .total_fee
        gateway: Payment gateway string ('ESEWA', 'KHALTI', 'STRIPE')
        esewa_func: Callable that initiates eSewa payment
        khalti_func: Callable that initiates Khalti payment
        stripe_func: Callable that initiates Stripe payment

    Returns:
        dict with payment result

    Raises:
        ValueError: If an unsupported gateway is provided
    """
    if gateway == 'ESEWA':
        if esewa_func is None:
            raise ValueError("esewa_func is required for ESEWA gateway")

        success, url, data, uuid = esewa_func(booking)

        if not success:
            return {
                'success': False,
                'gateway': 'ESEWA',
                'error': 'eSewa initiation failed'
            }

        return {
            'success': True,
            'gateway': 'ESEWA',
            'url': url,
            'data': data,
            'uuid': uuid,
        }

    elif gateway == 'KHALTI':
        if khalti_func is None:
            raise ValueError("khalti_func is required for KHALTI gateway")

        success, pidx, payment_url = khalti_func(booking)

        if not success:
            return {
                'success': False,
                'gateway': 'KHALTI',
                'error': 'Khalti initiation failed'
            }

        return {
            'success': True,
            'gateway': 'KHALTI',
            'pidx': pidx,
            'url': payment_url,
        }

    elif gateway == 'STRIPE':
        if stripe_func is None:
            raise ValueError("stripe_func is required for STRIPE gateway")

        success, session_id, checkout_url = stripe_func(booking)

        if not success:
            return {
                'success': False,
                'gateway': 'STRIPE',
                'error': 'Stripe initiation failed'
            }

        return {
            'success': True,
            'gateway': 'STRIPE',
            'session_id': session_id,
            'url': checkout_url,
        }

    else:
        raise ValueError(f"Unsupported payment gateway: {gateway}")
