from .models import Kundali, KundaliPlanet, KundaliHouse
from .services.astro import calculate_chart, get_nakshatra
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_kundali(request):
    user = request.user
    dob = request.data["dob"]
    time = request.data["time"]
    lat = float(request.data["latitude"])
    lon = float(request.data["longitude"])
    tz = request.data["timezone"]

    kundali = Kundali.objects.create(
        user=user,
        dob=dob,
        time=time,
        latitude=lat,
        longitude=lon,
        timezone=tz,
    )

    planets, cusps, ascmc = calculate_chart(dob, time, lat, lon)

    kundali.lagna = ascmc[0]     # Ascendant
    kundali.midheaven = ascmc[1]
    kundali.save()

    for planet, lon in planets.items():
        KundaliPlanet.objects.create(
            kundali=kundali,
            planet=planet,
            longitude=data["longitude"],
            rashi=data["rashi"],
            nakshatra=data["nakshatra"],
            house=data["house"],    
        )

    for i in range(12):
        KundaliHouse.objects.create(
            kundali=kundali,
            house=i+1,
            cusp=cusps[i]
        )

    return Response({
        "kundali_id": kundali.id,
        "lagna": kundali.lagna,
        "houses": cusps.tolist()
    })