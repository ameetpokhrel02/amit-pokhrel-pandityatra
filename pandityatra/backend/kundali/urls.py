from django.urls import path
from . import views
from .views import generate_kundali

urlpatterns = [
    path('generate/', generate_kundali),
    # Add paths here when views are ready, e.g.:
    # path('', views.KundaliListView.as_view(), name='kundali-list'),
]
