from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SamagriCategoryViewSet, SamagriItemViewSet, PujaSamagriRequirementViewSet, ShopCheckoutViewSet, AISamagriRecommendationView

# Create a router for Samagri management viewsets
router = DefaultRouter()

# Management endpoints (Admin/Staff only)
router.register(r'categories', SamagriCategoryViewSet, basename='samagri-category')
router.register(r'items', SamagriItemViewSet, basename='samagri-item')
router.register(r'requirements', PujaSamagriRequirementViewSet, basename='puja-samagri-requirement')

# Checkout endpoints
router.register(r'checkout', ShopCheckoutViewSet, basename='shop-checkout')

urlpatterns = [
    # Include all router endpoints
    path('', include(router.urls)),
    path('ai_recommend/', AISamagriRecommendationView.as_view(), name='ai-samagri-recommend'),
]