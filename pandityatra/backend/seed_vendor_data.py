from samagri.models import SamagriItem

cat, created = SamagriCategory.objects.get_or_create(
    name='Book', 
    defaults={'description': 'Sacred books and scriptures'}
)

item, created = SamagriItem.objects.get_or_create(
    name='Book', 
    category=cat, 
    defaults={'description': 'Sacred books and scriptures'}
)

for i in range(10):
    item, created = SamagriItem.objects.get_or_create(
        name=f'Book {i}', 
        category=cat, 
        defaults={'description': 'Sacred books and scriptures'}
    )
    print(f'Book {i} created status: {created}')

for i in range(10):
    item, created = SamagriItem.objects.get_or_create(
        name=f'Item {i}', 
        category=cat, 
        defaults={'description': 'Sacred books and scriptures'}
    )
    print(f'Item {i} created status: {created}')