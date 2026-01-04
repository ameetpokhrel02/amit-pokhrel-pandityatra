"""
AI-Powered Recommendation Logic for Samagri (Ritual Materials)

This module implements the business logic for recommending samagri items
based on puja type, user preferences, and historical data.

Future: Can be replaced with ML models (Collaborative Filtering, Content-Based)
Current: Rule-based recommendations with confidence scoring
"""

from datetime import datetime, timedelta
from decimal import Decimal
from django.utils import timezone
from .models import SamagriRecommendation, UserSamagriPreference, RecommendationLog
from samagri.models import SamagriItem
from bookings.models import BookingSamagriItem, Booking


class SamagriRecommender:
    """
    Core recommendation engine for samagri items.
    Uses rule-based logic for MVP, can be extended with ML.
    """
    
    def __init__(self, user=None, puja=None, booking=None):
        self.user = user
        self.puja = puja
        self.booking = booking
        self.recommendations = []
    
    def get_recommendations(self, limit=10, min_confidence=0.3):
        """
        Get top N samagri recommendations for a puja.
        
        Args:
            limit: Maximum number of recommendations
            min_confidence: Minimum confidence score (0.0-1.0)
        
        Returns:
            Queryset of SamagriRecommendation objects
        """
        recommendations = SamagriRecommendation.objects.filter(
            puja=self.puja,
            is_active=True,
            confidence_score__gte=min_confidence
        ).order_by('-is_essential', '-confidence_score', 'priority')[:limit]
        
        return recommendations
    
    def get_personalized_recommendations(self, limit=10):
        """
        Get recommendations personalized for the user based on:
        - User's purchase history
        - User preferences (favorites, never recommend)
        - Historical purchase patterns
        - Seasonal considerations
        
        Args:
            limit: Maximum number of recommendations
        
        Returns:
            List of SamagriRecommendation objects
        """
        if not self.user or not self.puja:
            return self.get_recommendations(limit)
        
        # Get base recommendations for the puja
        base_recommendations = self.get_recommendations(limit * 2)
        
        # Filter using user preferences
        filtered = []
        for rec in base_recommendations:
            # Check if user has marked this as "never recommend"
            user_pref = UserSamagriPreference.objects.filter(
                user=self.user,
                samagri_item=rec.samagri_item
            ).first()
            
            if user_pref and user_pref.never_recommend:
                continue  # Skip this item
            
            # Boost confidence if it's a user favorite
            if user_pref and user_pref.is_favorite:
                rec.confidence_score = min(1.0, rec.confidence_score + 0.1)
            
            filtered.append(rec)
        
        return filtered[:limit]
    
    def get_seasonal_recommendations(self, limit=10):
        """
        Get recommendations specific to current season/month.
        Useful for festivals and seasonal pujas.
        
        Returns:
            List of seasonal SamagriRecommendation objects
        """
        current_month = datetime.now().month
        
        recommendations = SamagriRecommendation.objects.filter(
            puja=self.puja,
            is_active=True,
            is_seasonal=True
        ).filter(
            seasonal_months__contains=str(current_month)
        ).order_by('-confidence_score')[:limit]
        
        return recommendations
    
    def auto_add_recommendations(self, confidence_threshold=0.8):
        """
        Auto-add high-confidence recommendations to booking.
        Only adds items marked as is_essential=True.
        
        Args:
            confidence_threshold: Minimum confidence to auto-add
        
        Returns:
            List of BookingSamagriItem objects created
        """
        if not self.booking:
            raise ValueError("Booking is required for auto_add_recommendations")
        
        auto_added = []
        recommendations = SamagriRecommendation.objects.filter(
            puja=self.booking.service,
            is_active=True,
            is_essential=True,
            confidence_score__gte=confidence_threshold
        )
        
        for rec in recommendations:
            # Check if already exists in booking
            exists = BookingSamagriItem.objects.filter(
                booking=self.booking,
                samagri_item=rec.samagri_item
            ).exists()
            
            if not exists:
                booking_item = BookingSamagriItem.objects.create(
                    booking=self.booking,
                    samagri_item=rec.samagri_item,
                    recommendation=rec,
                    status='AUTO_ADDED',
                    quantity=rec.quantity_default,
                    unit=rec.unit,
                    unit_price=rec.samagri_item.price,
                    is_essential=True,
                    is_optional=False,
                    is_included=True,
                    reason=rec.reason
                )
                
                # Calculate price
                booking_item.calculate_total_price()
                
                # Update booking's samagri fee
                self._update_booking_samagri_fee()
                
                auto_added.append(booking_item)
                
                # Log the recommendation
                self._log_recommendation(rec, 'AUTO_ADDED')
        
        return auto_added
    
    def add_recommendation_to_booking(self, recommendation, quantity=None):
        """
        Add a recommended item to the booking.
        
        Args:
            recommendation: SamagriRecommendation object
            quantity: Quantity to add (default: recommendation.quantity_default)
        
        Returns:
            BookingSamagriItem object
        """
        if not self.booking:
            raise ValueError("Booking is required")
        
        quantity = quantity or recommendation.quantity_default
        
        # Check if already exists
        booking_item = BookingSamagriItem.objects.filter(
            booking=self.booking,
            samagri_item=recommendation.samagri_item
        ).first()
        
        if booking_item:
            # Update existing
            booking_item.quantity = quantity
            booking_item.is_included = True
            booking_item.status = 'SELECTED'
            booking_item.save()
        else:
            # Create new
            booking_item = BookingSamagriItem.objects.create(
                booking=self.booking,
                samagri_item=recommendation.samagri_item,
                recommendation=recommendation,
                status='SELECTED',
                quantity=quantity,
                unit=recommendation.unit,
                unit_price=recommendation.samagri_item.price,
                is_essential=recommendation.is_essential,
                is_optional=recommendation.is_optional,
                is_included=True,
                reason=recommendation.reason
            )
            booking_item.calculate_total_price()
        
        # Update booking samagri fee
        self._update_booking_samagri_fee()
        
        # Track recommendation
        recommendation.increment_recommendation()
        
        # Log it
        self._log_recommendation(recommendation, 'SELECTED')
        
        return booking_item
    
    def remove_samagri_item(self, booking_item):
        """
        Remove a samagri item from booking.
        Cannot remove essential items.
        
        Args:
            booking_item: BookingSamagriItem object
        
        Returns:
            bool: Success status
        """
        if booking_item.is_essential:
            raise ValueError("Cannot remove essential items")
        
        booking_item.is_included = False
        booking_item.status = 'REMOVED'
        booking_item.save()
        
        # Update booking fee
        self._update_booking_samagri_fee()
        
        return True
    
    def update_quantity(self, booking_item, quantity):
        """
        Update quantity of a samagri item in booking.
        
        Args:
            booking_item: BookingSamagriItem object
            quantity: New quantity
        
        Returns:
            BookingSamagriItem object
        """
        booking_item.quantity = quantity
        booking_item.calculate_total_price()
        
        # Update booking fee
        self._update_booking_samagri_fee()
        
        return booking_item
    
    def get_booking_samagri(self):
        """
        Get all samagri items in the current booking.
        
        Returns:
            Queryset of BookingSamagriItem objects
        """
        if not self.booking:
            raise ValueError("Booking is required")
        
        return self.booking.samagri_items.filter(is_included=True)
    
    def get_booking_samagri_total(self):
        """
        Calculate total samagri cost for booking.
        
        Returns:
            Decimal: Total cost
        """
        if not self.booking:
            raise ValueError("Booking is required")
        
        total = sum(
            item.total_price for item in self.get_booking_samagri()
        )
        return Decimal(str(total))
    
    def _update_booking_samagri_fee(self):
        """Update the samagri fee in booking"""
        if not self.booking:
            return
        
        total = self.get_booking_samagri_total()
        self.booking.samagri_fee = total
        self.booking.calculate_total_fee()
    
    def _log_recommendation(self, recommendation, status):
        """
        Log the recommendation for analytics.
        
        Args:
            recommendation: SamagriRecommendation object
            status: 'AUTO_ADDED', 'SELECTED', 'REMOVED'
        """
        if not self.user or not self.booking:
            return
        
        log, created = RecommendationLog.objects.get_or_create(
            user=self.user,
            booking=self.booking
        )
        
        if status == 'SELECTED':
            log.clicked_count += 1
            log.purchased_count += 1
        elif status == 'AUTO_ADDED':
            log.shown_count += 1
            log.purchased_count += 1
        
        log.recommendations.add(recommendation)
        log.save()


