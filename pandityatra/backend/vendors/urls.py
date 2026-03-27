from django.urls import path, include
from .views import (
    VendorRegisterView,
    list_pending_vendors,
    admin_all_vendors,
    verify_vendor,
    reject_vendor,
    ping_vendors
)

urlpatterns = [
    path('ping/', ping_vendors, name='ping-vendors'),
    path('register/', VendorRegisterView.as_view(), name='vendor-register'),
    path('pending/', list_pending_vendors, name='admin-vendor-pending'),
    path('all/', admin_all_vendors, name='admin-vendor-all'),
    path('verify/<int:vendor_id>/', verify_vendor, name='admin-vendor-verify'),
    path('reject/<int:vendor_id>/', reject_vendor, name='admin-vendor-reject'),
]
