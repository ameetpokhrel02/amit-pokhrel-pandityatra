from django.urls import path
from .views import (
    RegisterUserView, RequestOTPView, OTPVerifyAndTokenView, 
    PasswordLoginView, ForgotPasswordRequestView, ForgotPasswordOTPVerifyView, 
    ResetPasswordView, ProfileView, AdminStatsView, ContactView,
    # 🚨 ADMIN VIEWS (Added)
    admin_get_users, admin_toggle_user_status, admin_platform_settings
)

urlpatterns = [
    # User Creation
    path('register/', RegisterUserView.as_view(), name='register'),
    
    # OTP-Based Login Flow
    path('request-otp/', RequestOTPView.as_view(), name='request-otp'), # Request the OTP code
    path('login-otp/', OTPVerifyAndTokenView.as_view(), name='login-otp'),  # Verify OTP and get JWT tokens

    # Password-Based Login
    path('login-password/', PasswordLoginView.as_view(), name='login-password'),  # Login with password
    
    # User Profile
    path('profile/', ProfileView.as_view(), name='profile'),
    
    # Contact Form
    path('contact/', ContactView.as_view(), name='contact'),
    
    # Forgot Password Flow
    path('forgot-password/', ForgotPasswordRequestView.as_view(), name='forgot-password-request'), # Request OTP
    path('forgot-password/verify-otp/', ForgotPasswordOTPVerifyView.as_view(), name='forgot-password-verify'), # Verify OTP
    path('forgot-password/reset/', ResetPasswordView.as_view(), name='reset-password'), # Set new password
    
    # Admin Stats
    path('admin/stats/', AdminStatsView.as_view(), name='admin-stats'),

    # 🚨 ADMIN: User Management
    path('admin/users/', admin_get_users, name='admin-users'),
    path('admin/users/<int:user_id>/toggle-status/', admin_toggle_user_status, name='admin-user-toggle'),

    # 🚨 ADMIN: Settings
    path('admin/settings/', admin_platform_settings, name='admin-settings'),
]