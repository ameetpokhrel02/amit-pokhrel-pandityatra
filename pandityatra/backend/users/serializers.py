from rest_framework import serializers
from .models import User
# 🚨 CRITICAL FIX: Import the standard random string generator
from django.utils.crypto import get_random_string 

# Define the length of the random password (e.g., 20 characters)
RANDOM_PASSWORD_LENGTH = 20

class UserRegisterSerializer(serializers.ModelSerializer):
    # Make email optional
    email = serializers.EmailField(required=False, allow_blank=True)
    # Make password optional - if not provided, will generate random one
    password = serializers.CharField(write_only=True, required=False, min_length=6, allow_blank=True)
    # Add role field - default to 'user' if not provided
    role = serializers.ChoiceField(choices=[('user', 'User'), ('pandit', 'Pandit'), ('admin', 'Admin')], default='user', required=False)
    
    class Meta:
        model = User
        fields = ('id', 'phone_number', 'full_name', 'email', 'password', 'role')
        read_only_fields = ('id',)
    
    def validate_phone_number(self, value):
        """Check if phone number already exists"""
        if User.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError("A user with this phone number already exists.")
        return value
    
    def create(self, validated_data):
        phone_number = validated_data['phone_number']
        username = phone_number
        email = validated_data.get('email', '').strip() if validated_data.get('email') else ''
        password = validated_data.get('password', '').strip() if validated_data.get('password') else ''
        
        # If no password provided, generate a random one
        if not password:
            password = get_random_string(RANDOM_PASSWORD_LENGTH)
        
        # Create user with email only if provided
        user_data = {
            'username': username,
            'phone_number': phone_number,
            'full_name': validated_data.get('full_name', ''),
            'password': password,
            'role': validated_data.get('role', 'user'),  # Set role, default to 'user'
        }
        
        # Only add email if it's provided and not empty
        if email:
            user_data['email'] = email
        
        user = User.objects.create_user(**user_data)
        
        return user

# This is the serializer that handles generating the tokens after OTP verification.
class PhoneTokenSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=15)
    otp_code = serializers.CharField(max_length=6)

# Serializer for password-based login
class PasswordLoginSerializer(serializers.Serializer):
    """Serializer for password-based login."""
    phone_number = serializers.CharField(max_length=15)
    password = serializers.CharField(write_only=True, min_length=1)

# Serializers for forgot password flow
class ForgotPasswordRequestSerializer(serializers.Serializer):
    """Serializer for requesting password reset OTP."""
    phone_number = serializers.CharField(max_length=15, required=False)
    email = serializers.EmailField(required=False)
    
    def validate(self, data):
        """Ensure either phone_number or email is provided."""
        if not data.get('phone_number') and not data.get('email'):
            raise serializers.ValidationError("Either phone_number or email is required.")
        return data

class ForgotPasswordOTPVerifySerializer(serializers.Serializer):
    """Serializer for verifying OTP during password reset."""
    phone_number = serializers.CharField(max_length=15, required=False)
    email = serializers.EmailField(required=False)
    otp_code = serializers.CharField(max_length=6)
    
    def validate(self, data):
        """Ensure either phone_number or email is provided."""
        if not data.get('phone_number') and not data.get('email'):
            raise serializers.ValidationError("Either phone_number or email is required.")
        return data

class ResetPasswordSerializer(serializers.Serializer):
    """Serializer for resetting password after OTP verification."""
    phone_number = serializers.CharField(max_length=15, required=False)
    email = serializers.EmailField(required=False)
    otp_code = serializers.CharField(max_length=6)
    new_password = serializers.CharField(write_only=True, min_length=6)
    
    def validate(self, data):
        """Ensure either phone_number or email is provided."""
        if not data.get('phone_number') and not data.get('email'):
            raise serializers.ValidationError("Either phone_number or email is required.")
        return data

# In backend/users/serializers.py

# ... (rest of the file content) ...

# Corrected UserSerializer
class UserSerializer(serializers.ModelSerializer):
    """Serializer for outputting user profile data."""
    class Meta:
        model = User
        fields = (
            'id', 
            'phone_number', 
            'full_name', 
            'email', 
            'role',  # Include role in response
            'is_active', 
            'date_joined'
        )
        read_only_fields = fields