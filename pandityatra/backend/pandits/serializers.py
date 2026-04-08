from rest_framework import serializers
from .models import PanditUser, PanditService, PanditAvailability
from users.serializers import UserSerializer
from services.serializers import PujaSerializer
from services.models import Puja
from reviews.serializers import ReviewSerializer

class PanditSerializer(serializers.ModelSerializer):
    """
    Serializer for Pandit Account management (replaces old Profile system).
    Now inherits directly from User.
    """
    user_details = serializers.SerializerMethodField()
    
    class Meta:
        model = PanditUser
        fields = (
            'id', 
            'user_details',
            'expertise', 
            'experience_years',
            'language',
            'bio',
            'rating',
            'is_available',
            'is_verified', 
            'verification_status',
            'certification_file',
            'date_joined'
        )
        read_only_fields = ('id', 'user_details', 'date_joined') 

    def get_user_details(self, obj):
        # PanditUser IS a User, so we return the user fields
        request = self.context.get('request')
        profile_pic_url = obj.profile_pic.url if obj.profile_pic else None
        
        if profile_pic_url and request:
            profile_pic_url = request.build_absolute_uri(profile_pic_url)
            
        return {
            'id': obj.id,
            'full_name': obj.full_name,
            'email': obj.email,
            'phone_number': obj.phone_number,
            'profile_pic': profile_pic_url,
        }

class PanditSimpleSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    email = serializers.CharField(read_only=True)
    
    class Meta:
        model = PanditUser
        fields = ['id', 'full_name', 'email']

class PanditServiceSerializer(serializers.ModelSerializer):
    puja_details = PujaSerializer(source='puja', read_only=True)
    puja_id = serializers.PrimaryKeyRelatedField(
        queryset=Puja.objects.all(), source='puja', write_only=True
    )

    class Meta:
        model = PanditService
        fields = [
            'id', 'pandit', 'puja_id', 'puja_details', 
            'custom_price', 'duration_minutes', 'is_active', 
            'is_online', 'is_offline'
        ]
        read_only_fields = ['id', 'pandit']

class PanditAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = PanditAvailability
        fields = ['id', 'start_time', 'end_time', 'title', 'created_at']
        read_only_fields = ['id', 'created_at']

class PanditDetailSerializer(PanditSerializer):
    services = PanditServiceSerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    
    # Aliases
    average_rating = serializers.DecimalField(source='rating', max_digits=3, decimal_places=2, read_only=True)
    total_reviews = serializers.IntegerField(source='reviews.count', read_only=True)
    review_count = serializers.IntegerField(source='reviews.count', read_only=True)

    class Meta(PanditSerializer.Meta):
        fields = (
            'id', 'user_details', 'bio', 'expertise', 'language', 'experience_years', 
            'is_verified', 'services', 'average_rating', 'rating', 'review_count', 'total_reviews', 'reviews'
        )
