from django.urls import path
from .views import CreateReviewView, RecentPanditReviewsView, SiteReviewListCreateView, AdminAllReviewsView

urlpatterns = [
    path('create/', CreateReviewView.as_view(), name='create-review'),
    path('pandit-reviews/', RecentPanditReviewsView.as_view(), name='recent-pandit-reviews'),
    path('site-reviews/', SiteReviewListCreateView.as_view(), name='site-reviews'),
    path('admin-reviews/', AdminAllReviewsView.as_view(), name='admin-reviews'),
]
