import re
from rest_framework import serializers
from .models import User 
from pandits.models import PanditUser
from vendors.models import Vendor
from django.utils.crypto import get_random_string 

# Define the length of the random password (e.g., 20 characters)
RANDOM_PASSWORD_LENGTH = 20

def validate_password_strength(value):
    """
    Enforces strong password: min 8 chars, 1 upper, 1 lower, 1 digit, 1 special.
    """
    if len(value) < 8:
        raise serializers.ValidationError("Password must be at least 8 characters long.")
    if not re.search(r'[A-Z]', value):
        raise serializers.ValidationError("Password must contain at least one uppercase letter.")
    if not re.search(r'[a-z]', value):
        raise serializers.ValidationError("Password must contain at least one lowercase letter.")
    if not re.search(r'[0-9]', value):
        raise serializers.ValidationError("Password must contain at least one digit.")
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
        raise serializers.ValidationError("Password must contain at least one special character.")
    return value

# 🚨 NEW: Serializer for requesting OTP (Only needs phone number)
class RequestOTPSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=15)

class UserRegisterSerializer(serializers.ModelSerializer):
    # Email is now mandatory
    email = serializers.EmailField(required=True)
    # Phone is now optional
    phone_number = serializers.CharField(max_length=15, required=False, allow_blank=True, allow_null=True)
    # Make password optional - if not provided, will generate random one
    password = serializers.CharField(write_only=True, required=False, validators=[validate_password_strength], allow_blank=True, allow_null=True)
    # Add role field - default to 'user' if not provided (Admins cannot be created via public registration)
    role = serializers.ChoiceField(choices=[('user', 'User'), ('pandit', 'Pandit'), ('vendor', 'Vendor')], default='user', required=False)
    
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
        
        # 🚨 Inherited Models are handled by their own registration serializers.
        # This generic serializer is mainly for 'user' (customer) role.
        # But we keep this for backwards compatibility / internal use.
        if user.role == 'pandit':
            # Note: In MTI, we'd ideally convert the user to PanditUser
            # But for simplicity in this generic serializer, we just ensure the record exists.
            if not hasattr(user, 'pandituser'):
                PanditUser.objects.get_or_create(
                    user_ptr=user,
                    defaults={'experience_years': 0, 'language': "Nepali, Hindi", 'expertise': "General", 'bio': "New Pandit Member"}
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
    new_password = serializers.CharField(write_only=True, validators=[validate_password_strength])
    
    def validate(self, data):
        """Ensure either phone_number or email is provided."""
        if not data.get('phone_number') and not data.get('email'):
            raise serializers.ValidationError("Either phone_number or email is required.")
        return data

class UserSerializer(serializers.ModelSerializer):
    """Serializer for outputting user profile data."""
    pandit_profile = serializers.SerializerMethodField()
    vendor_profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 
            'phone_number', 
            'full_name', 
            'email', 
            'profile_pic',
            'role',
            'is_active', 
            'is_superuser',
            'is_staff',
            'date_joined',
            'pandit_profile',
            'vendor_profile'
        )
        read_only_fields = ('id', 'role', 'is_active', 'is_superuser', 'is_staff', 'date_joined')

    def get_pandit_profile(self, obj):
        if obj.role == 'pandit' and hasattr(obj, 'pandituser'):
            p = obj.pandituser
            return {
                'id': p.id,
                'expertise': p.expertise,
                'language': p.language,
                'experience_years': p.experience_years,
                'bio': p.bio,
                'rating': float(p.rating) if p.rating is not None else 0.0,
                'is_available': p.is_available,
                'is_verified': p.is_verified,
                'verification_status': p.verification_status
            }
        return None

    def get_vendor_profile(self, obj):
        if obj.role == 'vendor' and hasattr(obj, 'vendor'):
            v = obj.vendor
            return {
                'id': v.id,
                'shop_name': v.shop_name,
                'business_type': v.business_type,
                'is_verified': v.is_verified,
                'verification_status': v.verification_status,
                'balance': float(v.balance) if v.balance is not None else 0.0,
            }
        return None
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
        fields = ('id', 'name', 'email', 'subject', 'message', 'created_at', 'is_resolved', 'admin_note')
        read_only_fields = ('id', 'created_at')


from .models import SiteContent

class SiteContentSerializer(serializers.ModelSerializer):
    key_label = serializers.CharField(source='get_key_display', read_only=True)
    updated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = SiteContent
        fields = ('id', 'key', 'key_label', 'value', 'updated_at', 'updated_by', 'updated_by_name')
        read_only_fields = ('id', 'updated_at', 'updated_by', 'updated_by_name')

    def get_updated_by_name(self, obj):
        if obj.updated_by:
            return obj.updated_by.full_name or obj.updated_by.email
        return None
