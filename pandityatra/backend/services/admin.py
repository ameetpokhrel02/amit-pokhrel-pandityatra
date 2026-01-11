from django.contrib import admin
from .models import Puja

@admin.register(Puja)
class PujaAdmin(admin.ModelAdmin):
    list_display = ('name', 'base_price', 'base_duration_minutes', 'is_available')
    search_fields = ('name', 'description')
