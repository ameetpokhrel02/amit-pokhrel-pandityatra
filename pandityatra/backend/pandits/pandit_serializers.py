from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from .models import Pandit
from users.models import User


class PanditRegistrationSerializer(serializers.Serializer):
    """Separate serializer for Pandit registration with document upload"""
    phone_number = serializers.CharField(max_length=15)
    full_name = serializers.CharField(max_length=150)
    expertise = serializers.CharField(max_length=255)
    language = serializers.CharField(max_length=50)
    experience_years = serializers.IntegerField(min_value=0, max_value=100)
    bio = serializers.CharField(max_length=500, required=False, allow_blank=True)
    certification_file = serializers.FileField(required=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    
    def validate_phone_number(self, value):
        """Check if phone number already registered"""
        if User.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError("Phone number already registered")
        return value
    
    def create(self, validated_data):
        """Create user and pandit profile with PENDING verification status"""
        # Create User
        user = User.objects.create_user(
            username=validated_data['phone_number'],
            phone_number=validated_data['phone_number'],
            full_name=validated_data['full_name'],
            email=validated_data.get('email', ''),
            role='pandit'  # Set role to pandit
        )
        
        # Create Pandit profile
        pandit = Pandit.objects.create(
            user=user,
            expertise=validated_data['expertise'],
            language=validated_data['language'],
            experience_years=validated_data['experience_years'],
            bio=validated_data.get('bio', ''),
            certification_file=validated_data['certification_file'],
            verification_status='PENDING',  # Set to PENDING for admin review
            is_verified=False
        )
        
        return pandit


class PanditSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    phone_number = serializers.CharField(source='user.phone_number', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    certification_file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Pandit
        fields = (
            'id', 'user_id', 'username', 'full_name', 'phone_number', 'email',
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
