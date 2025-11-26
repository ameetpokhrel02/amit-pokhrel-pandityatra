from django.urls import path
# 🚨 CORRECTED IMPORT: Add PujaDetailView
from .views import PujaListCreateView, PujaDetailView 

urlpatterns = [
    # Maps to /api/services/ (List & Create)
    path('', PujaListCreateView.as_view(), name='puja-list-create'),

    # 🚨 ADDED DETAIL PATH: Maps to /api/services/{id}/ (Retrieve, Update, Destroy)
    path('<int:pk>/', PujaDetailView.as_view(), name='puja-detail'),
]