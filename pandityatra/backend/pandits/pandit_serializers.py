from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from .models import PanditUser
from users.models import User


class PanditRegistrationSerializer(serializers.Serializer):
    """Separate serializer for Pandit registration with document upload"""
    phone_number = serializers.CharField(max_length=15, required=False, allow_blank=True)
    full_name = serializers.CharField(max_length=150, required=False)
    password = serializers.CharField(write_only=True, min_length=6, required=False, allow_blank=True)
    expertise = serializers.CharField(max_length=255)
    language = serializers.CharField(max_length=50)
    experience_years = serializers.IntegerField(min_value=0, max_value=100)
    bio = serializers.CharField(max_length=500, required=False, allow_blank=True)
    certification_file = serializers.FileField(required=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    
    def validate_phone_number(self, value):
        """Check if phone number already registered if user is anonymous"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            if User.objects.filter(phone_number=value).exists():
                raise serializers.ValidationError("Phone number already registered")
        return value

    def validate_email(self, value):
        """Check if email is already registered"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            if User.objects.filter(email__iexact=value).exists():
                raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def create(self, validated_data):
        """Create pandit user with PENDING verification status"""
        request = self.context.get('request')
        user = request.user if request else None

        email = validated_data.get('email', '')
        phone_number = validated_data.get('phone_number', '')

        if not user or user.is_anonymous:
            # Extract password
            password = validated_data.pop('password', None)
            if not password:
                raise serializers.ValidationError({"password": "Password is required for manual registration."})
            
            # Unique Username Generation
            username = phone_number or email.split('@')[0]
            import random, string
            while User.objects.filter(username=username).exists():
                suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
                username = f"{username}_{suffix}"

            # Create PanditUser directly (MTI creates User + PanditUser row)
            pandit = PanditUser(
                username=username,
                email=email,
                phone_number=phone_number,
                full_name=validated_data.get('full_name', ''),
                role='pandit',
                expertise=validated_data['expertise'],
                language=validated_data['language'],
                experience_years=validated_data['experience_years'],
                bio=validated_data.get('bio', ''),
                certification_file=validated_data['certification_file'],
                verification_status='PENDING',
                is_verified=False
            )
            pandit.set_password(password)
            pandit.save()
            return pandit
        else:
            # Promote existing user to PanditUser (Handled in views normally, but here we can try)
            # However, for simplicity in the API, we expect registration to create a new one
            # OR we can assume the user was already promoted via the migration script
            if hasattr(user, 'pandituser'):
                return user.pandituser
            raise serializers.ValidationError("Promotion not supported in this serializer. Use the migration script or admin.")

class PanditSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='id', read_only=True)
    username = serializers.CharField(read_only=True)
    full_name = serializers.CharField(read_only=True)
    phone_number = serializers.CharField(read_only=True)
    email = serializers.CharField(read_only=True)
    certification_file_url = serializers.SerializerMethodField()
    
    user_details = serializers.SerializerMethodField()

    class Meta:
        model = PanditUser
        fields = (
            'id', 'user_id', 'user_details', 'username', 'full_name', 'phone_number', 'email',
            'expertise', 'language', 'experience_years', 'bio', 'rating',
            'is_available', 'verification_status', 'is_verified', 'verified_date',
            'verification_notes', 'certification_file', 'certification_file_url',
            'date_joined', 'updated_at'
        )
        read_only_fields = ('id', 'user_id', 'is_verified', 'verified_date', 'date_joined', 'updated_at')
    
    def get_certification_file_url(self, obj):
        """Get URL for certification file"""
        if obj.certification_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.certification_file.url)
            return obj.certification_file.url
        return None

    def get_user_details(self, obj):
        request = self.context.get('request')
        profile_pic_url = None
        if obj.profile_pic:
            profile_pic_url = request.build_absolute_uri(obj.profile_pic.url) if request else obj.profile_pic.url
        return {
            'email': obj.email,
            'full_name': obj.full_name,
            'phone_number': obj.phone_number,
            'profile_pic': profile_pic_url,
            'is_active': obj.is_active,
        }
