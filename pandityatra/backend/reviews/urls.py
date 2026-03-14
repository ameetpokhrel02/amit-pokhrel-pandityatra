from django.urls import path
from .views import (
    AdminAllReviewsView,
    CreateReviewView,
    MyReviewsView,
    PanditMyReviewsView,
    RecentPanditReviewsView,
    SiteReviewListCreateView,
)

urlpatterns = [
    path('create/', CreateReviewView.as_view(), name='create-review'),
    path('pandit-reviews/', RecentPanditReviewsView.as_view(), name='recent-pandit-reviews'),
    path('site-reviews/', SiteReviewListCreateView.as_view(), name='site-reviews'),
    path('my-reviews/', MyReviewsView.as_view(), name='my-reviews'),
    path('pandit/my-reviews/', PanditMyReviewsView.as_view(), name='pandit-my-reviews'),
    path('admin-reviews/', AdminAllReviewsView.as_view(), name='admin-reviews'),
]
