# In backend/users/urls.py

from django.urls import path
# 🚨 UPDATED IMPORT: Include all views
from .views import (
    RegisterUserView, RequestOTPView, OTPVerifyAndTokenView, PasswordLoginView, ProfileView,
    ForgotPasswordRequestView, ForgotPasswordOTPVerifyView, ResetPasswordView
)

urlpatterns = [
    path('register/', RegisterUserView.as_view(), name='register'),
    path('request-otp/', RequestOTPView.as_view(), name='request-otp'),
    path('login/', OTPVerifyAndTokenView.as_view(), name='login'),  # OTP login
    path('login-password/', PasswordLoginView.as_view(), name='login-password'),  # Password login
    path('profile/', ProfileView.as_view(), name='profile'),
    # Forgot password flow
    path('forgot-password/', ForgotPasswordRequestView.as_view(), name='forgot-password'),
    path('forgot-password/verify-otp/', ForgotPasswordOTPVerifyView.as_view(), name='forgot-password-verify'),
    path('forgot-password/reset/', ResetPasswordView.as_view(), name='reset-password'),
]