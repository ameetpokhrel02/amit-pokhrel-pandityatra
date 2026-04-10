"""
JWT Authentication Middleware for Django Channels WebSocket
"""
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from urllib.parse import parse_qs


@database_sync_to_async
def get_user(token_key):
    """Get user from JWT token"""
    try:
        from users.models import User
        access_token = AccessToken(token_key)
        user_id = access_token['user_id']
        return User.objects.get(id=user_id)
    except (InvalidToken, TokenError) as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"WebSocket Auth Failure: JWT Token Invalid/Expired. Error: {str(e)}")
        return AnonymousUser()
    except (User.DoesNotExist, KeyError) as e:
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Custom middleware that takes JWT token from query string and authenticates the user.
    Usage: ws://localhost:8000/ws/chat/1/?token=<jwt_token>
    """
    
    async def __call__(self, scope, receive, send):
        # Get token from query string
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]
        
        if token:
            scope['user'] = await get_user(token)
        else:
            scope['user'] = AnonymousUser()
        
        return await super().__call__(scope, receive, send)
