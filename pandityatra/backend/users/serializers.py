from rest_framework import serializers
from .models import User 
from pandits.models import Pandit # 🚨 Enable Link
from django.utils.crypto import get_random_string 

# Define the length of the random password (e.g., 20 characters)
RANDOM_PASSWORD_LENGTH = 20

# 🚨 NEW: Serializer for requesting OTP (Only needs phone number)
class RequestOTPSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=15)

class UserRegisterSerializer(serializers.ModelSerializer):
    # Email is now mandatory
    email = serializers.EmailField(required=True)
    # Phone is now optional
    phone_number = serializers.CharField(max_length=15, required=False, allow_blank=True, allow_null=True)
    # Make password optional - if not provided, will generate random one
    password = serializers.CharField(write_only=True, required=False, min_length=6, allow_blank=True, allow_null=True)
    # Add role field - default to 'user' if not provided
    role = serializers.ChoiceField(choices=[('user', 'User'), ('pandit', 'Pandit'), ('admin', 'Admin')], default='user', required=False)
    
    class Meta:
        model = User
        fields = ('id', 'email', 'phone_number', 'full_name', 'password', 'role')
        read_only_fields = ('id',)
    
    def validate_email(self, value):
        """Check if email already exists"""
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate_phone_number(self, value):
        """Check if phone number already exists if provided"""
        if value and User.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError("A user with this phone number already exists.")
        return value
    
    def create(self, validated_data):
        email = validated_data['email'].strip().lower()
        # Use email as username (standard practice when email is the unique ID)
        username = email 
        phone_number = validated_data.get('phone_number')
        password = validated_data.get('password', '').strip() if validated_data.get('password') else ''
        
        # If no password provided, generate a random one
        if not password:
            password = get_random_string(RANDOM_PASSWORD_LENGTH)
        
        # Create user data
        user_data = {
            'username': username,
            'email': email,
            'full_name': validated_data.get('full_name', ''),
            'password': password,
            'role': validated_data.get('role', 'user'),
        }
        
        if phone_number:
            user_data['phone_number'] = phone_number
        
        # Ensure we use the correct creation method for the custom user model
        user = User.objects.create_user(**user_data)
        
        # 🚨 Auto-Create Pandit Profile if role is 'pandit'
        if user.role == 'pandit':
            # Create a default profile
            Pandit.objects.create(
                user=user,
                experience_years=0, # Default
                language="Nepali, Hindi", # Default
                expertise="General", # Default
                bio="New Pandit Member"
            )

        return user

# Existing: Serializer that handles generating the tokens after OTP verification.
# Used for the new LoginOTPView
class PhoneTokenSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=15)
    otp_code = serializers.CharField(max_length=6)

# Existing: Serializer for password-based login
class PasswordLoginSerializer(serializers.Serializer):
    """Serializer for password-based login."""
    phone_number = serializers.CharField(max_length=50, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    username = serializers.CharField(max_length=150, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=1)
    
    def validate(self, data):
        """Ensure either phone_number, email, or username is provided."""
        if not data.get('phone_number') and not data.get('email') and not data.get('username'):
            raise serializers.ValidationError("Either phone_number, email, or username is required.")
        return data

# Existing: Serializers for forgot password flow
class ForgotPasswordRequestSerializer(serializers.Serializer):
    """Serializer for requesting password reset OTP."""
    # Allow longer length (e.g. 50) to prevent validation errors if user sends a typo'd email as phone
    phone_number = serializers.CharField(max_length=50, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    
    def validate(self, data):
        """Ensure either phone_number or email is provided."""
        phone = data.get('phone_number')
        email = data.get('email')
        
        if not phone and not email:
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
    phone_number = serializers.CharField(max_length=50, required=False, allow_blank=True) # Relaxed Constraint
    email = serializers.EmailField(required=False, allow_blank=True)
    otp_code = serializers.CharField(max_length=6)
    new_password = serializers.CharField(write_only=True, min_length=6)
    
    def validate(self, data):
        """Ensure either phone_number or email is provided."""
        if not data.get('phone_number') and not data.get('email'):
            raise serializers.ValidationError("Either phone_number or email is required.")
        return data

# Corrected UserSerializer (moved to end for consistency)
class UserSerializer(serializers.ModelSerializer):
    """Serializer for outputting user profile data."""
    class Meta:
        model = User
        fields = (
            'id', 
            'phone_number', 
            'full_name', 
            'email', 
            'profile_pic_url', # Added field
            'role',  # Include role in response
            'is_active', 
            'date_joined'
        )
        read_only_fields = fields
# 🚨 ADMIN: Platform Settings
from .models import PlatformSetting

class PlatformSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformSetting
        fields = '__all__'

from .models import ContactMessage
class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ('id', 'name', 'email', 'subject', 'message', 'created_at')
        read_only_fields = ('id', 'created_at')
