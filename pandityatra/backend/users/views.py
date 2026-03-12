from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes # 🚨 Fix: Import decorators
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from .models import User, PlatformSetting, SiteContent
# 🚨 UPDATED IMPORT: Include UserSerializer and PasswordLoginSerializer
from .serializers import (
    UserRegisterSerializer, PhoneTokenSerializer, UserSerializer, PasswordLoginSerializer,
    ForgotPasswordRequestSerializer, ForgotPasswordOTPVerifySerializer, ResetPasswordSerializer,
    SiteContentSerializer
)
from .otp_utils import send_local_otp, verify_local_otp 
import requests
from django.conf import settings
from pandits.models import Pandit # 🚨 Import for Admin Stats 


class RegisterUserView(APIView):
    """Handles User Registration (creates the user account) and sends OTP."""
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            email = user.email
            password_provided = request.data.get('password')
            
            # 🚨 FIX: Only send OTP if NO password provided (Passwordless)
            if not password_provided:
                send_local_otp(email=email) 
                message = "User registered. OTP sent to your email for verification."
            else:
                message = "User registered successfully. You can now login."
            
            return Response(
                {"detail": message},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RequestOTPView(APIView):
    """Handles OTP request for login (for existing users via Phone or Email)."""
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        phone_number = request.data.get('phone_number')
        email = request.data.get('email')
        
        if not phone_number and not email:
            return Response(
                {"detail": "Phone number or Email is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            if phone_number:
                user = User.objects.get(phone_number=phone_number)
                send_local_otp(phone_number=phone_number)
                msg = "OTP sent to your phone number."
            else:
                # Handle potential duplicate emails (since email logic is new and not unique in DB)
                # Use iexact for case-insensitive lookup
                users = User.objects.filter(email__iexact=email)
                if users.exists():
                    user = users.first() # Pick the first one
                else:
                    raise User.DoesNotExist
                
                # For email login, we send OTP to email
                send_local_otp(email=email)
                msg = "OTP sent to your email address."

            return Response(
                {"detail": msg},
                status=status.HTTP_200_OK
            )
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found. Please register first."},
                status=status.HTTP_404_NOT_FOUND
            )


class OTPVerifyAndTokenView(APIView):
    """Verifies the OTP (Phone or Email) and returns JWT Access and Refresh Tokens."""
    permission_classes = [permissions.AllowAny]
    serializer_class = PhoneTokenSerializer
    
    def post(self, request):
        # We need to manually handle validation or update serializer because 
        # PhoneTokenSerializer enforces phone_number.
        # Let's extract manually for flexibility or creating a new serializer is better.
        # But to keep it minimal changes, we'll check fields directly.
        phone_number = request.data.get('phone_number')
        email = request.data.get('email')
        otp_code = request.data.get('otp_code')

        if not otp_code:
             return Response({"detail": "OTP code is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Smart Fix: Check if phone_number is actually an email
        if phone_number and '@' in phone_number:
            email = phone_number
            phone_number = None

        if not phone_number and not email:
             return Response({"detail": "Phone number or Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if phone_number:
                user = User.objects.get(phone_number=phone_number)
                verify_key = phone_number
            else:
                # Handle duplicates for verify too
                users = User.objects.filter(email__iexact=email)
                if users.exists():
                    user = users.first()
                else:
                    raise User.DoesNotExist
                
                verify_key = email
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        is_valid, message = verify_local_otp(verify_key, otp_code)
        
        if is_valid: 
            refresh = RefreshToken.for_user(user)
            
            # Log Activity
            from adminpanel.utils import log_activity
            log_activity(user=user, action_type="LOGIN", details=f"Logged in via OTP.", request=request)
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user_id': user.id,
                'full_name': user.full_name,
                'role': user.role,  # Include role in response
            }, status=status.HTTP_200_OK)
        else:
            return Response({"detail": message}, status=status.HTTP_400_BAD_REQUEST)

class PasswordLoginView(APIView):
    """Handles password-based login and returns JWT tokens."""
    permission_classes = [permissions.AllowAny]
    serializer_class = PasswordLoginSerializer
    
    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        phone_number = serializer.validated_data.get('phone_number')
        email = serializer.validated_data.get('email')
        username = serializer.validated_data.get('username')
        password = serializer.validated_data['password']
        
        try:
             # Smart Logic: Check for email in phone_number field
            if phone_number and '@' in phone_number:
                email = phone_number
                phone_number = None

            if username:
                # Login by username
                users = User.objects.filter(username=username)
                if users.exists():
                    user = users.first()
                else:
                    raise User.DoesNotExist
            elif phone_number:
                users = User.objects.filter(phone_number=phone_number)
                if users.exists():
                    user = users.first()
                else:
                    raise User.DoesNotExist
            elif email:
                users = User.objects.filter(email__iexact=email) # Case insensitive
                if users.exists():
                    user = users.first()
                else:
                    raise User.DoesNotExist
            else:
                 return Response({"detail": "Phone number, email, or username is required."}, status=status.HTTP_400_BAD_REQUEST)

        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        # Authenticate using username and password
        authenticated_user = authenticate(username=user.username, password=password)
        
        if authenticated_user:
            refresh = RefreshToken.for_user(authenticated_user)
            
            # Log Activity
            from adminpanel.utils import log_activity
            log_activity(user=authenticated_user, action_type="LOGIN", details=f"Logged in via password.", request=request)
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user_id': authenticated_user.id,
                'full_name': authenticated_user.full_name,
                'role': authenticated_user.role,  # Include role in response
            }, status=status.HTTP_200_OK)
        else:
            return Response({"detail": "Invalid credentials."}, status=status.HTTP_400_BAD_REQUEST)

class ForgotPasswordRequestView(APIView):
    """Handles forgot password request - sends OTP to phone or email."""
    permission_classes = [permissions.AllowAny]
    serializer_class = ForgotPasswordRequestSerializer
    
    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        phone_number = serializer.validated_data.get('phone_number')
        email = serializer.validated_data.get('email')
        
        try:
            if phone_number:
                # 🚨 Smart Fix: Check if phone_number is actually an email (frontend fallback)
                if '@' in phone_number:
                    # Reroute to email logic
                    email = phone_number
                    phone_number = None
                else:
                    user = User.objects.get(phone_number=phone_number)
                    send_local_otp(phone_number)
                    return Response(
                        {"detail": "OTP sent to your phone number."},
                        status=status.HTTP_200_OK
                    )
            
            # Note: Do not use 'elif' here because we might set email inside the if block above
            if email:
                # Handle duplicate emails
                # Use iexact for case-insensitive lookup
                users = User.objects.filter(email__iexact=email)
                if users.exists():
                    user = users.first()
                else:
                    raise User.DoesNotExist
                
                # Send OTP to email directly, regardless of phone number existence
                send_local_otp(email=email)
                return Response(
                    {"detail": "OTP sent to your email address."},
                    status=status.HTTP_200_OK
                )
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND
            )


class ForgotPasswordOTPVerifyView(APIView):
    """Verifies OTP for forgot password flow."""
    permission_classes = [permissions.AllowAny]
    serializer_class = ForgotPasswordOTPVerifySerializer
    
    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        phone_number = serializer.validated_data.get('phone_number')
        email = serializer.validated_data.get('email')
        otp_code = serializer.validated_data['otp_code']
        
        try:
            if phone_number:
                user = User.objects.get(phone_number=phone_number)
                verify_phone = phone_number
            elif email:
                # Handle duplicates
                users = User.objects.filter(email__iexact=email)
                if users.exists():
                    user = users.first()
                else:
                    raise User.DoesNotExist
                
                verify_phone = user.phone_number # Can be None
                # Use email as key if we are verifying via email flow
                verify_key = email
            
            # Don't remove OTP yet - we need it for password reset
            # ✅ UPDATED: Validate against email if phone not present
            # ✅ UPDATED: Validate against email if phone not present or if email flow
            verify_key = verify_phone if (verify_phone and phone_number) else email
            is_valid, message = verify_local_otp(verify_key, otp_code, remove_after_verify=False)
            
            if is_valid:
                return Response(
                    {"detail": "OTP verified successfully. You can now reset your password."},
                    status=status.HTTP_200_OK
                )
            else:
                return Response({"detail": message}, status=status.HTTP_400_BAD_REQUEST)
                
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND
            )


