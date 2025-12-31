# pandityatra_backend/recommender/views.py (SIMPLIFIED & CORRECTED)

from decimal import Decimal
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .logic import recommend_pandits
from .serializers import PanditRecommendationSerializer


class PanditRecommendationView(APIView):
    """
    API endpoint to retrieve ranked Pandit recommendations for the authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # 1. Role Check
        if request.user.role != 'user': 
             return Response({"detail": "Access denied. Only customer accounts receive recommendations."}, status=403)

        # 2. Get recommendations
        # IMPORTANT: recommend_pandits now returns a list of DICTIONARIES 
        # (each dict contains 'id', 'full_name', 'rating', 'recommendation_score', etc.)
        ranked_and_scored_pandits = recommend_pandits(request.user.id)
        
        # 3. Serialize the list of dictionaries directly
        # The serializer handles the list of pre-formatted dictionaries.
        # We don't need to loop and manually extract attributes like pandit.id or pandit.full_name.
        
        serializer = PanditRecommendationSerializer(ranked_and_scored_pandits, many=True)
        return Response(serializer.data, status=200) # Ensure status 200 is explicit