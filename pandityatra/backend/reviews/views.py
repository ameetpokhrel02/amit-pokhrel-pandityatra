from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework import permissions
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema
from django.shortcuts import get_object_or_404
from django.db import models
from django.db.models import Avg, Count
from .models import Review, SiteReview
from .serializers import ReviewSerializer, SiteReviewSerializer
from bookings.models import Booking, BookingStatus
from notifications.services import notify_review_received
from rest_framework.pagination import PageNumberPagination

# ---------------------------
# Create Review
# ---------------------------
class CreateReviewView(generics.CreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        booking_id = self.request.data.get('booking')
        
        # Validate Booking
        booking = get_object_or_404(Booking, id=booking_id)
        
        # 1. Must be the customer of that booking
        if booking.user != user:
             raise permissions.PermissionDenied("You can only review your own bookings.")
        
        # 2. Booking must be completed
        if booking.status != BookingStatus.COMPLETED:
             pass 

        # 3. Check if already reviewed
        if Review.objects.filter(booking=booking).exists():
             raise permissions.PermissionDenied("You have already reviewed this booking.")

        review = serializer.save(
            customer=user, 
            pandit=booking.pandit,
            booking=booking
        )
        
        # 🔔 Notify pandit about the review
        notify_review_received(review)
        
        # Log Activity
        from adminpanel.utils import log_activity
        log_activity(
            user=user,
            action_type="REVIEW",
            details=f"Left a {serializer.validated_data.get('rating', '')} star review for {booking.pandit.user.full_name}",
            request=self.request,
            pandit=booking.pandit
        )


# ---------------------------
# Recent Pandit Reviews (public, for home page)
# ---------------------------
class RecentPanditReviewsView(generics.ListAPIView):
    """Get recent pandit reviews with customer info — public endpoint"""
    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        return Review.objects.select_related(
            'customer', 'pandit'
        ).order_by('-created_at')[:20]
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        data = []
        for r in queryset:
            data.append({
                'id': r.id,
                'customer_name': r.customer.full_name or r.customer.username,
                'customer_avatar': r.customer.profile_pic.url if r.customer.profile_pic else None,
                'pandit_name': r.pandit.user.full_name or r.pandit.user.username,
                'rating': r.rating,
                'comment': r.comment,
                'created_at': r.created_at,
            })
        
        # Aggregate stats
        stats = Review.objects.aggregate(
            avg_rating=Avg('rating'),
            total=Count('id'),
        )
        
        return Response({
            'reviews': data,
            'average_rating': round(stats['avg_rating'] or 0, 1),
            'total_reviews': stats['total'],
        })


# ---------------------------
# My Reviews (for customer profile)
# ---------------------------
class MyReviewsView(generics.ListAPIView):
    """List reviews given by the current user"""
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Review.objects.filter(customer=self.request.user).order_by('-created_at')


# ---------------------------
# Pandit Reviews (reviews received by logged-in pandit)
# ---------------------------
class PanditMyReviewsView(generics.ListAPIView):
    """List reviews received by current authenticated pandit."""
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # MTI: PanditUser inherits directly from User.
        # request.user IS the PanditUser — there is no separate 'pandit_profile' attribute.
        # The Review model's 'pandit' FK points to PanditUser, so we filter by user directly.
        if getattr(user, 'role', '') != 'pandit':
            return Review.objects.none()
        return Review.objects.filter(pandit=user).select_related(
            'customer', 'pandit', 'booking'
        ).order_by('-created_at')



# ---------------------------
# Site Reviews (public list + authenticated create)
# ---------------------------
class SiteReviewListCreateView(APIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = SiteReviewSerializer

    @extend_schema(summary="List or Create Site Reviews")
    def get(self, request):
        reviews = SiteReview.objects.filter(is_approved=True).select_related('user').order_by('-created_at')[:30]
        serializer = SiteReviewSerializer(reviews, many=True)
        
        stats = SiteReview.objects.filter(is_approved=True).aggregate(
            avg_rating=Avg('rating'),
            total=Count('id'),
            star_5=Count('id', filter=models.Q(rating=5)),
            star_4=Count('id', filter=models.Q(rating=4)),
            star_3=Count('id', filter=models.Q(rating=3)),
            star_2=Count('id', filter=models.Q(rating=2)),
            star_1=Count('id', filter=models.Q(rating=1)),
        )
        
        return Response({
            'reviews': serializer.data,
            'average_rating': round(stats['avg_rating'] or 0, 1),
            'total_reviews': stats['total'],
            'breakdown': {
                '5': stats['star_5'],
                '4': stats['star_4'],
                '3': stats['star_3'],
                '2': stats['star_2'],
                '1': stats['star_1'],
            }
        })
    
    @extend_schema(summary="Submit Site Review")
    def post(self, request):
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Determine role
        role = request.user.role
        if role not in ['customer', 'pandit', 'vendor']:
            # Fallback for older data or unexpected roles
            role = 'customer'
            if hasattr(request.user, 'pandit_profile'):
                role = 'pandit'
            elif hasattr(request.user, 'vendor_profile'):
                role = 'vendor'
        
        # Check if user already submitted
        existing = SiteReview.objects.filter(user=request.user).first()
        if existing:
            # Update existing review
            serializer = SiteReviewSerializer(existing, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        serializer = SiteReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user, role=role)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ---------------------------
# Admin: All Reviews (pandit + site) — admin only
# ---------------------------
class AdminAllReviewsView(APIView):
    permission_classes = [permissions.IsAdminUser]
    
    @extend_schema(summary="Admin: Get All Reviews (Site & Pandit)")
    def get(self, request):
        review_type = request.query_params.get('type', 'all')  # 'pandit', 'site', 'all'
        
        pandit_reviews_data = []
        site_reviews_data = []
        
        if review_type in ('pandit', 'all'):
            pandit_qs = Review.objects.select_related(
                'customer', 'pandit', 'booking'
            ).order_by('-created_at')
            
            for r in pandit_qs:
                pandit_reviews_data.append({
                    'id': r.id,
                    'type': 'pandit',
                    'customer_name': r.customer.full_name or r.customer.username,
                    'customer_email': r.customer.email,
                    'customer_avatar': r.customer.profile_pic.url if r.customer.profile_pic else None,
                    'pandit_name': r.pandit.user.full_name or r.pandit.user.username,
                    'rating': r.rating,
                    'professionalism': r.professionalism,
                    'knowledge': r.knowledge,
                    'punctuality': r.punctuality,
                    'comment': r.comment,
                    'is_verified': r.is_verified,
                    'created_at': r.created_at,
                    'booking_id': r.booking_id,
                })
        
        if review_type in ('site', 'all'):
            site_qs = SiteReview.objects.select_related('user').order_by('-created_at')
            
            for r in site_qs:
                site_reviews_data.append({
                    'id': r.id,
                    'type': 'site',
                    'user_name': r.user.full_name or r.user.username,
                    'user_email': r.user.email,
                    'user_avatar': r.user.profile_pic.url if r.user.profile_pic else None,
                    'role': r.role,
                    'rating': r.rating,
                    'comment': r.comment,
                    'is_approved': r.is_approved,
                    'created_at': r.created_at,
                })
        
        # Stats
        pandit_stats = Review.objects.aggregate(
            avg_rating=Avg('rating'), total=Count('id'),
        )
        site_stats = SiteReview.objects.aggregate(
            avg_rating=Avg('rating'), total=Count('id'),
        )
        
        return Response({
            'pandit_reviews': pandit_reviews_data,
            'site_reviews': site_reviews_data,
            'stats': {
                'pandit_avg': round(pandit_stats['avg_rating'] or 0, 1),
                'pandit_total': pandit_stats['total'],
                'site_avg': round(site_stats['avg_rating'] or 0, 1),
                'site_total': site_stats['total'],
            }
        })
    
    def patch(self, request):
        """Toggle approve/verify status of a review"""
        review_type = request.data.get('type')  # 'pandit' or 'site'
        review_id = request.data.get('id')
        
        if review_type == 'pandit':
            review = get_object_or_404(Review, id=review_id)
            review.is_verified = not review.is_verified
            review.save()
            return Response({'status': 'ok', 'is_verified': review.is_verified})
        elif review_type == 'site':
            review = get_object_or_404(SiteReview, id=review_id)
            review.is_approved = not review.is_approved
            review.save()
            return Response({'status': 'ok', 'is_approved': review.is_approved})
        
        return Response({'detail': 'Invalid type'}, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request):
        """Delete a review"""
        review_type = request.query_params.get('type')
        review_id = request.query_params.get('id')
        
        if review_type == 'pandit':
            review = get_object_or_404(Review, id=review_id)
            review.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        elif review_type == 'site':
            review = get_object_or_404(SiteReview, id=review_id)
            review.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        
        return Response({'detail': 'Invalid type'}, status=status.HTTP_400_BAD_REQUEST)
