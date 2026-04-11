import pyotp
import qrcode
import base64
import logging
from io import BytesIO
from PIL import Image
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.core.cache import cache
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken
from django_otp.plugins.otp_totp.models import TOTPDevice
from .models import User
from adminpanel.utils import log_activity

logger = logging.getLogger(__name__)

class GlobalTOTPVerifyView(APIView):
    """
    Step 2 of Login: Verify the 6-digit code for any user role.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('token')
        pre_auth_id = request.data.get('pre_auth_id')

        if not token or not pre_auth_id:
            return Response({"detail": "Token and Session ID are required."}, status=status.HTTP_400_BAD_REQUEST)

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

            log_activity(user=user, action_type="LOGIN", details=f"User ({user.role}) login successful via 2FA.", request=request)

            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user_id': user.id,
                'full_name': user.full_name,
                'role': user.role,
            }, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

class GlobalTOTPStatusView(APIView):
    """Check if 2FA is enabled for the current user."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        logger.info(f"Checking 2FA status for user: {request.user.email}")
        device = TOTPDevice.objects.filter(user=request.user, confirmed=True).exists()
        return Response({"has_2fa": device})

class GlobalTOTPSetupView(APIView):
    """
    Setup/Toggle 2FA for the current user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Generate a new QR code for setup."""
        user = request.user
        # Create or get unconfirmed device
        device, created = TOTPDevice.objects.get_or_create(user=user, confirmed=False)
        if not created:
            device.save() # Refresh secret if needed

        # Generate branded QR code
        otp_uri = device.config_url
        qr = qrcode.QRCode(version=3, error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=10, border=4)
        qr.add_data(otp_uri)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white").convert('RGB')

        # Add Logo Overlay
        try:
            import requests
            from django.conf import settings
            logo_url = "https://res.cloudinary.com/dm0vvpzs9/image/upload/v1775928132/PanditYatralogo_gr68of.png"
            response = requests.get(logo_url, timeout=5)
            logo = Image.open(BytesIO(response.content))
            img_w, img_h = img.size
            logo_w = img_w // 4
            logo_h = (logo_w * logo.height) // logo.width
            logo = logo.resize((logo_w, logo_h), Image.Resampling.LANCZOS)
            img.paste(logo, ((img_w - logo_w) // 2, (img_h - logo_h) // 2))
        except:
            pass

        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()

        return Response({
            "qr_code": f"data:image/png;base64,{img_str}",
            "secret": device.key,
            "otp_uri": otp_uri
        })

    def post(self, request):
        """Confirm setup with first token."""
        token = request.data.get('token')
        user = request.user
        device = TOTPDevice.objects.filter(user=user, confirmed=False).first()
        
        if device and device.verify_token(token):
            # Delete any existing confirmed devices first (switch device)
            TOTPDevice.objects.filter(user=user, confirmed=True).delete()
            device.confirmed = True
            device.save()
            log_activity(user=user, action_type="SECURITY", details="2FA enabled successfully.", request=request)
            return Response({"detail": "2FA successfully enabled."}, status=status.HTTP_200_OK)
        
        return Response({"detail": "Invalid verification code."}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        """Disable 2FA. Requires a valid token for safety."""
        token = request.data.get('token')
        user = request.user
        device = TOTPDevice.objects.filter(user=user, confirmed=True).first()
        
        if not device:
            return Response({"detail": "2FA is not enabled."}, status=status.HTTP_400_BAD_REQUEST)
            
        if device.verify_token(token):
            device.delete()
            log_activity(user=user, action_type="SECURITY", details="2FA disabled.", request=request)
            return Response({"detail": "2FA has been disabled."}, status=status.HTTP_200_OK)
            
        return Response({"detail": "Invalid code. 2FA could not be disabled."}, status=status.HTTP_400_BAD_REQUEST)
