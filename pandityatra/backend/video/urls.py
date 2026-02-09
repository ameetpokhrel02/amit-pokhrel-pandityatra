from django.urls import path
from . import views

urlpatterns = [
    path("room/<int:booking_id>/", views.get_video_room),
    path("create-token/", views.create_video_token),
    path("generate-link/<int:booking_id>/", views.generate_video_link),
    path("webhook/", views.daily_webhook),
    path("room/<int:booking_id>/join/", views.join_room),
]