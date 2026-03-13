from typing import Any

from users.models import User


def is_authenticated(user: Any) -> bool:
    return bool(user and getattr(user, "is_authenticated", False))


def can_access_user_booking_tools(user: Any) -> bool:
    if not is_authenticated(user):
        return False
    role = getattr(user, "role", "user")
    return role in ("user", "pandit", "admin", "superadmin") or user.is_staff or user.is_superuser


def can_use_realtime_switch(user: Any) -> bool:
    if not is_authenticated(user):
        return False
    role = getattr(user, "role", "user")
    return role == "user"
