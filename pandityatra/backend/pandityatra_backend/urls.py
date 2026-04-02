"""
URL configuration for pandityatra_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth.decorators import login_required, user_passes_test
from django.views.static import serve
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

# JWT Imports
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView
)

urlpatterns = [
    path('api/reviews/', include('reviews.urls')), # Reviews and ratings
    path('admin/', admin.site.urls),
    path("api/admin/", include("adminpanel.urls")),


    # JWT Endpoints 
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    path('api/vendors/', include('vendors.urls')), # Vendor endpoints
    path('api/users/', include('users.urls')), 
    path('api/pandits/', include('pandits.urls')),
    path('api/services/', include('services.urls')),
    path('api/recommender/', include('recommender.urls')),
    path('api/samagri/', include('samagri.urls')),
    path('api/kundali/', include('kundali.urls')),
    path('api/chat/', include('chat.urls')),  # Chat endpoints
    path('api/ai/', include('ai.urls')),  # AI Gateway endpoints
    path('api/payments/', include('payments.urls')),  # Payment endpoints
    path('api/banners/', include('banners.urls')), # Banner endpoints

    # Video call endpoints
    path('api/video/', include('video.urls')),

    # Panchang endpoints
    path('api/panchang/', include('panchang.urls')),

    # Notifications endpoints
    path('api/notifications/', include('notifications.urls')),

    # Bug Reports
    path('api/bug-reports/', include('bug_reports.urls')),

    # Bookings (Generic api/ must be last)
    path('api/', include('bookings.urls')),

    # API Documentation (admin-only)
    path(
        'api/schema/',
        login_required(
            user_passes_test(
                lambda user: user.is_active and user.is_staff,
                login_url='/admin/login/',
            )(SpectacularAPIView.as_view()),
            login_url='/admin/login/',
        ),
        name='schema',
    ),
    path(
        'api/docs/',
        login_required(
            user_passes_test(
                lambda user: user.is_active and user.is_staff,
                login_url='/admin/login/',
            )(SpectacularSwaggerView.as_view(url_name='schema')),
            login_url='/admin/login/',
        ),
        name='swagger-ui',
    ),
    path(
        'api/redoc/',
        login_required(
            user_passes_test(
                lambda user: user.is_active and user.is_staff,
                login_url='/admin/login/',
            )(SpectacularRedocView.as_view(url_name='schema')),
            login_url='/admin/login/',
        ),
        name='redoc',
    ),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if getattr(settings, 'SERVE_MEDIA_FILES', False):
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
    ]
