from django.urls import path
from . import views

urlpatterns = [
    path("guide/", views.ai_guide),
    path("chat/", views.AIChatView.as_view()),
]
