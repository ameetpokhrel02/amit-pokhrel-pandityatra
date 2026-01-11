from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from bookings.models import Booking
from pandits.models import Pandit

User = get_user_model()

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_dashboard(request):
    user = request.user

    if not (user.is_staff or user.is_superuser or user.role == "admin"):
        return Response({"detail": "Admin only"}, status=403)

    total_users = User.objects.count()
    total_pandits = Pandit.objects.count()
    pending_pandits = Pandit.objects.filter(verification_status="PENDING").count()
    total_bookings = Booking.objects.count()

    return Response({
        "total_users": total_users,
        "total_pandits": total_pandits,
        "pending_pandits": pending_pandits,
        "total_bookings": total_bookings,
        "system_status": "OK"
    })
