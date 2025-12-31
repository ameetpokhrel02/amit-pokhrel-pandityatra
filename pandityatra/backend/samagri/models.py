from django.db import models

class SamagriCategory(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class SamagriItem(models.Model):
    category = models.ForeignKey(SamagriCategory, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return self.name

class PujaSamagriRequirement(models.Model):
    # Foreign keys 'puja' would typically link to a Service/Puja model. 
    # For now, we will assume a generic relation or just define the fields minimally to satisfy the error.
    # Note: The view references 'puja' in select_related. We need to check if 'services.Puja' exists.
    # Assuming 'services' app has a 'Puja' model based on common structure, but let's check first.
    # To be safe and simple for now, we'll implement the basic structure.
    
    # We need to import the Puja model if it exists, or just use a string reference 'services.Puja'
    puja = models.ForeignKey('services.Puja', on_delete=models.CASCADE, related_name='requirements')
    samagri_item = models.ForeignKey(SamagriItem, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    unit = models.CharField(max_length=50, default="pcs") # e.g. kg, grams, pcs

    def __str__(self):
        return f"{self.quantity} {self.unit} of {self.samagri_item.name}"
