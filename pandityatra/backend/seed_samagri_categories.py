import os
import django

# Set DJANGO_SETTINGS_MODULE
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pandityatra_backend.settings')
django.setup()

from samagri.models import SamagriCategory

# First, deactivate or remove old categories to satisfy "ONLY THIS"
SamagriCategory.objects.all().update(is_active=False)

categories = [
    {
        "name": "Agarbatti",
        "slug": "agarbatti",
        "description": "Premium incense sticks, cones, and dhoop for a soothing atmosphere.",
        "icon": "Wind",
        "order": 1,
        "is_active": True
    },
    {
        "name": "Attar",
        "slug": "attar",
        "description": "Exquisite floral and traditional fragrances for rituals.",
        "icon": "Droplets",
        "order": 2,
        "is_active": True
    },
    {
        "name": "Books",
        "slug": "books",
        "description": "Vedic scriptures, puja vidhi, and spiritual literature.",
        "icon": "Book",
        "order": 3,
        "is_active": True
    },
    {
        "name": "Brass Murti",
        "slug": "brass-murti",
        "description": "Beautifully crafted deity idols in brass and copper.",
        "icon": "Gem",
        "order": 4,
        "is_active": True
    }
]

for cat_data in categories:
    cat, created = SamagriCategory.objects.update_or_create(
        slug=cat_data['slug'],
        defaults=cat_data
    )
    if created:
        print(f"Created samagri category: {cat.name}")
    else:
        print(f"Updated samagri category: {cat.name}")

# Optional: Verify cleanup
active_count = SamagriCategory.objects.filter(is_active=True).count()
print(f"Active categories in DB: {active_count}")
