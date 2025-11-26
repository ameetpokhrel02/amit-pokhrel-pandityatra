# In backend/pandits/urls.py

from django.urls import path
from .views import PanditListCreateView, PanditDetailView
# 🚨 THIS IS THE CRITICAL MISSING IMPORT 🚨
from services.views import PanditPujaListView 
# ...

urlpatterns = [
    # General Pandit endpoints
    path('', PanditListCreateView.as_view(), name='pandit-list-create'),
    path('<int:pk>/', PanditDetailView.as_view(), name='pandit-detail'),
    
    # 🚨 ADD THIS LINE FOR NESTED SERVICES
    # Maps to /api/pandits/{pandit_pk}/services/
    path('<int:pandit_pk>/services/', PanditPujaListView.as_view(), name='pandit-services-list'),
]