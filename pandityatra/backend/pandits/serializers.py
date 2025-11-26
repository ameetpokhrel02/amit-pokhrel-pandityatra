# In backend/pandits/serializers.py

from rest_framework import serializers
from .models import Pandit

class PanditSerializer(serializers.ModelSerializer): # <--- Check this line carefully for spelling/case
    class Meta:
        model = Pandit
        # Include all fields you want the frontend to see
        fields = (
            'id', 
            'full_name', 
            'expertise', 
            'language', 
            'rating', 
            'bio', 
            'is_available'
        )