class RecommendationAnalytics:
    """
    Analytics for recommendation system performance.
    Tracks accuracy, conversion rates, and user feedback.
    """
    
    @staticmethod
    def get_recommendation_accuracy(puja, days=30):
        """
        Calculate recommendation accuracy for a puja over last N days.
        
        Args:
            puja: Puja object
            days: Number of days to analyze
        
        Returns:
            dict: Accuracy metrics
        """
        cutoff_date = timezone.now() - timedelta(days=days)
        
        recommendations = SamagriRecommendation.objects.filter(
            puja=puja,
            updated_at__gte=cutoff_date
        )
        
        total_shown = sum(rec.times_recommended for rec in recommendations)
        total_purchased = sum(rec.times_purchased for rec in recommendations)
        
        accuracy = (total_purchased / total_shown * 100) if total_shown > 0 else 0
        
        return {
            'total_shown': total_shown,
            'total_purchased': total_purchased,
            'accuracy_percentage': round(accuracy, 2),
            'recommendations_count': recommendations.count()
        }
    
    @staticmethod
    def get_user_preference_insights(user):
        """
        Get user's preference insights for personalization.
        
        Args:
            user: User object
        
        Returns:
            dict: User preference data
        """
        preferences = UserSamagriPreference.objects.filter(
            user=user
        ).order_by('-times_purchased')
        
        favorites = preferences.filter(is_favorite=True)
        never_recommend = preferences.filter(never_recommend=True)
        
        return {
            'total_purchases': preferences.count(),
            'favorites_count': favorites.count(),
            'never_recommend_count': never_recommend.count(),
            'top_items': [
                {
                    'name': p.samagri_item.name,
                    'times_purchased': p.times_purchased,
                    'total_spent': str(p.total_spent)
                }
                for p in preferences[:5]
            ]
        }
    
    @staticmethod
    def get_popular_samagri(limit=10):
        """
        Get most popular samagri items across all recommendations.
        
        Returns:
            List of SamagriRecommendation objects
        """
        return SamagriRecommendation.objects.filter(
            is_active=True
        ).order_by('-times_purchased')[:limit]