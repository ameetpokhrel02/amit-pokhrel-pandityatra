# bookings/urls.py

from rest_framework.routers import DefaultRouter
from .views import BookingViewSet

router = DefaultRouter()
# Register the ViewSet under the base URL 'bookings'
router.register(r'bookings', BookingViewSet, basename='booking')

urlpatterns = router.urls