class ResetPasswordView(APIView):
    """Resets password after OTP verification."""
    permission_classes = [permissions.AllowAny]
    serializer_class = ResetPasswordSerializer
    
    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        phone_number = serializer.validated_data.get('phone_number')
        email = serializer.validated_data.get('email')
        otp_code = serializer.validated_data['otp_code']
        new_password = serializer.validated_data['new_password']
        
        try:
            if phone_number:
                # 🚨 Smart Fix for Reset: Check if phone_number is email
                if '@' in phone_number:
                    email = phone_number
                    phone_number = None
                else:
                    user = User.objects.get(phone_number=phone_number)
                    verify_phone = phone_number

            # Note: Do not use 'elif' here in case we re-routed from above
            if email:
                # Handle duplicates gracefully
                users = User.objects.filter(email__iexact=email)
                if users.exists():
                    user = users.first()
                else:
                    raise User.DoesNotExist
                
                # We don't strictly need phone_number to reset password if we verified via email
                verify_phone = user.phone_number if user.phone_number else None
            
            # Verify OTP first
            verify_key = verify_phone if (verify_phone and phone_number) else email
            is_valid, message = verify_local_otp(verify_key, otp_code)
            
            if not is_valid:
                return Response({"detail": message}, status=status.HTTP_400_BAD_REQUEST)
            
            # Reset password
            user.set_password(new_password)
            user.save()
            
            return Response(
                {"detail": "Password reset successfully."},
                status=status.HTTP_200_OK
            )
                
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND
            )

