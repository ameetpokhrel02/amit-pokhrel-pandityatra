from django.urls import path
from .views import PujaListCreateView, PujaDetailView, PujaCategoryListView

urlpatterns = [
    # Maps to /api/services/categories/
    path('categories/', PujaCategoryListView.as_view(), name='puja-category-list'),
    # Maps to /api/services/ (List & Create)
    path('', PujaListCreateView.as_view(), name='puja-list-create'),
    # Maps to /api/services/{id}/ (Retrieve, Update, Destroy)
    path('<int:pk>/', PujaDetailView.as_view(), name='puja-detail'),
]