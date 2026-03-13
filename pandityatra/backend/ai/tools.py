from django.db.models import Q
from bookings.models import Booking
from samagri.models import SamagriItem
from pandits.models import Pandit
from chat.models import ChatRoom
from .schemas import ToolExecutionResult
from .constants import RESPONSE_TYPES


def _abs_image_url(request, image_field):
    if not image_field:
        return None
    try:
        if request is not None:
            return request.build_absolute_uri(image_field.url)
        return image_field.url
    except Exception:
        return None


def search_samagri(request, query: str, limit: int = 5) -> ToolExecutionResult:
    normalized = (query or "").strip().lower()

    alias_map = {
        "murti": ["idol", "statue", "ganesh", "ganesha", "moorti"],
        "ganesh": ["ganesha", "ganpati", "vinayak"],
        "book": ["granth", "gita", "ramayan", "mahabharat"],
        "samagri": ["puja", "ritual", "aarti"],
    }

    qs = SamagriItem.objects.filter(
        Q(name__icontains=query) | Q(description__icontains=query) | Q(category__name__icontains=query),
        is_active=True,
    ).select_related("category").distinct()[: max(1, min(limit, 10))]

    if not qs.exists() and normalized:
        tokens = [t for t in normalized.replace("-", " ").split() if len(t) >= 3]
        q_obj = Q()
        for token in tokens:
            q_obj |= Q(name__icontains=token) | Q(description__icontains=token) | Q(category__name__icontains=token)
            for alias in alias_map.get(token, []):
                q_obj |= Q(name__icontains=alias) | Q(description__icontains=alias) | Q(category__name__icontains=alias)

        if q_obj:
            qs = SamagriItem.objects.filter(q_obj, is_active=True).select_related("category").distinct()[: max(1, min(limit, 10))]

    # Last fallback: popular active items so chat UI still shows actionable cards
    if not qs.exists():
        qs = SamagriItem.objects.filter(is_active=True).select_related("category").order_by("-created_at")[: max(1, min(limit, 10))]

    products = [
        {
            "id": i.id,
            "name": i.name,
            "price": float(i.price),
            "image": _abs_image_url(request, i.image),
            "category": i.category.name if i.category else None,
            "stock": i.stock_quantity,
        }
        for i in qs
    ]
    return ToolExecutionResult(
        ok=True,
        type=RESPONSE_TYPES["PRODUCT_LIST"],
        data={"products": products},
        message=f"Found {len(products)} items for '{query}'." if products else f"No items found for '{query}'.",
    )


def find_pandits(language: str | None = None, expertise: str | None = None, limit: int = 5) -> ToolExecutionResult:
    qs = Pandit.objects.filter(is_verified=True).select_related("user")
    if language:
        qs = qs.filter(language__icontains=language)
    if expertise:
        qs = qs.filter(expertise__icontains=expertise)

    qs = qs.order_by("-rating")[: max(1, min(limit, 10))]
    pandits = [
        {
            "id": p.id,
            "name": p.user.full_name or p.user.username,
            "expertise": p.expertise,
            "language": p.language,
            "rating": float(p.rating),
            "experience_years": p.experience_years,
            "is_available": p.is_available,
            "profile_pic": _abs_image_url(None, p.user.profile_pic) if p.user.profile_pic else None,
        }
        for p in qs
    ]

    return ToolExecutionResult(
        ok=True,
        type=RESPONSE_TYPES["PANDIT_LIST"],
        data={"pandits": pandits},
        message=f"Found {len(pandits)} pandits." if pandits else "No matching pandits found.",
    )


def get_booking_status(user, booking_id: int) -> ToolExecutionResult:
    qs = Booking.objects.select_related("pandit__user")

    if user.is_authenticated and (user.is_superuser or user.is_staff or user.role in ("admin", "superadmin")):
        booking = qs.filter(id=booking_id).first()
    elif user.is_authenticated and user.role == "pandit":
        booking = qs.filter(id=booking_id, pandit__user=user).first()
    elif user.is_authenticated:
        booking = qs.filter(id=booking_id, user=user).first()
    else:
        booking = None

    if not booking:
        return ToolExecutionResult(
            ok=False,
            type=RESPONSE_TYPES["TEXT"],
            data={},
            message="Booking not found or access denied.",
        )

    booking_data = {
        "id": booking.id,
        "status": booking.status,
        "service_name": booking.service_name,
        "booking_date": str(booking.booking_date),
        "booking_time": str(booking.booking_time),
        "pandit_name": booking.pandit.user.full_name or booking.pandit.user.username,
        "payment_status": booking.payment_status,
        "payment_method": booking.payment_method,
        "transaction_id": booking.transaction_id,
    }

    return ToolExecutionResult(
        ok=True,
        type=RESPONSE_TYPES["BOOKING_STATUS"],
        data={"bookings": [booking_data]},
        message=f"Booking {booking.id} is currently {booking.status}.",
    )


