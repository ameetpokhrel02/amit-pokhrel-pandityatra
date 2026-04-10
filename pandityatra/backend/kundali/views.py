from .models import Kundali, KundaliPlanet, KundaliHouse
from .services.astro import calculate_chart, get_nakshatra, get_rashi, get_house_from_longitude
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from kundali.services.ai import get_ai_prediction, get_expert_ai_prediction
from django.db.models import Avg, Count
from django.conf import settings
from reviews.models import SiteReview, Review
from drf_spectacular.utils import extend_schema


@extend_schema(summary="Generate Kundali Chart")
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_kundali(request):
    user = request.user

    dob = request.data["dob"]
    time = request.data["time"]
    lat = float(request.data["latitude"])
    lon = float(request.data["longitude"])
    tz = request.data.get("timezone", "Asia/Kathmandu")
    place = request.data.get("place", "")

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
        place=place,
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
    for planet, pdata in planets.items():
        KundaliPlanet.objects.create(
            kundali=kundali,
            planet=planet,
            longitude=pdata["longitude"],
            rashi=get_rashi(pdata["longitude"]),
            nakshatra=get_nakshatra(pdata["longitude"]),
            house=pdata["house"]
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


@extend_schema(summary="List User Kundalis")
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_kundalis(request):
    user = request.user
    kundalis = Kundali.objects.filter(user=user).prefetch_related('planets').order_by('-created_at')
    
    data = []
    for k in kundalis:
        data.append({
            "id": k.id,
            "dob": k.dob,
            "time": k.time,
            "latitude": k.latitude,
            "longitude": k.longitude,
            "place": k.place or f"{k.latitude}, {k.longitude}",
            "created_at": k.created_at,
            "ai_prediction": k.ai_prediction if hasattr(k, 'ai_prediction') else None,
            "planets": [
                {
                    "planet": p.planet,
                    "longitude": p.longitude,
                    "rashi": p.rashi,
                    "nakshatra": p.nakshatra,
                    "house": p.house
                } for p in k.planets.all()
            ]
        })
    
    return Response(data)


@api_view(["GET"])
@permission_classes([AllowAny])
def public_kundali_stats(request):
    """Public landing stats for Kundali section."""
    total_kundalis = Kundali.objects.count()

    site_rating_stats = SiteReview.objects.filter(is_approved=True).aggregate(
        avg_rating=Avg('rating'),
        total_reviews=Count('id'),
    )
    pandit_rating_stats = Review.objects.aggregate(
        avg_rating=Avg('rating'),
        total_reviews=Count('id'),
    )

    site_total = site_rating_stats['total_reviews'] or 0
    pandit_total = pandit_rating_stats['total_reviews'] or 0
    combined_total = site_total + pandit_total

    combined_sum = (
        float(site_rating_stats['avg_rating'] or 0) * site_total
        + float(pandit_rating_stats['avg_rating'] or 0) * pandit_total
    )
    combined_avg = (combined_sum / combined_total) if combined_total else 0

    return Response({
        "total_kundalis": total_kundalis,
        "average_rating": round(combined_avg, 1),
        "total_reviews": combined_total,
        "languages_supported": len(getattr(settings, 'LANGUAGES', [])),
    })


@extend_schema(summary="Get Expert AI Kundali Prediction")
@api_view(["POST"])
@permission_classes([AllowAny]) # Allow guests to get predictions for offline charts
def predict_kundali_ai(request):
    """
    Expert AI interpretation for birth charts.
    Accepts raw data (useful for offline charts).
    """
    data = request.data
    history = data.get('messages', [])
    prediction = get_expert_ai_prediction(data, history=history)
    
    return Response({
        "ai_prediction": prediction
    })