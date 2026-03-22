"""
Django settings for pandityatra_backend project.
"""
import os
import dj_database_url
from pathlib import Path
from datetime import timedelta 
from urllib.parse import urlparse
from dotenv import load_dotenv

# Load environment variables from .env file
# Explicitly look for .env in the parent directory (project root)
dotenv_path = os.path.join(Path(__file__).resolve().parent.parent.parent, '.env')
load_dotenv(dotenv_path)

# Backwards compatibility: try default load if specific path fails or not found
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


def env_bool(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(default)).lower() in ('true', '1', 'yes', 'on')


def env_list(name: str, default: str = ''):
    raw = os.getenv(name, default)
    return [item.strip() for item in raw.split(',') if item.strip()]


# Quick-start development settings - unsuitable for production
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-43jvp0e$qvj%e8m&l#3@@s_pc%apgv%xg!o@_pqx&=v2&c8b@z')
DEBUG = env_bool('DEBUG', False)

# Host allowlist for local web + Expo/mobile development.
# Use ALLOWED_HOSTS in .env to override.
default_allowed_hosts = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    'host.docker.internal',
    '.local',
    '.exp.direct',
    '.expo.dev',
    '.ngrok-free.app',
]

raw_allowed_hosts = env_list('ALLOWED_HOSTS', ','.join(default_allowed_hosts))
ALLOWED_HOSTS = [host.strip().strip('"').strip("'") for host in raw_allowed_hosts if host.strip().strip('"').strip("'")]

# Accept wildcard even when env is set like ALLOWED_HOSTS="*"
if '*' in ALLOWED_HOSTS:
    ALLOWED_HOSTS = ['*']

# In debug, fallback to wildcard to avoid DisallowedHost during mobile LAN/tunnel testing.
if DEBUG and not ALLOWED_HOSTS:
    ALLOWED_HOSTS = ['*']


# Application definition
INSTALLED_APPS = [
    'daphne',  # Django Channels ASGI server (must be first)
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'channels',  # Django Channels for WebSocket support
    
    # Required for API and JWT
    'rest_framework',
    'rest_framework_simplejwt', 
    'channels_redis',  # Redis backend for Channels
    
    # Admin Enhancements
    'adminpanel',
    # Core Application Modules
    'users',
    'pandits',
    'services',
    'bookings',
    'payments',
    'chat',  # Real-time chat
    'reviews',  # Reviews and ratings
    'notifications',  # Push notifications
    
    # Sprint 3 Modules: AI Pandit & Samagri
    'recommender',
    'samagri',
    'kundali',
    'video',  # Video call integration
    'ai',  # AI Pandit module
    'panchang', # Nepali Panchang & Calendar
    'drf_spectacular',  # API documentation with OpenAPI/Swagger
]

# Django Channels Configuration
ASGI_APPLICATION = 'pandityatra_backend.asgi.application'

redis_url = os.getenv('REDIS_URL', 'redis://redis:6379/0')
parsed_redis = urlparse(redis_url)
redis_host = parsed_redis.hostname or 'redis'
redis_port = parsed_redis.port or 6379

# Channel Layers - Redis for WebSocket backend
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [(redis_host, redis_port)],
        },
    },
}

# For local development without Docker, use in-memory channel layer:
# CHANNEL_LAYERS = {
#     "default": {
#         "BACKEND": "channels.layers.InMemoryChannelLayer"
#     }
# }

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'pandityatra_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True, 
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'pandityatra_backend.wsgi.application'


# Database
# Uses DATABASE_URL environment variable provided by Docker Compose.
# Falls back to SQLite if running locally without the environment variable.
DATABASES = {
    'default': dj_database_url.config(
        default=f'sqlite:///{os.path.join(BASE_DIR, "db.sqlite3")}', 
        conn_max_age=600,
        conn_health_checks=True
    )
}


# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization & Localization
LANGUAGE_CODE = 'en-us'

# Support for English, Nepali and Hindi
LANGUAGES = [
    ('en', 'English'),
    ('ne', 'Nepali (नेपाली)'),
    ('hi', 'Hindi (हिन्दी)'),
]

LOCALE_PATHS = [
    os.path.join(BASE_DIR, 'locale'),
]

# Nepal timezone
TIME_ZONE = 'Asia/Kathmandu'  # Nepal Standard Time (NST) UTC+5:45

USE_I18N = True  # Enable internationalization
USE_L10N = True  # Enable localization
USE_TZ = True  # Use timezone-aware datetimes

# Date/Time formats for Nepal
DATE_FORMAT = 'Y-m-d'
DATETIME_FORMAT = 'Y-m-d H:i:s'
SHORT_DATE_FORMAT = 'Y-m-d'


# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'static'),
]

# Media files (User uploaded content like Samagri images)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
SERVE_MEDIA_FILES = env_bool('SERVE_MEDIA_FILES', DEBUG)

# Ensure MIME types are correct for SVG
import mimetypes
mimetypes.add_type("image/svg+xml", ".svg", True)
mimetypes.add_type("image/svg+xml", ".svgz", True)

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
AUTH_USER_MODEL = 'users.User'

