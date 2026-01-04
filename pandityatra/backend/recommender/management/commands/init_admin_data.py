"""
Management command to initialize admin user and sample data.
Run with: python manage.py init_admin_data
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth import get_user_model

from pandits.models import Pandit
from services.models import Puja
from samagri.models import SamagriCategory, SamagriItem, PujaSamagriRequirement
from recommender.models import SamagriRecommendation

User = get_user_model()


class Command(BaseCommand):
    help = 'Initialize admin user and sample data for testing'

    def handle(self, *args, **options):
        self.stdout.write('Starting initialization...')
        
        try:
            with transaction.atomic():
                # Create admin user if doesn't exist
                if not User.objects.filter(username='admin').exists():
                    admin = User.objects.create_superuser(
                        username='admin',
                        email='admin@pandityatra.com',
                        password='admin123',
                        full_name='Admin User',
                        phone_number='+9779841234567',
                        role='admin'
                    )
                    self.stdout.write(self.style.SUCCESS('✓ Admin user created'))
                else:
                    self.stdout.write('✓ Admin user already exists')
                
                # Create test pandit if doesn't exist
                if not User.objects.filter(username='ramesh').exists():
                    pandit_user = User.objects.create_user(
                        username='ramesh',
                        email='ramesh@pandityatra.com',
                        password='ramesh123',
                        full_name='Ramesh Pandit',
                        phone_number='+9779841234568',
                        role='pandit'
                    )
                    pandit = Pandit.objects.create(
                        user=pandit_user,
                        expertise='Vedic Rituals',
                        language='Hindi',
                        experience_years=15,
                        rating=4.8,
                        bio='Experienced Vedic pandit with 15 years of service',
                        is_available=True,
                        is_verified=True,
                        verification_status='APPROVED'
                    )
                    self.stdout.write(self.style.SUCCESS('✓ Test pandit created'))
                else:
                    self.stdout.write('✓ Test pandit already exists')
                
                # Create sample samagri categories
                categories_data = [
                    ('Flowers', 'Flowers and garlands'),
                    ('Incense', 'Incense and fragrances'),
                    ('Oils', 'Sacred oils'),
                    ('Grains', 'Rice, wheat, and grains'),
                    ('Dry Fruits', 'Almonds, cashews, etc.'),
                ]
                
                for name, desc in categories_data:
                    if not SamagriCategory.objects.filter(name=name).exists():
                        SamagriCategory.objects.create(name=name, description=desc)
                        self.stdout.write(f'✓ Created category: {name}')
                    else:
                        self.stdout.write(f'✓ Category exists: {name}')
                
                # Create sample samagri items
                items_data = [
                    ('Ghee (1L)', 'Clarified butter', 800.00, 'Oils'),
                    ('Flower Mix', 'Mixed flowers for puja', 500.00, 'Flowers'),
                    ('Incense Sticks', 'Fragrant incense', 300.00, 'Incense'),
                    ('Rice (1kg)', 'Sacred rice', 250.00, 'Grains'),
                    ('Almonds', 'Premium almonds', 600.00, 'Dry Fruits'),
                    ('Sandalwood', 'Sandalwood powder', 400.00, 'Incense'),
                    ('Marigold Garland', 'Yellow marigold', 200.00, 'Flowers'),
                    ('Coconut', 'Fresh coconut', 150.00, 'Grains'),
                ]
                
                for name, desc, price, category_name in items_data:
                    if not SamagriItem.objects.filter(name=name).exists():
                        category = SamagriCategory.objects.get(name=category_name)
                        SamagriItem.objects.create(
                            name=name,
                            description=desc,
                            category=category,
                            price=price
                        )
                        self.stdout.write(f'✓ Created item: {name}')
                    else:
                        self.stdout.write(f'✓ Item exists: {name}')
                
                # Create sample pujas
                pandit_obj = Pandit.objects.filter(user__username='ramesh').first()
                if not pandit_obj:
                    pandit_obj = Pandit.objects.first()
                
                if pandit_obj:
                    pujas_data = [
                        ('Havan', 'Fire ritual for blessings', 5000.00),
                        ('Aarti', 'Traditional prayer ceremony', 2000.00),
                        ('Puja Abhishek', 'Sacred bath ritual', 3000.00),
                        ('Annaprasana', 'First feeding ceremony', 4000.00),
                        ('Navratra Puja', 'Nine-day festival puja', 6000.00),
                    ]
                    
                    for name, desc, price in pujas_data:
                        if not Puja.objects.filter(name=name).exists():
                            Puja.objects.create(
                                pandit=pandit_obj,
                                name=name,
                                description=desc,
                                duration_minutes=60,
                                price=price,
                                is_available=True
                            )
                            self.stdout.write(f'✓ Created puja: {name}')
                        else:
                            self.stdout.write(f'✓ Puja exists: {name}')
                
                # Create recommendations
                pujas = Puja.objects.all()
                samagri_items = SamagriItem.objects.all()
                
                recommendations_created = 0
                for puja in pujas:
                    for idx, item in enumerate(samagri_items[:5]):  # First 5 items per puja
                        if not SamagriRecommendation.objects.filter(
                            puja=puja,
                            samagri_item=item
                        ).exists():
                            is_essential = idx < 2
                            confidence = 0.95 if is_essential else 0.70
                            
                            SamagriRecommendation.objects.create(
                                puja=puja,
                                samagri_item=item,
                                confidence_score=confidence,
                                is_essential=is_essential,
                                is_optional=not is_essential,
                                priority=idx + 1,
                                category='ESSENTIAL' if is_essential else 'TRADITIONAL',
                                quantity_min=1,
                                quantity_max=5,
                                quantity_default=1,
                                unit='pcs',
                                reason=f'Recommended for {puja.name}',
                                is_active=True
                            )
                            recommendations_created += 1
                
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created {recommendations_created} recommendations')
                )
                
                # Summary
                self.stdout.write(self.style.SUCCESS(
                    f'\n✅ INITIALIZATION COMPLETE\n'
                    f'- Admin user: admin / admin123\n'
                    f'- Test pandit: ramesh / ramesh123\n'
                    f'- Samagri categories: {SamagriCategory.objects.count()}\n'
                    f'- Samagri items: {SamagriItem.objects.count()}\n'
                    f'- Pujas: {Puja.objects.count()}\n'
                    f'- Recommendations: {SamagriRecommendation.objects.count()}\n'
                    f'- Access admin at: http://localhost:8000/admin/'
                ))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Error: {str(e)}'))
            raise
