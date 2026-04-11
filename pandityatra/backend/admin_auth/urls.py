from django.urls import path
from .views import AdminLoginView, AdminTOTPVerifyView, AdminTOTPSetupView

urlpatterns = [
    path('login/', AdminLoginView.as_view(), name='admin_login'),
    path('verify-totp/', AdminTOTPVerifyView.as_view(), name='admin_verify_totp'),
    path('setup-totp/', AdminTOTPSetupView.as_view(), name='admin_setup_totp'),
]