# Swagger / OpenAPI Settings
# Note:
# - Using the existing frontend public asset for branding so we don't need to add a new backend static file.
# - If you later move the logo into backend staticfiles, you can replace the logo URL with '/static/logo.png'.
SPECTACULAR_SETTINGS = {
    'TITLE': 'PanditYatra API',
    'DESCRIPTION': 'AI-Powered Pandit Booking, Puja, Samagri, Chat, Video & Kundali platform API.',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'SCHEMA_PATH_PREFIX': '/api',
    'COMPONENT_SPLIT_REQUEST': True,
    'SWAGGER_UI_SETTINGS': {
        'deepLinking': True,
        'displayRequestDuration': True,
        'persistAuthorization': True,
        'filter': True,
        'tryItOutEnabled': True,
        'docExpansion': 'list',
        'defaultModelsExpandDepth': 1,
        'defaultModelExpandDepth': 1,
        'logoUrl': f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/images/AAApandityatra.png",
    },
    'SWAGGER_UI_FAVICON_HREF': f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/images/AAApandityatra.png",
}

# Django REST Framework Settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.BasicAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',

    ),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}


# Simple JWT Configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=5),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
}

# Email Configuration (Gmail SMTP)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
# Get credentials from environment variables for security
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', 'pandityatra9@gmail.com')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '') # App Password needed here
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

# CORS Configuration
CORS_ALLOW_ALL_ORIGINS = env_bool('CORS_ALLOW_ALL_ORIGINS', False)
CORS_ALLOWED_ORIGINS = env_list('CORS_ALLOWED_ORIGINS', os.getenv('FRONTEND_URL', 'http://localhost:5173'))
CSRF_TRUSTED_ORIGINS = env_list('CSRF_TRUSTED_ORIGINS', f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')},http://localhost:8000")

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = env_bool('SESSION_COOKIE_SECURE', not DEBUG)
CSRF_COOKIE_SECURE = env_bool('CSRF_COOKIE_SECURE', not DEBUG)
SECURE_SSL_REDIRECT = env_bool('SECURE_SSL_REDIRECT', False)

# Payment Gateway Configuration
# Stripe (for international payments)
STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY', '')
STRIPE_PUBLISHABLE_KEY = os.environ.get('STRIPE_PUBLISHABLE_KEY', '')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', '')

# Khalti (for NPR payments)
KHALTI_SECRET_KEY = os.environ.get('KHALTI_SECRET_KEY', '')
KHALTI_PUBLIC_KEY = os.environ.get('KHALTI_PUBLIC_KEY', '')
KHALTI_API_URL = os.environ.get('KHALTI_API_URL', 'https://khalti.com/api/v2')

# eSewa (for NPR payments - Nepal's Leading Digital Wallet)
ESEWA_SECRET_KEY = os.environ.get('ESEWA_SECRET_KEY', '8gBm/:&EnhH.1/q')  # Test secret key
ESEWA_PRODUCT_CODE = os.environ.get('ESEWA_PRODUCT_CODE', 'EPAYTEST')  # Test product code
ESEWA_TEST_MODE = os.environ.get('ESEWA_TEST_MODE', 'True').lower() in ('true', '1', 'yes', 'on')
ESEWA_SANDBOX_API_URL = os.environ.get('ESEWA_SANDBOX_API_URL', 'https://rc-epay.esewa.com.np')
ESEWA_API_URL = os.environ.get('ESEWA_API_URL', 'https://epay.esewa.com.np')

# Daily.co (for video calls)
DAILY_API_KEY = os.environ.get('DAILY_API_KEY', '')
DAILY_ENABLE_RECORDING = os.environ.get('DAILY_ENABLE_RECORDING', 'False').lower() in ('true', '1', 'yes', 'on')

# WebRTC TURN/STUN (Coturn)
TURN_ENABLED = os.environ.get('TURN_ENABLED', 'False').lower() in ('true', '1', 'yes', 'on')
TURN_HOST = os.environ.get('TURN_HOST', 'localhost')
TURN_PUBLIC_HOST = os.environ.get('TURN_PUBLIC_HOST', TURN_HOST)
TURN_PORT = int(os.environ.get('TURN_PORT', '3478'))
TURN_TLS_PORT = int(os.environ.get('TURN_TLS_PORT', '5349'))
TURN_USERNAME = os.environ.get('TURN_USERNAME', '')
TURN_PASSWORD = os.environ.get('TURN_PASSWORD', '')
TURN_REALM = os.environ.get('TURN_REALM', 'pandityatra.local')
TURN_TRANSPORTS = [
    t.strip().lower()
    for t in os.environ.get('TURN_TRANSPORTS', 'udp,tcp').split(',')
    if t.strip().lower() in {'udp', 'tcp'}
]
# Full TURN URL if provided (e.g. from Metered.ca)
TURN_SERVER_URL = os.environ.get('TURN_SERVER_URL', '')
# Comma-separated list of STUN urls, fallback keeps free public STUN for bootstrap.
STUN_URLS = [
    s.strip() for s in os.environ.get('STUN_URLS', 'stun:stun.l.google.com:19302').split(',') if s.strip()
]

# Web Push (VAPID)
VAPID_PUBLIC_KEY = os.environ.get('VAPID_PUBLIC_KEY', '')
VAPID_PRIVATE_KEY = os.environ.get('VAPID_PRIVATE_KEY', '')
VAPID_ADMIN_EMAIL = os.environ.get('VAPID_ADMIN_EMAIL', 'mailto:admin@pandityatra.com')

# Frontend URL (for payment redirects)
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

# AI Configuration
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY', '')
GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '')

