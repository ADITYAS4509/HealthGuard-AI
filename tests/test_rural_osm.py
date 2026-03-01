import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'src')))

from utils.hospital_finder import find_nearby_hospitals

# Deep rural village in India coordinates (e.g., Mawlynnong, Meghalaya)
lat = 25.2014
lon = 91.9157

print("Testing Rural OSM Hospital Discovery Pipeline")
print(f"Coordinates: {lat}, {lon}")
print("Fetching...")

hospitals = find_nearby_hospitals(city="Mawlynnong", lat=lat, lon=lon)

print(f"\nFound {len(hospitals)} hospitals/clinics.")
if len(hospitals) == 0:
    print("FAILED: Did not find any facilities.")
else:
    for i, h in enumerate(hospitals):
        emergency_tag = " [🚨 NEAREST EMERGENCY]" if h.get("is_nearest_emergency") else ""
        print(f"{i+1}. {h['name']} - {h['distance_km']} km - Source: {h.get('source')} - Emergency: {h.get('emergency')} {emergency_tag}")

print("\nDone.")
