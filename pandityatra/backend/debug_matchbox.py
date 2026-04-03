from samagri.models import SamagriItem
items = SamagriItem.objects.all()
for i in items:
    if "Match Box" in i.name:
        print(f"ID: {i.id}, Name: {i.name}, is_active: {i.is_active}, is_approved: {i.is_approved}, vendor: {i.vendor.shop_name if i.vendor else 'None'}")
