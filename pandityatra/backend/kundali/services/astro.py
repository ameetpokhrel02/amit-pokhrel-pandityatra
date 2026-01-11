import swisseph as swe
from datetime import datetime

PLANETS = {
    "Sun": swe.SUN,
    "Moon": swe.MOON,
    "Mars": swe.MARS,
    "Mercury": swe.MERCURY,
    "Jupiter": swe.JUPITER,
    "Venus": swe.VENUS,
    "Saturn": swe.SATURN,
}

NAKSHATRAS = [
    "Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra",
    "Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni",
    "Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha",
    "Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta","Shatabhisha",
    "Purva Bhadrapada","Uttara Bhadrapada","Revati"
]

# -------------------------
# Helpers
# -------------------------

def get_rashi(lon):
    return int(lon // 30)

def get_nakshatra(lon):
    return NAKSHATRAS[int(lon // (13.333333))]

def get_house_from_longitude(planet_lon, cusps):
    """
    Returns which of 12 houses a planet belongs to.
    """
    for i in range(12):
        start = cusps[i]
        end = cusps[(i + 1) % 12]

        # Normal case
        if start <= end:
            if start <= planet_lon < end:
                return i + 1
        else:
            # Wrap around Pisces → Aries
            if planet_lon >= start or planet_lon < end:
                return i + 1

    return 12

# -------------------------
# Main Chart Calculator
# -------------------------

def calculate_chart(dob, time, lat, lon):
    # Convert to Julian Day
    dt = datetime.strptime(f"{dob} {time}", "%Y-%m-%d %H:%M")
    jd = swe.julday(dt.year, dt.month, dt.day, dt.hour + dt.minute / 60)

    swe.set_topo(lon, lat, 0)

    # House cusps + Ascendant
    cusps, ascmc = swe.houses(jd, lat, lon)

    planet_data = {}

    for name, pid in PLANETS.items():
        pl_lon = swe.calc_ut(jd, pid)[0][0]

        planet_data[name] = {
            "longitude": pl_lon,
            "rashi": get_rashi(pl_lon),
            "nakshatra": get_nakshatra(pl_lon),
            "house": get_house_from_longitude(pl_lon, cusps),
        }


    return planet_data, cusps, ascmc
