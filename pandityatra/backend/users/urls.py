from django.urls import path
from .views import (
    RegisterUserView, RequestOTPView, OTPVerifyAndTokenView, 
    PasswordLoginView, ForgotPasswordRequestView, ForgotPasswordOTPVerifyView, 
    ResetPasswordView, ProfileView, AdminStatsView, ContactView, GoogleLoginView,
    # 🚨 ADMIN VIEWS (Added)
    admin_get_users, admin_toggle_user_status, admin_delete_user, admin_platform_settings,
    admin_create_account,
    # 🚨 SUPERADMIN VIEWS
    admin_list_admins, admin_create_admin, admin_update_admin, admin_delete_admin,
    # 🚨 SITE CONTENT
    site_content_public, admin_site_content,
    # 🚨 PASSWORD CHANGE
    admin_change_password,
)

urlpatterns = [
    # User Creation
    path('register/', RegisterUserView.as_view(), name='register'),
    
    # OTP-Based Login Flow
    path('request-otp/', RequestOTPView.as_view(), name='request-otp'), # Request the OTP code
    path('login-otp/', OTPVerifyAndTokenView.as_view(), name='login-otp'),  # Verify OTP and get JWT tokens

    # Password-Based Login
    path('login-password/', PasswordLoginView.as_view(), name='login-password'),  # Login with password
    
    # Google Login
    path('google-login/', GoogleLoginView.as_view(), name='google-login'),
    
    # User Profile
    path('profile/', ProfileView.as_view(), name='profile'),
    
    # Contact Form
    path('contact/', ContactView.as_view(), name='contact'),
    path('admin/contact/<int:pk>/', ContactView.as_view(), name='admin-contact-detail'),
    
    # Forgot Password Flow
    path('forgot-password/', ForgotPasswordRequestView.as_view(), name='forgot-password-request'), # Request OTP
    path('forgot-password/verify-otp/', ForgotPasswordOTPVerifyView.as_view(), name='forgot-password-verify'), # Verify OTP
    path('forgot-password/reset/', ResetPasswordView.as_view(), name='reset-password'), # Set new password
    
    # Admin Stats
    path('admin/stats/', AdminStatsView.as_view(), name='admin-stats'),

    # 🚨 ADMIN: User Management
    path('admin/users/', admin_get_users, name='admin-users'),
    path('admin/users/create/', admin_create_account, name='admin-user-create'),
    path('admin/users/<int:user_id>/', admin_delete_user, name='admin-user-delete'),
    path('admin/users/<int:user_id>/toggle-status/', admin_toggle_user_status, name='admin-user-toggle'),

    # 🚨 ADMIN: Settings
    path('admin/settings/', admin_platform_settings, name='admin-settings'),

    # 🚨 SUPERADMIN: Admin Management
    path('admin/admins/', admin_list_admins, name='admin-list-admins'),
    path('admin/admins/create/', admin_create_admin, name='admin-create-admin'),
    path('admin/admins/<int:user_id>/', admin_update_admin, name='admin-update-admin'),
    path('admin/admins/<int:user_id>/delete/', admin_delete_admin, name='admin-delete-admin'),

    # 🚨 ADMIN: Site Content (CMS)
    path('site-content/', site_content_public, name='site-content-public'),
    path('admin/site-content/', admin_site_content, name='admin-site-content'),

    # 🚨 ADMIN: Password Change
    path('admin/change-password/', admin_change_password, name='admin-change-password'),
]