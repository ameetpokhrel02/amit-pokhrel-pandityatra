from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    VendorRegisterView,
    VendorProfileViewSet,
    VendorProductViewSet,
    VendorOrderViewSet,
    VendorPayoutViewSet,
    list_pending_vendors,
    admin_all_vendors,
    verify_vendor,
    reject_vendor,
    ping_vendors
)

router = DefaultRouter()
router.register(r'profile', VendorProfileViewSet, basename='vendor-profile')
router.register(r'products', VendorProductViewSet, basename='vendor-products')
router.register(r'orders', VendorOrderViewSet, basename='vendor-orders')
router.register(r'payouts', VendorPayoutViewSet, basename='vendor-payouts')

urlpatterns = [
    path('ping/', ping_vendors, name='ping-vendors'),
    path('register/', VendorRegisterView.as_view(), name='vendor-register'),
    path('pending/', list_pending_vendors, name='admin-vendor-pending'),
    path('all/', admin_all_vendors, name='admin-vendor-all'),
    path('verify/<int:vendor_id>/', verify_vendor, name='admin-vendor-verify'),
    path('reject/<int:vendor_id>/', reject_vendor, name='admin-vendor-reject'),
    path('', include(router.urls)),
]
