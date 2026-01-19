from django.contrib import admin
from .models import SamagriCategory, SamagriItem, PujaSamagriRequirement

@admin.register(SamagriCategory)
class SamagriCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'id')
    search_fields = ('name',)

class LowStockFilter(admin.SimpleListFilter):
    title = 'Stock Status'
    parameter_name = 'stock_status'

    def lookups(self, request, model_admin):
        return (
            ('low', 'Low Stock (< 10)'),
            ('out', 'Out of Stock (0)'),
        )

    def queryset(self, request, queryset):
        if self.value() == 'low':
            return queryset.filter(stock_quantity__lt=10, stock_quantity__gt=0)
        if self.value() == 'out':
            return queryset.filter(stock_quantity=0)
        return queryset

@admin.register(SamagriItem)
class SamagriItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'stock_quantity', 'stock_status')
    list_filter = (LowStockFilter, 'category')
    search_fields = ('name',)
    list_editable = ('price', 'stock_quantity')

    def stock_status(self, obj):
        if obj.stock_quantity == 0:
            return "❌ Out of Stock"
        elif obj.stock_quantity < 10:
            return "⚠️ Low Stock"
        return "✅ OK"
    stock_status.short_description = "Status"

@admin.register(PujaSamagriRequirement)
class PujaSamagriRequirementAdmin(admin.ModelAdmin):
    list_display = ('puja', 'samagri_item', 'quantity', 'unit')
    list_filter = ('puja',)
    autocomplete_fields = ('samagri_item',)
