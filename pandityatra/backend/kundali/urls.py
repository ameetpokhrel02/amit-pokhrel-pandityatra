from django.urls import path
from . import views
from .views import generate_kundali

urlpatterns = [
    path('generate/', generate_kundali),
    path('list/', views.list_kundalis),
    path('public-stats/', views.public_kundali_stats),
]
