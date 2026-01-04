"""
Management command to seed initial samagri recommendations.
Run with: python manage.py seed_recommendations
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from services.models import Puja
from samagri.models import SamagriItem, SamagriCategory
from recommender.models import SamagriRecommendation


class Command(BaseCommand):
    help = 'Seed initial samagri recommendations for pujas'

    def handle(self, *args, **options):
        self.stdout.write('Starting samagri recommendations seeding...')
        
        try:
            with transaction.atomic():
                # Get some sample pujas and samagri items
                pujas = Puja.objects.all()[:5]  # Get first 5 pujas
                samagri_items = SamagriItem.objects.all()[:10]  # Get first 10 items
                
                if not pujas or not samagri_items:
                    self.stdout.write(self.style.WARNING('No pujas or samagri items found. Please create them first.'))
                    return
                
                recommendations_created = 0
                
                # Create recommendations for each puja-item combination
                for puja in pujas:
                    for idx, item in enumerate(samagri_items):
                        # Check if recommendation already exists
                        exists = SamagriRecommendation.objects.filter(
                            puja=puja,
                            samagri_item=item
                        ).exists()
                        
                        if not exists:
                            # Create recommendation with reasonable defaults
                            # First items are essential, rest are optional
                            is_essential = idx < 3
                            confidence = 0.95 if is_essential else (0.7 - idx * 0.05)
                            confidence = max(0.3, min(1.0, confidence))  # Clamp between 0.3-1.0
                            
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
                    self.style.SUCCESS(
                        f'✓ Successfully created {recommendations_created} samagri recommendations'
                    )
                )
                
                # Print summary
                total_recommendations = SamagriRecommendation.objects.count()
                self.stdout.write(f'Total recommendations in database: {total_recommendations}')
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Error seeding recommendations: {str(e)}'))
            raise
