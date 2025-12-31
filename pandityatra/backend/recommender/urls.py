# pandityatra_backend/recommender/urls.py

from django.urls import path
from .views import PanditRecommendationView

urlpatterns = [
    # Endpoint: GET /api/recommender/pandits/
    path('pandits/', PanditRecommendationView.as_view(), name='pandit-recommendation'),
]