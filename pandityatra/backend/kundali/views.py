from .models import Kundali, KundaliPlanet, KundaliHouse
from .services.astro import calculate_chart, get_nakshatra, get_rashi, get_house_from_longitude
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from kundali.services.ai import get_ai_prediction


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_kundali(request):
    user = request.user

    dob = request.data["dob"]
    time = request.data["time"]
    lat = float(request.data["latitude"])
    lon = float(request.data["longitude"])
    tz = request.data["timezone"]

    # Create Kundali
    kundali = Kundali.objects.create(
        user=user,
        dob=dob,
        time=time,
        latitude=lat,
        longitude=lon,
        timezone=tz,
    )

    # Swiss Ephemeris
    planets, cusps, ascmc = calculate_chart(dob, time, lat, lon)

    kundali.lagna = ascmc[0]
    kundali.midheaven = ascmc[1]
    kundali.save()

    # Save Houses
    for i in range(12):
        KundaliHouse.objects.create(
            kundali=kundali,
            house_number=i + 1,
            cusp_longitude=cusps[i]
        )

    # Save Planets
    for planet, longitude in planets.items():
        rashi = get_rashi(longitude)
        nakshatra = get_nakshatra(longitude)
        house = get_house_from_longitude(longitude, cusps)

        KundaliPlanet.objects.create(
            kundali=kundali,
            planet=planet,
            longitude=longitude,
            rashi=rashi,
            nakshatra=nakshatra,
            house=house
        )

    # AI prediction
    prediction = get_ai_prediction(kundali)
    kundali.ai_prediction = prediction
    kundali.save()

    return Response({
        "kundali_id": kundali.id,
        "lagna": kundali.lagna,
        "midheaven": kundali.midheaven,
        "ai_prediction": prediction
    })