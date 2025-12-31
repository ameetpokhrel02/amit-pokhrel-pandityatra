"""
ASGI config for pandityatra_backend project.

Supports both HTTP and WebSocket protocols via Django Channels.
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator
from chat import routing as chat_routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pandityatra_backend.settings')

# Initialize Django ASGI application early to populate Django apps
django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(
                chat_routing.websocket_urlpatterns
            )
        )
    ),
})
