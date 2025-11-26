from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated  # 🚨 NEW: For security
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from .models import User
# 🚨 UPDATED IMPORT: Include UserSerializer and PasswordLoginSerializer
from .serializers import (
    UserRegisterSerializer, PhoneTokenSerializer, UserSerializer, PasswordLoginSerializer,
    ForgotPasswordRequestSerializer, ForgotPasswordOTPVerifySerializer, ResetPasswordSerializer
)
from .otp_utils import send_local_otp, verify_local_otp 


class RegisterUserView(APIView):
    """Handles User Registration (creates the user account) and sends OTP."""
    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            phone_number = user.phone_number
            send_local_otp(phone_number) 
            
            return Response(
                {"detail": "User registered. OTP sent for verification."},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RequestOTPView(APIView):
    """Handles OTP request for login (for existing users)."""
    def post(self, request):
        phone_number = request.data.get('phone_number')
        
        if not phone_number:
            return Response(
                {"detail": "Phone number is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(phone_number=phone_number)
            # Send OTP for existing user
            send_local_otp(phone_number)
            return Response(
                {"detail": "OTP sent successfully."},
                status=status.HTTP_200_OK
            )
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found. Please register first."},
                status=status.HTTP_404_NOT_FOUND
            )


class OTPVerifyAndTokenView(APIView):
    """Verifies the OTP and returns JWT Access and Refresh Tokens."""
    serializer_class = PhoneTokenSerializer
    
    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        phone_number = serializer.validated_data['phone_number']
        otp_code = serializer.validated_data['otp_code']
        
        try:
            user = User.objects.get(phone_number=phone_number)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        is_valid, message = verify_local_otp(phone_number, otp_code)
        
        if is_valid: 
            refresh = RefreshToken.for_user(user)
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
    serializer_class = PasswordLoginSerializer
    
    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        phone_number = serializer.validated_data['phone_number']
        password = serializer.validated_data['password']
        
        try:
            user = User.objects.get(phone_number=phone_number)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        # Authenticate using username (which is phone_number) and password
        authenticated_user = authenticate(username=user.username, password=password)
        
        if authenticated_user:
            refresh = RefreshToken.for_user(authenticated_user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user_id': authenticated_user.id,
                'full_name': authenticated_user.full_name,
                'role': authenticated_user.role,  # Include role in response
            }, status=status.HTTP_200_OK)
        else:
            return Response({"detail": "Invalid phone number or password."}, status=status.HTTP_400_BAD_REQUEST)

class ForgotPasswordRequestView(APIView):
    """Handles forgot password request - sends OTP to phone or email."""
    serializer_class = ForgotPasswordRequestSerializer
    
    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        phone_number = serializer.validated_data.get('phone_number')
        email = serializer.validated_data.get('email')
        
        try:
            if phone_number:
                user = User.objects.get(phone_number=phone_number)
                send_local_otp(phone_number)
                return Response(
                    {"detail": "OTP sent to your phone number."},
                    status=status.HTTP_200_OK
                )
            elif email:
                user = User.objects.get(email=email)
                # For email, we'll use phone_number for OTP (since we use phone-based OTP system)
                if user.phone_number:
                    send_local_otp(user.phone_number)
                    return Response(
                        {"detail": "OTP sent to your registered phone number."},
                        status=status.HTTP_200_OK
                    )
                else:
                    return Response(
                        {"detail": "No phone number found for this email."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND
            )


class ForgotPasswordOTPVerifyView(APIView):
    """Verifies OTP for forgot password flow."""
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
                user = User.objects.get(email=email)
                if not user.phone_number:
                    return Response(
                        {"detail": "No phone number found for this email."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                verify_phone = user.phone_number
            
            # Don't remove OTP yet - we need it for password reset
            is_valid, message = verify_local_otp(verify_phone, otp_code, remove_after_verify=False)
            
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
                user = User.objects.get(phone_number=phone_number)
                verify_phone = phone_number
            elif email:
                user = User.objects.get(email=email)
                if not user.phone_number:
                    return Response(
                        {"detail": "No phone number found for this email."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                verify_phone = user.phone_number
            
            # Verify OTP first
            is_valid, message = verify_local_otp(verify_phone, otp_code)
            
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