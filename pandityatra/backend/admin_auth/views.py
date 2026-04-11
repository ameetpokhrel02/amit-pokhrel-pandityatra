import pyotp
import qrcode
import base64
from io import BytesIO
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.core.cache import cache
from django.conf import settings
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken
from django_otp.plugins.otp_totp.models import TOTPDevice
from .serializers import AdminLoginSerializer, TOTPVerifySerializer
from users.models import User
from adminpanel.utils import log_activity

class AdminLoginView(APIView):
    """
    Step 1 of Admin Login: Validate Password and check for 2FA requirement.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = AdminLoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)

        user = serializer.validated_data['user']
        
        # Check if user has an active TOTP device
        device = TOTPDevice.objects.filter(user=user, confirmed=True).first()
        
        if not device:
            # If no device but role is admin/audit/superadmin, we might want to force setup
            # or allow password login once to setup. For security, we provide a setup flag.
            pre_auth_id = base64.b64encode(f"setup:{user.id}:{timezone.now().timestamp()}".encode()).decode()
            cache.set(f"pre_auth_{pre_auth_id}", user.id, timeout=300) # 5 minutes
            
            return Response({
                "requires_setup": True,
                "pre_auth_id": pre_auth_id,
                "detail": "2FA setup required for administrative roles."
            }, status=status.HTTP_200_OK)

        # Generate a pre-auth ID to link this session to the OTP verification
        pre_auth_id = base64.b64encode(f"verify:{user.id}:{timezone.now().timestamp()}".encode()).decode()
        cache.set(f"pre_auth_{pre_auth_id}", user.id, timeout=300)

        return Response({
            "requires_2fa": True,
            "pre_auth_id": pre_auth_id,
            "detail": "Two-factor authentication code required."
        }, status=status.HTTP_200_OK)

class AdminTOTPVerifyView(APIView):
    """
    Step 2 of Admin Login: Verify the 6-digit code.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = TOTPVerifySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        pre_auth_id = serializer.validated_data['pre_auth_id']
        token = serializer.validated_data['token']

        user_id = cache.get(f"pre_auth_{pre_auth_id}")
        if not user_id:
            return Response({"detail": "Session expired. Please login again."}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            user = User.objects.get(id=user_id)
            device = TOTPDevice.objects.filter(user=user, confirmed=True).first()
            
            if not device or not device.verify_token(token):
                return Response({"detail": "Invalid authentication code."}, status=status.HTTP_401_UNAUTHORIZED)

            # Success! Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            cache.delete(f"pre_auth_{pre_auth_id}")

            log_activity(user=user, action_type="LOGIN", details="Admin login successful via 2FA.", request=request)

            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user_id': user.id,
                'full_name': user.full_name,
                'role': user.role,
            }, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

class AdminTOTPSetupView(APIView):
    """
    Setup 2FA: Generates a secret and QR code for the admin.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        pre_auth_id = request.data.get('pre_auth_id')
        user_id = cache.get(f"pre_auth_{pre_auth_id}")
        
        if not user_id:
            return Response({"detail": "Session expired."}, status=status.HTTP_401_UNAUTHORIZED)

        user = User.objects.get(id=user_id)
        
        # Create or get unconfirmed device
        device, created = TOTPDevice.objects.get_or_create(user=user, confirmed=False)
        
        # In case we need to re-generate if it was stuck unconfirmed
        if not created:
            device.save() 

        # Generate QR code
        otp_uri = device.config_url
        
        # Create high-res QR code
        qr = qrcode.QRCode(version=3, error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=10, border=4)
        qr.add_data(otp_uri)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white").convert('RGB')

        # Add Logo Overlay
        try:
            import requests
            from PIL import Image
            logo_url = "https://res.cloudinary.com/dm0vvpzs9/image/upload/v1775928132/PanditYatralogo_gr68of.png"
            response = requests.get(logo_url, timeout=5)
            logo = Image.open(BytesIO(response.content))
            
            # Calculate dimensions
            img_w, img_h = img.size
            logo_w = img_w // 4
            logo_h = (logo_w * logo.height) // logo.width
            logo = logo.resize((logo_w, logo_h), Image.Resampling.LANCZOS)
            
            # Center position
            pos = ((img_w - logo_w) // 2, (img_h - logo_h) // 2)
            img.paste(logo, pos)
        except Exception as e:
            # Fallback to plain QR if logo fails
            print(f"Logo overlay failed: {e}")

        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()

        return Response({
            "qr_code": f"data:image/png;base64,{img_str}",
            "secret": device.key, 
            "otp_uri": otp_uri
        })

    def patch(self, request):
        """Confirm the setup by verifying the first code."""
        pre_auth_id = request.data.get('pre_auth_id')
        token = request.data.get('token')
        
        user_id = cache.get(f"pre_auth_{pre_auth_id}")
        if not user_id:
             return Response({"detail": "Session expired."}, status=status.HTTP_401_UNAUTHORIZED)

        user = User.objects.get(id=user_id)
        device = TOTPDevice.objects.filter(user=user, confirmed=False).first()
        
        if device and device.verify_token(token):
            device.confirmed = True
            device.save()
            
            # Generate final tokens immediately
            refresh = RefreshToken.for_user(user)
            cache.delete(f"pre_auth_{pre_auth_id}")
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'role': user.role,
                'detail': "2FA successfully enabled."
            })
        
        return Response({"detail": "Invalid verification code."}, status=status.HTTP_400_BAD_REQUEST)
