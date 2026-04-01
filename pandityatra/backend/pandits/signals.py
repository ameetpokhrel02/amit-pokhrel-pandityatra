from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import PanditUser, PanditWallet

@receiver(post_save, sender=PanditUser)
def create_wallet(sender, instance, created, **kwargs):
    if created:
        PanditWallet.objects.create(pandit=instance)
    else:
        # Ensure wallet exists for existing pandits (self-healing)
        if not hasattr(instance, 'wallet'):
            PanditWallet.objects.create(pandit=instance)
