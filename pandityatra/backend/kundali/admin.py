from django.contrib import admin
from .models import Kundali, KundaliPlanet, KundaliHouse

class KundaliPlanetInline(admin.TabularInline):
    model = KundaliPlanet
    extra = 0

class KundaliHouseInline(admin.TabularInline):
    model = KundaliHouse
    extra = 0

@admin.register(Kundali)
class KundaliAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'dob', 'time', 'place_name', 'created_at')
    list_filter = ('created_at', 'dob')
    search_fields = ('user__username', 'place_name')
    inlines = [KundaliPlanetInline, KundaliHouseInline]

    def place_name(self, obj):
        return f"{obj.latitude}, {obj.longitude}"

admin.site.register(KundaliPlanet)
admin.site.register(KundaliHouse)
