from django.urls import path
from . import views

urlpatterns = [
    path("guide/", views.ai_guide),
]
