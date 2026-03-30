import os
import django

# Set settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pandityatra_backend.settings')
django.setup()

from samagri.models import SamagriItem, SamagriCategory

print("Seeding Samagri Items...")

# Ensure category exists
cat, created = SamagriCategory.objects.get_or_create(
    name='Book', 
    defaults={'description': 'Sacred books and scriptures', 'slug': 'book'}
)

# Seed books
for i in range(10):
    item, created = SamagriItem.objects.get_or_create(
        name=f'Sacred Book {i}', 
        category=cat, 
        defaults={
            'description': f'Description for Sacred Book {i}',
            'price': 100 + i,
            'stock_quantity': 50,
            'is_approved': True
        }
    )
    print(f'Book {i} created: {created}')

# Seed generic items
for i in range(10):
    item, created = SamagriItem.objects.get_or_create(
        name=f'Ritual Item {i}', 
        category=cat, 
        defaults={
            'description': f'Description for Ritual Item {i}',
            'price': 50 + i,
            'stock_quantity': 100,
            'is_approved': True
        }
    )
    print(f'Item {i} created: {created}')

print("Samagri seeding complete.")