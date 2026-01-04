# pandityatra_backend/recommender/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SamagriRecommendationViewSet,
    PujaTemplateViewSet,
    BookingSamagriRecommendationView,
    UserSamagriPreferenceViewSet,
    RecommendationLogViewSet
)

router = DefaultRouter()
router.register(r'recommendations', SamagriRecommendationViewSet, basename='samagri-recommendation')
router.register(r'templates', PujaTemplateViewSet, basename='puja-template')
router.register(r'user/preferences', UserSamagriPreferenceViewSet, basename='user-preference')
router.register(r'logs', RecommendationLogViewSet, basename='recommendation-log')

urlpatterns = [
    path('', include(router.urls)),
    # Booking-specific samagri endpoints
    path('bookings/<int:booking_id>/samagri/', 
         BookingSamagriRecommendationView.as_view({'get': 'list'}), 
         name='booking-samagri-list'),
    path('bookings/<int:booking_id>/samagri/recommendations/', 
         BookingSamagriRecommendationView.as_view({'post': 'get_recommendations'}), 
         name='booking-samagri-recommendations'),
    path('bookings/<int:booking_id>/samagri/auto-add/', 
         BookingSamagriRecommendationView.as_view({'post': 'auto_add_recommendations'}), 
         name='booking-samagri-auto-add'),
    path('bookings/<int:booking_id>/samagri/add-item/', 
         BookingSamagriRecommendationView.as_view({'post': 'add_samagri_item'}), 
         name='booking-samagri-add-item'),
]