import sys
import os
import json

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'src')))

from utils.hospital_finder import find_nearby_hospitals

test_locations = [
    {"name": "Mawlynnong, Meghalaya (Deep Rural)", "lat": 25.2014, "lon": 91.9157},
    {"name": "Ziro, Arunachal Pradesh (Non-metro, Hilly)", "lat": 27.5501, "lon": 93.8193},
    {"name": "Anantapur, Andhra Pradesh (Small Town)", "lat": 14.6819, "lon": 77.6006}
]

print("--- VERIFYING HOSPITAL DISCOVERY ---")

for loc in test_locations:
    print(f"\nLocation: {loc['name']} ({loc['lat']}, {loc['lon']})")
    
    # Simulate both Critical and Low risk to prove no filtering happens
    for risk in ["Low", "Critical"]:
        print(f"  Risk Level: {risk}")
        
        # We need to bypass the in-memory cache we built for the test to truly run
        if hasattr(find_nearby_hospitals, "cache"):
            find_nearby_hospitals.cache = {}
            
        hospitals = find_nearby_hospitals(city=loc['name'].split(',')[0], risk_level=risk, lat=loc['lat'], lon=loc['lon'])
        
        print(f"    Found {len(hospitals)} facilities.")
        
        fallback_count = sum(1 for h in hospitals if h.get("source") == "district_fallback")
        normal_count = len(hospitals) - fallback_count
        
        print(f"    - From Radius: {normal_count}")
        print(f"    - From District Fallback: {fallback_count}")
        
        has_buttons = all('nav_link' in h and 'phone' in h for h in hospitals)
        print(f"    - Buttons valid (Call/Nav): {has_buttons}")
        
        nearest_emergencies = [h for h in hospitals if h.get("is_nearest_emergency")]
        print(f"    - Nearest Emergency Flagged: {len(nearest_emergencies) > 0}")
        if nearest_emergencies:
            print(f"      -> {nearest_emergencies[0]['name']}")

print("\n--- DONE ---")
