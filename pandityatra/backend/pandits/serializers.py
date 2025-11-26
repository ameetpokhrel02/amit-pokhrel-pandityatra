from rest_framework import serializers
from .models import Pandit
from users.serializers import UserSerializer # Assuming UserSerializer is in users app

class PanditSerializer(serializers.ModelSerializer):
    # 1. READ-ONLY: Inherit User details for display
    # This embeds the associated user's details (full_name, phone_number, etc.) 
    # directly into the Pandit profile response, making it easier to read.
    user_details = UserSerializer(source='user', read_only=True)

    # 2. READ/WRITE: We only need the user ID for creation/update
    # However, since the `user` field is a OneToOneField, it is best managed 
    # automatically when creating the Pandit profile for the logged-in user.
    
    class Meta:
        model = Pandit
        # Include all fields from the Pandit model. 
        # Ensure these fields match your Pandit model definition.
        fields = (
            'id', 
            'user',        # The OneToOneField to User (often read-only/hidden in this context)
            'user_details',# The embedded User data
            'expertise', 
            'experience_years', 
            'is_verified', 
            'date_joined'
        )
        read_only_fields = ('id', 'user_details', 'date_joined', 'user') 
        # Note: We set 'user' as read-only because we will link it automatically 
        # in the view based on the logged-in user (request.user).