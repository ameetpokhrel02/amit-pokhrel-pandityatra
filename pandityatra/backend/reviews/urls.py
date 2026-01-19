from django.urls import path
from .views import CreateReviewView

urlpatterns = [
    path('create/', CreateReviewView.as_view(), name='create-review'),
]
