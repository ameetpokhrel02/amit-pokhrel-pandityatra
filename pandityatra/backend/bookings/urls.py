from rest_framework.routers import DefaultRouter
from .views import BookingViewSet
from .admin_views import admin_cancel_and_refund
from django.urls import path

router = DefaultRouter()
router.register(r'bookings', BookingViewSet, basename='booking')

urlpatterns = router.urls + [
    path("admin/refund-cancel/<int:booking_id>/", admin_cancel_and_refund),
]
