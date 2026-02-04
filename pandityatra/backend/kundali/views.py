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
    # Robustly parse time (handle AM/PM and other formats)
    from django.utils.dateparse import parse_time
    import re

    # Try standard parse first
    parsed_time = parse_time(time)
    
    if not parsed_time:
        # Try handling 9:15:AM or 9:15 AM
        match = re.search(r'(\d{1,2}):(\d{2})(?::(\d{2}))?\s?([AP]M)', time, re.I)
        if match:
            h, m, s, meridian = match.groups()
            h, m = int(h), int(m)
            s = int(s) if s else 0
            if meridian.upper() == 'PM' and h < 12: h += 12
            if meridian.upper() == 'AM' and h == 12: h = 0
            from datetime import time as dt_time
            parsed_time = dt_time(h, m, s)
    
    if not parsed_time:
        # Fallback/Error if parsing still fails
        return Response({"detail": f"Invalid time format: {time}. Expected HH:MM or HH:MM AM/PM."}, status=400)

    kundali = Kundali.objects.create(
        user=user,
        dob=dob,
        time=parsed_time,
        latitude=lat,
        longitude=lon,
        timezone=tz,
    )

    # Swiss Ephemeris
    # Convert time object back to string for calculate_chart if it expects string
    time_str = parsed_time.strftime("%H:%M")
    planets, cusps, ascmc = calculate_chart(dob, time_str, lat, lon)

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
        "ai_prediction": prediction,
        "planets": [
            {
                "planet": p.planet,
                "longitude": p.longitude,
                "rashi": p.rashi,
                "nakshatra": p.nakshatra,
                "house": p.house
            } for p in kundali.planets.all()
        ],
        "houses": [
            {
                "house_number": h.house_number,
                "cusp_longitude": h.cusp_longitude
            } for h in kundali.houses.all()
        ]
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_kundalis(request):
    user = request.user
    kundalis = Kundali.objects.filter(user=user).order_by('-created_at')
    
    data = []
    for k in kundalis:
        data.append({
            "id": k.id,
            "dob": k.dob,
            "time": k.time,
            "place": f"{k.latitude}, {k.longitude}", # You might want to store place name in model later
            "created_at": k.created_at
        })
    
    return Response(data)