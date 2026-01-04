# pandityatra_backend/recommender/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from django.shortcuts import get_object_or_404

from .models import (
    SamagriRecommendation,
    PujaTemplate,
    UserSamagriPreference,
    RecommendationLog
)
from bookings.models import Booking, BookingSamagriItem
from services.models import Puja

from .serializers import (
    SamagriRecommendationSerializer,
    SamagriRecommendationDetailedSerializer,
    PujaTemplateSerializer,
    UserSamagriPreferenceSerializer,
    RecommendationLogSerializer,
    RecommendationStatsSerializer,
    UserPreferenceInsightsSerializer
)
from .logic import SamagriRecommender, RecommendationAnalytics


class SamagriRecommendationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing samagri recommendations.
    
    Endpoints:
    - GET /api/recommendations/ - List all recommendations
    - GET /api/recommendations/{id}/ - Get recommendation details
    - POST /api/recommendations/ - Create recommendation (admin only)
    - GET /api/recommendations/by_puja/{puja_id}/ - Get recommendations for a puja
    - GET /api/recommendations/stats/{puja_id}/ - Get recommendation stats
    """
    queryset = SamagriRecommendation.objects.all()
    serializer_class = SamagriRecommendationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return SamagriRecommendationDetailedSerializer
        return self.serializer_class
    
    def create(self, request, *args, **kwargs):
        """Only admins can create recommendations"""
        if request.user.role != 'admin':
            raise PermissionDenied("Only admins can create recommendations")
        return super().create(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def by_puja(self, request):
        """
        Get recommendations for a specific puja.
        Query params: puja_id, limit=10, min_confidence=0.3
        """
        puja_id = request.query_params.get('puja_id')
        if not puja_id:
            return Response(
                {'error': 'puja_id parameter required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        puja = get_object_or_404(Puja, id=puja_id)
        limit = int(request.query_params.get('limit', 10))
        min_confidence = float(request.query_params.get('min_confidence', 0.3))
        
        recommender = SamagriRecommender(user=request.user, puja=puja)
        recommendations = recommender.get_recommendations(limit, min_confidence)
        
        serializer = self.get_serializer(recommendations, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def personalized(self, request):
        """
        Get personalized recommendations for the user.
        Query params: puja_id, limit=10
        """
        puja_id = request.query_params.get('puja_id')
        if not puja_id:
            return Response(
                {'error': 'puja_id parameter required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        puja = get_object_or_404(Puja, id=puja_id)
        limit = int(request.query_params.get('limit', 10))
        
        recommender = SamagriRecommender(user=request.user, puja=puja)
        recommendations = recommender.get_personalized_recommendations(limit)
        
        serializer = self.get_serializer(recommendations, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def seasonal(self, request):
        """
        Get seasonal recommendations.
        Query params: puja_id, limit=10
        """
        puja_id = request.query_params.get('puja_id')
        if not puja_id:
            return Response(
                {'error': 'puja_id parameter required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        puja = get_object_or_404(Puja, id=puja_id)
        limit = int(request.query_params.get('limit', 10))
        
        recommender = SamagriRecommender(user=request.user, puja=puja)
        recommendations = recommender.get_seasonal_recommendations(limit)
        
        serializer = self.get_serializer(recommendations, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get recommendation statistics for a puja.
        Query params: puja_id, days=30
        """
        puja_id = request.query_params.get('puja_id')
        if not puja_id:
            return Response(
                {'error': 'puja_id parameter required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        puja = get_object_or_404(Puja, id=puja_id)
        days = int(request.query_params.get('days', 30))
        
        stats = RecommendationAnalytics.get_recommendation_accuracy(puja, days)
        serializer = RecommendationStatsSerializer(stats)
        return Response(serializer.data)


class PujaTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for puja templates (pre-configured samagri bundles).
    
    Endpoints:
    - GET /api/templates/ - List all templates
    - GET /api/templates/{id}/ - Get template details
    - POST /api/templates/ - Create template (admin only)
    - PUT /api/templates/{id}/ - Update template (admin only)
    - DELETE /api/templates/{id}/ - Delete template (admin only)
    - GET /api/templates/featured/ - Get featured templates
    """
    queryset = PujaTemplate.objects.filter(is_active=True)
    serializer_class = PujaTemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        """Only admins can create templates"""
        if request.user.role != 'admin':
            raise PermissionDenied("Only admins can create templates")
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        """Only admins can update templates"""
        if request.user.role != 'admin':
            raise PermissionDenied("Only admins can update templates")
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Only admins can delete templates"""
        if request.user.role != 'admin':
            raise PermissionDenied("Only admins can delete templates")
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get featured templates"""
        templates = self.queryset.filter(is_featured=True)
        serializer = self.get_serializer(templates, many=True)
        return Response(serializer.data)


class BookingSamagriRecommendationView(viewsets.ViewSet):
    """
    ViewSet for managing samagri in bookings.
    
    Endpoints:
    - GET /api/bookings/{booking_id}/samagri/ - Get samagri items
    - POST /api/bookings/{booking_id}/samagri/recommendations/ - Get recommendations
    - POST /api/bookings/{booking_id}/samagri/auto-add/ - Auto-add recommendations
    - POST /api/bookings/{booking_id}/samagri/add-item/ - Add item to booking
    - DELETE /api/bookings/{booking_id}/samagri/{item_id}/ - Remove item
    - PUT /api/bookings/{booking_id}/samagri/{item_id}/ - Update quantity
    """
    permission_classes = [IsAuthenticated]
    
    def list(self, request, booking_id=None):
        """Get all samagri items in a booking"""
        booking = get_object_or_404(Booking, id=booking_id)
        
        # Check permission
        if booking.user != request.user and request.user.role != 'admin':
            raise PermissionDenied("Cannot access this booking")
        
        items = booking.samagri_items.filter(is_included=True)
        serializer = SamagriRecommendationSerializer(items, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], url_path=f'(?P<booking_id>[^/.]+)/samagri/recommendations')
    def get_recommendations(self, request, booking_id=None):
        """Get recommendations for a booking"""
        booking = get_object_or_404(Booking, id=booking_id)
        
        # Check permission
        if booking.user != request.user and request.user.role != 'admin':
            raise PermissionDenied("Cannot access this booking")
        
        if not booking.service:
            return Response(
                {'error': 'Booking has no service'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        limit = request.data.get('limit', 10)
        min_confidence = request.data.get('min_confidence', 0.3)
        personalized = request.data.get('personalized', True)
        
        recommender = SamagriRecommender(
            user=request.user,
            puja=booking.service,
            booking=booking
        )
        
        if personalized:
            recommendations = recommender.get_personalized_recommendations(limit)
        else:
            recommendations = recommender.get_recommendations(limit, min_confidence)
        
        serializer = SamagriRecommendationSerializer(recommendations, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], url_path=f'(?P<booking_id>[^/.]+)/samagri/auto-add')
    def auto_add_recommendations(self, request, booking_id=None):
        """Auto-add high-confidence recommendations to booking"""
        booking = get_object_or_404(Booking, id=booking_id)
        
        # Check permission
        if booking.user != request.user and request.user.role != 'admin':
            raise PermissionDenied("Cannot access this booking")
        
        if not booking.service:
            return Response(
                {'error': 'Booking has no service'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        confidence_threshold = request.data.get('confidence_threshold', 0.8)
        
        recommender = SamagriRecommender(
            user=request.user,
            puja=booking.service,
            booking=booking
        )
        
        added_items = recommender.auto_add_recommendations(confidence_threshold)
        
        return Response({
            'message': f'{len(added_items)} items auto-added',
            'items_added': len(added_items),
            'booking_id': booking.id,
            'total_samagri_fee': str(booking.samagri_fee),
            'total_fee': str(booking.total_fee)
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'], url_path=f'(?P<booking_id>[^/.]+)/samagri/add-item')
    def add_samagri_item(self, request, booking_id=None):
        """Add a recommended samagri item to booking"""
        booking = get_object_or_404(Booking, id=booking_id)
        
        # Check permission
        if booking.user != request.user and request.user.role != 'admin':
            raise PermissionDenied("Cannot access this booking")
        
        recommendation_id = request.data.get('recommendation_id')
        quantity = request.data.get('quantity')
        
        if not recommendation_id:
            return Response(
                {'error': 'recommendation_id required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        recommendation = get_object_or_404(SamagriRecommendation, id=recommendation_id)
        
        recommender = SamagriRecommender(
            user=request.user,
            puja=booking.service,
            booking=booking
        )
        
        item = recommender.add_recommendation_to_booking(recommendation, quantity)
        
        return Response({
            'message': 'Item added to booking',
            'item_id': item.id,
            'booking_id': booking.id,
            'total_samagri_fee': str(booking.samagri_fee),
            'total_fee': str(booking.total_fee)
        }, status=status.HTTP_201_CREATED)


class UserSamagriPreferenceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for user samagri preferences.
    
    Endpoints:
    - GET /api/user/preferences/ - Get user's preferences
    - POST /api/user/preferences/ - Create preference
    - PUT /api/user/preferences/{id}/ - Update preference
    - DELETE /api/user/preferences/{id}/ - Delete preference
    - GET /api/user/preferences/insights/ - Get user insights
    """
    serializer_class = UserSamagriPreferenceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Only return current user's preferences"""
        return UserSamagriPreference.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """Auto-set user to current user"""
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def insights(self, request):
        """Get user's preference insights"""
        insights = RecommendationAnalytics.get_user_preference_insights(request.user)
        serializer = UserPreferenceInsightsSerializer(insights)
        return Response(serializer.data)


class RecommendationLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for recommendation logs (read-only).
    
    Endpoints:
    - GET /api/logs/ - List recommendation logs
    - GET /api/logs/{id}/ - Get log details
    """
    serializer_class = RecommendationLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Only return current user's logs"""
        if self.request.user.role == 'admin':
            return RecommendationLog.objects.all()
        return RecommendationLog.objects.filter(user=self.request.user)