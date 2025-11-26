# pandityatra_backend/recommender/serializers.py

from rest_framework import serializers
from pandits.models import Pandit

class PanditRecommendationSerializer(serializers.ModelSerializer):
    """
    Serializer to display Pandit details along with the calculated score.
    Note: The 'score' field is added in the view context, not from the model.
    """
    # The score will be added manually in the view
    recommendation_score = serializers.DecimalField(max_digits=5, decimal_places=2) 
    
    class Meta:
        model = Pandit
        # Include fields required by the frontend display
        fields = ('id', 'full_name', 'expertise', 'language', 'rating', 'bio', 'recommendation_score')