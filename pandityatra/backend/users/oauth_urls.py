from django.urls import path
from .oauth_views import GoogleLoginView

urlpatterns = [
    path('google/', GoogleLoginView.as_view(), name='google_login'),
]
