from rest_framework import serializers
from .models import Puja 

class PujaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Puja
        fields = (
            'id',
            'name',
            'description', 
            'base_duration_minutes', 
            'base_price', 
            'is_available',
            'image'
        )