def list_my_bookings(user, status: str | None = None, limit: int = 5) -> ToolExecutionResult:
    if not user.is_authenticated:
        return ToolExecutionResult(ok=False, type=RESPONSE_TYPES["TEXT"], message="Login required to view bookings.")

    qs = Booking.objects.filter(user=user).select_related("pandit__user").order_by("-created_at")
    if status:
        qs = qs.filter(status=status)
    qs = qs[: max(1, min(limit, 20))]

    bookings = [
        {
            "id": b.id,
            "status": b.status,
            "service_name": b.service_name,
            "booking_date": str(b.booking_date),
            "booking_time": str(b.booking_time),
            "pandit_name": b.pandit.user.full_name or b.pandit.user.username,
            "payment_status": b.payment_status,
        }
        for b in qs
    ]

    return ToolExecutionResult(
        ok=True,
        type=RESPONSE_TYPES["BOOKING_LIST"],
        data={"bookings": bookings},
        message=f"You have {len(bookings)} bookings.",
    )


def add_to_cart_intent(product_id: int | None = None, product_name: str | None = None, quantity: int = 1) -> ToolExecutionResult:
    item = None
    if product_id is not None:
        item = SamagriItem.objects.filter(id=product_id, is_active=True).first()
    elif product_name:
        item = SamagriItem.objects.filter(
            Q(name__icontains=product_name) | Q(description__icontains=product_name),
            is_active=True,
        ).order_by("-created_at").first()

    if not item:
        return ToolExecutionResult(ok=False, type=RESPONSE_TYPES["TEXT"], message="Product not found. Please share a clearer item name.")

    return ToolExecutionResult(
        ok=True,
        type=RESPONSE_TYPES["MIXED"],
        data={
            "products": [
                {
                    "id": item.id,
                    "name": item.name,
                    "price": float(item.price),
                    "image": _abs_image_url(None, item.image),
                }
            ],
            "actions": [
                {
                    "type": "ADD_TO_CART",
                    "product": {
                        "id": item.id,
                        "title": item.name,
                        "price": float(item.price),
                    },
                    "quantity": max(1, quantity),
                }
            ]
        },
        message=f"Prepared add-to-cart action for {item.name}.",
    )


def how_to_book() -> ToolExecutionResult:
    return ToolExecutionResult(
        ok=True,
        type=RESPONSE_TYPES["TEXT"],
        message=(
            "To book a pandit: 1) Open Find Pandits, 2) Choose profile and service, 3) Pick date/time, "
            "4) Complete payment, 5) Track booking from dashboard."
        ),
    )


def how_kundali_works() -> ToolExecutionResult:
    return ToolExecutionResult(
        ok=True,
        type=RESPONSE_TYPES["TEXT"],
        message=(
            "Kundali works in dual mode: online high-precision generation and offline local generation for low/no internet. "
            "In online mode you can save charts to dashboard."
        ),
    )


def switch_to_realtime_chat(user, booking_id: int | None = None, pandit_id: int | None = None, pandit_name: str | None = None) -> ToolExecutionResult:
    actions = []
    if booking_id and user.is_authenticated:
        room = ChatRoom.objects.filter(booking_id=booking_id).first()
        if room:
            actions.append({
                "type": "SWITCH_MODE",
                "bookingId": str(room.id),
                "panditName": room.pandit.user.full_name or room.pandit.user.username,
            })

    if not actions and booking_id:
        actions.append({
            "type": "SWITCH_MODE",
            "bookingId": str(booking_id),
            "panditName": pandit_name or "Pandit",
        })

    if not actions and pandit_id and user.is_authenticated:
        pandit = Pandit.objects.filter(id=pandit_id).select_related("user").first()
        if pandit:
            room, _ = ChatRoom.objects.get_or_create(
                customer=user,
                pandit=pandit,
                is_pre_booking=True,
                defaults={"is_active": True},
            )
            actions.append({
                "type": "SWITCH_MODE",
                "bookingId": str(room.id),
                "panditName": pandit.user.full_name or pandit.user.username,
            })

    return ToolExecutionResult(
        ok=True,
        type=RESPONSE_TYPES["MIXED"],
        data={"actions": actions},
        message="You can switch to real-time chat now." if actions else "No realtime chat room found yet.",
    )
