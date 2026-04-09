import os
import django
from django.urls import reverse

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pandityatra_backend.settings')
django.setup()

names = ['admin-dashboard', 'admin-vendor-pending', 'admin-pandit-pending', 'vendor-profile-stats', 'pandit-dashboard-stats']

for name in names:
    try:
        url = reverse(name)
        print(f"{name} -> {url}")
    except Exception as e:
        print(f"{name} -> ERROR: {e}")
