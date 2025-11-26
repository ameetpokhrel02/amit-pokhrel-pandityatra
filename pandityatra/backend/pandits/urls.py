# In backend/pandits/urls.py

from django.urls import path
from .views import PanditListCreateView, PanditDetailView
# 🚨 ENSURE THIS IMPORT IS CORRECT AND COMPLETE 🚨
from services.views import PanditPujaListView, PanditPujaDetailView 

urlpatterns = [
    # Pandit Profile CRUD
    path('', PanditListCreateView.as_view(), name='pandit-list-create'),
    path('<int:pk>/', PanditDetailView.as_view(), name='pandit-detail'),
    
    # Nested Services: List & Create
    path('<int:pandit_pk>/services/', PanditPujaListView.as_view(), name='pandit-services-list'),
    
    # Nested Services: Retrieve, Update, Destroy
    # 🚨 CONFIRM THIS PATH IS PRESENT AND CORRECT 🚨
    path('<int:pandit_pk>/services/<int:pk>/', PanditPujaDetailView.as_view(), name='pandit-services-detail'),
]