# 🆕 NEW: Protected Endpoint using JWT
class ProfileView(APIView):
    """
    Returns the current authenticated user's profile data.
    Requires a valid JWT Access Token in the Authorization header.
    """
    permission_classes = [IsAuthenticated] # 🔒 SECURITY: Ensures only authenticated users can access

    def get(self, request):
        # request.user is automatically set to the authenticated user by JWT middleware
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        """Allows updating mutable fields like full_name or email."""
        user = request.user
        # Strip empty values to avoid validator errors on blank fields
        data = request.data.copy()
        if 'phone_number' in data and not data['phone_number']:
            del data['phone_number']
        if 'email' in data and not data['email']:
            del data['email']
        serializer = UserSerializer(user, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminStatsView(APIView):
    """
    Returns statistics for the Admin Dashboard.
    Only accessible by Admin (superuser) users.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Check if user is admin or superuser
        if not (request.user.is_superuser or request.user.role in ('admin', 'superadmin')):
            return Response(
                {"detail": "You do not have permission to view admin stats."},
                status=status.HTTP_403_FORBIDDEN
            )

        total_users = User.objects.count()
        total_pandits = Pandit.objects.count()
        pending_verifications = Pandit.objects.filter(is_verified=False).count()

        return Response({
            "total_users": total_users,
            "total_pandits": total_pandits,
            "pending_verifications": pending_verifications,
            "system_status": "Healthy"
        }, status=status.HTTP_200_OK)
# ----------------------------------------------------
# 📌 ADMIN: USER MANAGEMENT
# ----------------------------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_get_users(request):
    """
    Return list of all users (role='user' usually, or all non-admins).
    """
    if not (request.user.is_superuser or request.user.role in ('admin', 'superadmin')):
        return Response({"error": "Admin only"}, status=403)
    
    # Filter only regular users
    users = User.objects.filter(role='user').order_by('-date_joined')
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_toggle_user_status(request, user_id):
    """
    Block/Unblock a user.
    """
    if not (request.user.is_superuser or request.user.role in ('admin', 'superadmin')):
        return Response({"error": "Admin only"}, status=403)
    
    try:
        user_obj = User.objects.get(id=user_id)
        # Flip is_active
        user_obj.is_active = not user_obj.is_active
        user_obj.save()
        status_msg = "activated" if user_obj.is_active else "blocked"
        return Response({"message": f"User {user_obj.phone_number} has been {status_msg}."})
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def admin_delete_user(request, user_id):
    """
    Delete a user permanently.
    """
    if not (request.user.is_superuser or request.user.role in ('admin', 'superadmin')):
        return Response({"error": "Admin only"}, status=403)
    
    try:
        user_obj = User.objects.get(id=user_id)
        user_obj.delete()
        return Response({"message": "User deleted successfully"}, status=204)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({"error": str(e), "traceback": traceback.format_exc()}, status=500)


# ----------------------------------------------------
# 📌 ADMIN: PLATFORM SETTINGS
# ----------------------------------------------------
from .serializers import PlatformSettingSerializer

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_platform_settings(request):
    """
    GET: Retrieve current platform settings (commission, etc.)
    POST: Update settings
    """
    if not (request.user.is_superuser or request.user.role in ('admin', 'superadmin')):
        return Response({"error": "Admin only"}, status=403)

    # Use Singleton load() method
    setting_obj = PlatformSetting.load()

    if request.method == 'GET':
        serializer = PlatformSettingSerializer(setting_obj)
        return Response(serializer.data)

    elif request.method == 'POST':
        # Partial update
        serializer = PlatformSettingSerializer(setting_obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


class ContactView(APIView):
    """
    Handles Contact Form submissions and saves them to the database.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from .serializers import ContactMessageSerializer
        serializer = ContactMessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"detail": "Thank you for reaching out! We will get back to you soon."},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class GoogleLoginView(APIView):
    """
    Handles Google OAuth2 Login.
    Verifies the id_token and returns JWT tokens.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        id_token = request.data.get('id_token')
        if not id_token:
            return Response({"detail": "id_token is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Verify token with Google
        try:
            # We call Google's tokeninfo endpoint to verify the integrity and ownership of the token
            google_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
            google_response = requests.get(google_url)
            data = google_response.json()

            if google_response.status_code != 200:
                return Response({"detail": "Invalid Google token"}, status=status.HTTP_400_BAD_REQUEST)

            # Check if this token was actually meant for our client ID
            # (In production, you'd compare data.get('aud') with settings.GOOGLE_CLIENT_ID)

            email = data.get('email')
            full_name = data.get('name', '')
            google_id = data.get('sub') # The unique Google user ID

            if not email:
                return Response({"detail": "Email not provided by Google"}, status=status.HTTP_400_BAD_REQUEST)

            # Get or create user
            # We map Google emails to our local User model
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email.split('@')[0] + "_" + google_id[-4:],
                    'full_name': full_name,
                    'is_active': True,
                    'role': 'user' # Default role for new signups via Google
                }
            )

            # Generate JWT tokens (SimpleJWT integration)
            refresh = RefreshToken.for_user(user)
            
            action_type = "LOGIN" if not created else "SIGNUP"
            from adminpanel.utils import log_activity
            log_activity(user=user, action_type=action_type, details=f"Authenticated via Google.", request=request)
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token), # frontend expects 'access' or 'token'?
                'token': str(refresh.access_token),  # Providing both for safety
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'full_name': user.full_name,
                    'role': user.role,
                    'is_staff': user.is_staff,
                    'is_superuser': user.is_superuser
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ----------------------------------------------------
# 📌 SUPERADMIN: MANAGE ADMINS
# ----------------------------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_list_admins(request):
    """
    List all admin/superadmin users. Only superadmin can access.
    """
    if request.user.role != 'superadmin':
        return Response({"error": "Super Admin only"}, status=403)
    
    admins = User.objects.filter(role__in=['admin', 'superadmin']).order_by('-date_joined')
    data = []
    for admin in admins:
        data.append({
            'id': admin.id,
            'full_name': admin.full_name or '',
            'email': admin.email or '',
            'phone_number': admin.phone_number or '',
            'profile_pic': admin.profile_pic.url if admin.profile_pic else None,
            'role': admin.role,
            'is_active': admin.is_active,
            'date_joined': admin.date_joined.isoformat(),
        })
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_create_admin(request):
    """
    Create a new admin user. Only superadmin can create admins.
    """
    if request.user.role != 'superadmin':
        return Response({"error": "Super Admin only"}, status=403)
    
    email = request.data.get('email')
    full_name = request.data.get('full_name', '')
    phone_number = request.data.get('phone_number', '') or None  # None avoids unique/validator issues
    password = request.data.get('password')
    role = request.data.get('role', 'admin')  # admin or superadmin
    
    if not email or not password:
        return Response({"error": "Email and password are required"}, status=400)
    
    if User.objects.filter(email=email).exists():
        return Response({"error": "A user with this email already exists"}, status=400)
    
    if role not in ['admin', 'superadmin']:
        return Response({"error": "Role must be 'admin' or 'superadmin'"}, status=400)
    
    # Generate unique username
    import random, string
    base_username = email.split('@')[0] + '_admin'
    username = base_username
    while User.objects.filter(username=username).exists():
        username = base_username + '_' + ''.join(random.choices(string.digits, k=4))
    
    try:
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            full_name=full_name,
            phone_number=phone_number,
            role=role,
            is_staff=True,
            is_active=True,
        )
    except Exception as e:
        return Response({"error": str(e)}, status=400)
    
    return Response({
        'id': user.id,
        'full_name': user.full_name,
        'email': user.email,
        'phone_number': user.phone_number,
        'role': user.role,
        'is_active': user.is_active,
        'date_joined': user.date_joined.isoformat(),
    }, status=201)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def admin_update_admin(request, user_id):
    """
    Update an admin user (toggle status, change role). Only superadmin.
    """
    if request.user.role != 'superadmin':
        return Response({"error": "Super Admin only"}, status=403)
    
    try:
        admin_user = User.objects.get(id=user_id, role__in=['admin', 'superadmin'])
    except User.DoesNotExist:
        return Response({"error": "Admin not found"}, status=404)
    
    # Don't let superadmin demote themselves
    if admin_user.id == request.user.id and request.data.get('role') == 'admin':
        return Response({"error": "Cannot demote yourself"}, status=400)
    
    action = request.data.get('action')
    
    if action == 'toggle_status':
        if admin_user.id == request.user.id:
            return Response({"error": "Cannot deactivate yourself"}, status=400)
        admin_user.is_active = not admin_user.is_active
        admin_user.save()
        status_msg = "activated" if admin_user.is_active else "deactivated"
        return Response({"message": f"Admin {admin_user.email} has been {status_msg}."})
    
    if action == 'change_role':
        new_role = request.data.get('role')
        if new_role not in ['admin', 'superadmin']:
            return Response({"error": "Invalid role"}, status=400)
        admin_user.role = new_role
        admin_user.save()
        return Response({"message": f"Role updated to {new_role}."})
    
    return Response({"error": "Invalid action"}, status=400)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def admin_delete_admin(request, user_id):
    """
    Delete an admin user. Only superadmin can delete.
    """
    if request.user.role != 'superadmin':
        return Response({"error": "Super Admin only"}, status=403)
    
    try:
        admin_user = User.objects.get(id=user_id, role__in=['admin', 'superadmin'])
    except User.DoesNotExist:
        return Response({"error": "Admin not found"}, status=404)
    
    if admin_user.id == request.user.id:
        return Response({"error": "Cannot delete yourself"}, status=400)
    
    admin_user.delete()
    return Response({"message": "Admin deleted successfully"}, status=204)


# ----------------------------------------------------
# 📌 ADMIN: SITE CONTENT (CMS)
# ----------------------------------------------------

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def site_content_public(request):
    """
    Public endpoint — returns all site content key-value pairs.
    """
    contents = SiteContent.objects.all()
    data = {c.key: c.value for c in contents}
    return Response(data)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def admin_site_content(request):
    """
    Admin endpoint — GET: list all content with metadata, PUT: update one or more entries.
    """
    if not (request.user.is_superuser or request.user.role in ['admin', 'superadmin']):
        return Response({"error": "Admin only"}, status=403)
    
    if request.method == 'GET':
        contents = SiteContent.objects.all()
        serializer = SiteContentSerializer(contents, many=True)
        # Also send all available keys so admin can create missing ones
        existing_keys = set(contents.values_list('key', flat=True))
        all_keys = [{'key': k, 'label': v} for k, v in SiteContent.CONTENT_KEYS]
        return Response({
            'contents': serializer.data,
            'available_keys': all_keys,
            'existing_keys': list(existing_keys),
        })
    
    elif request.method == 'PUT':
        # Accepts: { items: [{key: "hero_title", value: "..."}, ...] }
        items = request.data.get('items', [])
        if not items:
            return Response({"error": "No items provided"}, status=400)
        
        updated = []
        for item in items:
            key = item.get('key')
            value = item.get('value', '')
            valid_keys = [k for k, _ in SiteContent.CONTENT_KEYS]
            if key not in valid_keys:
                continue
            obj, created = SiteContent.objects.update_or_create(
                key=key,
                defaults={'value': value, 'updated_by': request.user}
            )
            updated.append(key)
        
        return Response({"message": f"Updated {len(updated)} content items.", "updated": updated})


# ----------------------------------------------------
# 📌 ADMIN: PROFILE WITH PASSWORD CHANGE
# ----------------------------------------------------

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_change_password(request):
    """
    Change own password. Requires current_password and new_password.
    """
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')
    
    if not current_password or not new_password:
        return Response({"error": "Both current_password and new_password are required"}, status=400)
    
    if not request.user.check_password(current_password):
        return Response({"error": "Current password is incorrect"}, status=400)
    
    if len(new_password) < 6:
        return Response({"error": "New password must be at least 6 characters"}, status=400)
    
    request.user.set_password(new_password)
    request.user.save()
    return Response({"message": "Password changed successfully"})
