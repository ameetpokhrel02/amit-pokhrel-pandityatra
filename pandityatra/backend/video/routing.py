from django.urls import re_path

from .consumers import VideoSignalingConsumer

websocket_urlpatterns = [
    re_path(r"ws/video/(?P<room_id>[\w-]+)/$", VideoSignalingConsumer.as_asgi()),
]
