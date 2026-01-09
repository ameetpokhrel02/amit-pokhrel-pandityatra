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

def get_rashi(lon):
    return int(lon // 30)

def get_nakshatra(lon):
    return NAKSHATRAS[int(lon // (13.333333))]

def calculate_planets(dob, time, lat, lon):
    dt = datetime.strptime(f"{dob} {time}", "%Y-%m-%d %H:%M")
    jd = swe.julday(dt.year, dt.month, dt.day, dt.hour + dt.minute / 60)

    swe.set_topo(lon, lat, 0)

    data = {}

    for name, pid in PLANETS.items():
        lon = swe.calc_ut(jd, pid)[0][0]
        data[name] = {
            "longitude": lon,
            "rashi": get_rashi(lon),
            "nakshatra": get_nakshatra(lon),
            "house": 1,  # placeholder (we'll add houses next)
        }

    return data

def calculate_houses(jd, lat, lon):
    cusps = swe.houses(jd, lat, lon)
    return cusps, ascmc

def find_house(planet_lon, cusps):
    for i in range(12):
        start = cusps[i]
        end = cusps[(i + 1) % 12]

        #Handle zodiac wrap-around (pisces to aries)
        if start < end:
            if start <= planet_lon < end:
                return i + 1
            
        else:  # wrap around case
            if planet_lon >= start or planet_lon < end:
                return i + 1
    return 12

def calculate_chart(dob, time, lat, lon):
    dt = datetime.strptime(f"{dob} {time}", "%Y-%m-%d %H:%M")
    jd =swe.julday(dt.year, dt.month, dt.day, dt.hour + dt.minute / 60 )

    swe.set_topo(lon, lat, 0)

    planets ={}
    for name, pid in PLANETS.items():
         planeet_lon = swe.calc_ut(jd, pid)[0][0]
         planets[name] = planeet_lon

    cusps, ascmc = swe.houses(jd, lat, lon)

    planet_data = {}
    for name, lon in planets.items():
        planet_data[name] = {
            "longitude": lon,
            "rashi": get_rashi(lon // 30),
            "nakshatra": get_nakshatra(lon),
            "house": find_house(lon, cusps),
        }

    return planet_data, cusps, ascmc
