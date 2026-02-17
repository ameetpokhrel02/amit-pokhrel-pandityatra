from django.urls import path
from .views import PanchangView

urlpatterns = [
    path('data/', PanchangView.as_view(), name='panchang-data'),
]
