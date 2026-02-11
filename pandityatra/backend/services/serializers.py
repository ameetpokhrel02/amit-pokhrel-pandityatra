from rest_framework import serializers
from .models import Puja, PujaCategory

class PujaCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PujaCategory
        fields = ('id', 'name', 'slug', 'description', 'image', 'icon', 'order')

class PujaSerializer(serializers.ModelSerializer):
    category_details = PujaCategorySerializer(source='category', read_only=True)
    
    class Meta:
        model = Puja
        fields = (
            'id',
            'name',
            'category',
            'category_details',
            'description', 
            'base_duration_minutes', 
            'base_price', 
            'is_available',
            'image'
        )
