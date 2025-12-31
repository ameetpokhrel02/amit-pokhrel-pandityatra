# In backend/pandits/urls.py

from django.urls import path
from .views import (
    PanditListCreateView, PanditDetailView, 
    RegisterPanditView, list_pending_pandits, verify_pandit, reject_pandit
)
# 🚨 ENSURE THIS IMPORT IS CORRECT AND COMPLETE 🚨
from services.views import PanditPujaListView, PanditPujaDetailView 

urlpatterns = [
    # Pandit Registration & Verification
    path('register/', RegisterPanditView.as_view(), name='pandit-register'),
    path('pending/', list_pending_pandits, name='list-pending-pandits'),
    path('<int:pandit_id>/verify/', verify_pandit, name='verify-pandit'),
    path('<int:pandit_id>/reject/', reject_pandit, name='reject-pandit'),
    
    # Pandit Profile CRUD
    path('', PanditListCreateView.as_view(), name='pandit-list-create'),
    path('<int:pk>/', PanditDetailView.as_view(), name='pandit-detail'),
    
    # Nested Services: List & Create
    path('<int:pandit_pk>/services/', PanditPujaListView.as_view(), name='pandit-services-list'),
    
    # Nested Services: Retrieve, Update, Destroy
    # 🚨 CONFIRM THIS PATH IS PRESENT AND CORRECT 🚨
    path('<int:pandit_pk>/services/<int:pk>/', PanditPujaDetailView.as_view(), name='pandit-services-detail'),
]