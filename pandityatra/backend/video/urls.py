from django.urls import path
from . import views

urlpatterns = [
    path("room/<int:booking_id>/", views.get_video_room),
    path("room/<int:booking_id>/join/", views.join_room),
]