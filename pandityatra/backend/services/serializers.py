# In backend/services/serializers.py

from rest_framework import serializers
from .models import Puja 

class PujaSerializer(serializers.ModelSerializer):
    # pandit ID with the pandit's fullname for carity
    pandit_name = serializers.ReadOnlyField(source='pandit.full_name')
    
    class Meta:
        model = Puja
        fields = (
            'id', 
            'pandit', # Foreign Key field
            'pandit_name', 
            'description', 
            'duration_minutes', 
            'price', 
            'is_available'
        )
        # pandit_name is read-only
        read_only_fields = ('id', 'pandit_name')
        
        # 🚨 FIX: Add extra_kwargs to mark 'pandit' as read-only or not required 🚨
        # We must mark it as read-only because it should be supplied by the view, 
        # not the user in the POST body.
        extra_kwargs = {
            'pandit': {'read_only': True} 
        }