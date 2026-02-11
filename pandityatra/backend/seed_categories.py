import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pandityatra_backend.settings')
django.setup()

from services.models import PujaCategory

categories = [
    {
        "name": "Daily Rituals",
        "slug": "daily-rituals",
        "description": "Pujas for daily spiritual well-being.",
        "icon": "Sun",
        "order": 1
    },
    {
        "name": "Sanskaras",
        "slug": "sanskaras",
        "description": "Rites of passage from birth to marriage.",
        "icon": "Users",
        "order": 2
    },
    {
        "name": "Festival Pujas",
        "slug": "festival-pujas",
        "description": "Special pujas for major Hindu festivals.",
        "icon": "Calendar",
        "order": 3
    },
    {
        "name": "Havan & Yagya",
        "slug": "havan-yagya",
        "description": "Sacred fire rituals for purification.",
        "icon": "Flame",
        "order": 4
    },
    {
        "name": "Ancestral Rites",
        "slug": "ancestral-rites",
        "description": "Pujas for honoring ancestors (Pitru Dosha).",
        "icon": "History",
        "order": 5
    },
    {
        "name": "Graha Shanthi",
        "slug": "graha-shanthi",
        "description": "Planetary pacification rituals.",
        "icon": "Moon",
        "order": 6
    }
]

for cat_data in categories:
    cat, created = PujaCategory.objects.get_or_create(
        slug=cat_data['slug'],
        defaults=cat_data
    )
    if created:
        print(f"Created category: {cat.name}")
    else:
        print(f"Category already exists: {cat.name}")
