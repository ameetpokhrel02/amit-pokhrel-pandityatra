from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SamagriCategoryViewSet, SamagriItemViewSet, PujaSamagriRequirementViewSet

# Create a router for Samagri management viewsets
router = DefaultRouter()

# Management endpoints (Admin/Staff only)
# /api/samagri/categories/
router.register(r'categories', SamagriCategoryViewSet, basename='samagri-category')
# /api/samagri/items/
router.register(r'items', SamagriItemViewSet, basename='samagri-item')
# /api/samagri/requirements/ (For linking items to Pujas)
router.register(r'requirements', PujaSamagriRequirementViewSet, basename='puja-samagri-requirement')


urlpatterns = [
    # Include all router endpoints
    path('', include(router.urls)),
]