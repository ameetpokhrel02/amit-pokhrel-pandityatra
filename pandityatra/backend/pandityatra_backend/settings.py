"""
Django settings for pandityatra_backend project.
"""
import os
import dj_database_url
from pathlib import Path
from datetime import timedelta 
from dotenv import load_dotenv

# Load environment variables from .env file
# Explicitly look for .env in the parent directory (project root)
dotenv_path = os.path.join(Path(__file__).resolve().parent.parent.parent, '.env')
load_dotenv(dotenv_path)

# Backwards compatibility: try default load if specific path fails or not found
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-43jvp0e$qvj%e8m&l#3@@s_pc%apgv%xg!o@_pqx&=v2&c8b@z')
DEBUG = os.getenv('DEBUG', 'True').lower() in ('true', '1', 'yes', 'on')
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '*').split(',')


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
]

# Django Channels Configuration
ASGI_APPLICATION = 'pandityatra_backend.asgi.application'

# Channel Layers - Redis for WebSocket backend
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('redis', 6379)],  # Use 'localhost' for local dev, 'redis' for Docker
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

# Support for English and Nepali
LANGUAGES = [
    ('en', 'English'),
    ('ne', 'Nepali (नेपाली)'),
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

# Ensure MIME types are correct for SVG
import mimetypes
mimetypes.add_type("image/svg+xml", ".svg", True)
mimetypes.add_type("image/svg+xml", ".svgz", True)

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
AUTH_USER_MODEL = 'users.User'

# Django REST Framework Settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',
    ),
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
CORS_ALLOW_ALL_ORIGINS = True

# Payment Gateway Configuration
# Stripe (for international payments)
STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY', '')
STRIPE_PUBLISHABLE_KEY = os.environ.get('STRIPE_PUBLISHABLE_KEY', '')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', '')

# Khalti (for NPR payments)
KHALTI_SECRET_KEY = os.environ.get('KHALTI_SECRET_KEY', '')
KHALTI_PUBLIC_KEY = os.environ.get('KHALTI_PUBLIC_KEY', '')
KHALTI_API_URL = os.environ.get('KHALTI_API_URL', 'https://khalti.com/api/v2')

# Daily.co (for video calls)
DAILY_API_KEY = os.environ.get('DAILY_API_KEY', '')

# Frontend URL (for payment redirects)
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

# AI Configuration
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY', '')
GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '')
