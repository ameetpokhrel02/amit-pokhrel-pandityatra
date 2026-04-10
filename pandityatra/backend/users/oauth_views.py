import os
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from google.oauth2 import id_token
from google.auth.transport import requests
from django.conf import settings
from .models import User
from rest_framework_simplejwt.tokens import RefreshToken

class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Verify Google token
            idinfo = id_token.verify_oauth2_token(
                token, requests.Request(), os.environ.get('GOOGLE_CLIENT_ID')
            )

            email = idinfo.get('email')
            if not email:
                return Response({'error': 'No email provided by Google'}, status=status.HTTP_400_BAD_REQUEST)

            # Get user by email
            user = User.objects.filter(email=email).first()
            
            if not user:
                # Generate unique username from email
                base_username = email.split('@')[0]
                username = base_username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}{counter}"
                    counter += 1
                
                # Create new user
                user = User.objects.create(
                    email=email,
                    username=username,
                    full_name=idinfo.get('name', ''),
                    role='user',
                    is_active=True
                )
            else:
                # Update existing user if needed
                if not user.full_name and idinfo.get('name'):
                    user.full_name = idinfo.get('name')
                    user.save(update_fields=['full_name'])


            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)

            # Fetch extra user properties to match login endpoint payload
            user_data = {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'role': user.role,
                'phone_number': user.phone_number,
            }

            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': user_data
            }, status=status.HTTP_200_OK)

        except ValueError as e:
            # Invalid token
            return Response({'error': f'Invalid token: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
