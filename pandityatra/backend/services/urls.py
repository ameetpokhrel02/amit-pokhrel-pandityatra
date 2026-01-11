from django.urls import path
from .views import PujaListCreateView, PujaDetailView, AIChatView

urlpatterns = [
    # PanditYatra AI
    path('ai-guide/', AIChatView.as_view(), name='ai-guide'),
    # Maps to /api/services/ (List & Create)
    path('', PujaListCreateView.as_view(), name='puja-list-create'),
    # Maps to /api/services/{id}/ (Retrieve, Update, Destroy)
    path('<int:pk>/', PujaDetailView.as_view(), name='puja-detail'),
]