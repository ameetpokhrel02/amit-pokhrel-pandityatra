from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Pandit, PanditWallet

@receiver(post_save, sender=Pandit)
def create_wallet(sender, instance, created, **kwargs):
    if created:
        PanditWallet.objects.create(pandit=instance)
    else:
        # Ensure wallet exists for existing pandits (self-healing)
        if not hasattr(instance, 'wallet'):
            PanditWallet.objects.create(pandit=instance)
