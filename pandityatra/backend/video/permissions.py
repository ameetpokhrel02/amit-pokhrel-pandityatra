from bookings.models import Booking


def can_access_booking(user, booking: Booking) -> bool:
    if not user or not user.is_authenticated:
        return False
    if user.is_staff or user.is_superuser:
        return True

    is_customer = booking.user_id == user.id
    is_pandit = bool(booking.pandit and booking.pandit_id == user.id)
    return is_customer or is_pandit
