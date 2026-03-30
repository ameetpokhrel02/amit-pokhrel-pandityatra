import os
import django

# Set settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pandityatra_backend.settings')
django.setup()

from samagri.models import SamagriItem, SamagriCategory

print("Seeding Sacred Books...")

# Ensure category exists
cat, created = SamagriCategory.objects.get_or_create(
    name='Book', 
    defaults={'description': 'Sacred books and scriptures', 'slug': 'books-sacred'}
)

books_data = [
    {'name': 'The Bhagavad Gita', 'description': 'The timeless wisdom of Lord Krishna.', 'price': 450, 'stock_quantity': 50},
    {'name': 'Ramayana', 'description': 'The epic journey of Lord Rama.', 'price': 1200, 'stock_quantity': 30},
    {'name': 'Mahabharata', 'description': 'The longest epic poem ever written.', 'price': 1500, 'stock_quantity': 20}
]

for b in books_data:
    item, created = SamagriItem.objects.get_or_create(
        name=b['name'], 
        category=cat, 
        defaults={
            'description': b['description'], 
            'price': b['price'], 
            'stock_quantity': b['stock_quantity'],
            'is_approved': True
        }
    )
    print(f'Book {b["name"]} created: {created}')

print("Sacred Books seeding complete.")