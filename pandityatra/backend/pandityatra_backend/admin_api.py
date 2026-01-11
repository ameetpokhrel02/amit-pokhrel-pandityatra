from rest_fraework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from users.models import User
from pandits.models import Pandit
from bookings.models import Booking

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_dashboard(request):

    return Response({
        "total_users": User.objects.count(),
        "total_pandits": Pandit.objects.count(),
        "pending_pandits": Pandit.objects.filter(is_verified=False).count(),
        "total_bookings": Booking.objects.count(),

    })