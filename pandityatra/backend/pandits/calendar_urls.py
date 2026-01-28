# Backend Calendar URLs for PanditYatra
# This file contains the URL patterns for pandit calendar API endpoints

from django.urls import path
from . import calendar_views

urlpatterns = [
    # Calendar Events
    path('calendar/events/', calendar_views.pandit_calendar_events, name='pandit_calendar_events'),
    path('calendar/block-time/', calendar_views.block_time_slot, name='block_time_slot'),
    
    # Dashboard
    path('dashboard/stats/', calendar_views.pandit_dashboard_stats, name='pandit_dashboard_stats'),
    path('dashboard/today-schedule/', calendar_views.today_schedule, name='today_schedule'),
    path('dashboard/toggle-availability/', calendar_views.toggle_availability, name='toggle_availability'),
]

# Add these URLs to your main pandits/urls.py file:
# 
# from django.urls import path, include
# from . import calendar_urls
# 
# urlpatterns = [
#     # ... existing patterns
#     path('', include(calendar_urls)),
# ]