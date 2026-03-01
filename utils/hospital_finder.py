import requests
import math

def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0 # Earth radius in kilometers
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dLon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def get_coords_from_city(city_str):
    """Fallback to OpenStreetMap Nominatim if GPS fails."""
    try:
        url = "https://nominatim.openstreetmap.org/search"
        params = {"q": city_str, "format": "json", "limit": 1}
        headers = {"User-Agent": "AIHealthGuard/1.0"}
        resp = requests.get(url, params=params, headers=headers, timeout=5)
        if resp.ok and len(resp.json()) > 0:
            data = resp.json()[0]
            return float(data["lat"]), float(data["lon"])
    except Exception:
        pass
    return None, None

def find_nearby_hospitals(city="", risk_level="Low", lat=None, lon=None):
    """
    Find nearby hospitals using OpenStreetMap Overpass API.
    Expands radius from 10km -> 25km -> 50km.
    Falls back to district search if results < 2.
    """
    import time
    if lat is None or lon is None:
        if city:
            c_lat, c_lon = get_coords_from_city(city)
            if c_lat and c_lon:
                lat, lon = c_lat, c_lon
            else:
                return [] # City not found or API failed
        else:
            return []

    # Check Cache First
    if not hasattr(find_nearby_hospitals, "cache"):
        find_nearby_hospitals.cache = {}
    
    cache_key = f"{round(lat, 2)}_{round(lon, 2)}"
    now = time.time()
    
    if cache_key in find_nearby_hospitals.cache:
        cached_entry = find_nearby_hospitals.cache[cache_key]
        if now - cached_entry["timestamp"] < 600: # 10 minutes cache
            print("Serving hospitals from cache.")
            return cached_entry["data"]

    elements = []
    source = "osm_radius"
    overpass_url = "http://overpass-api.de/api/interpreter"
    
    # 1. Radius Expansion Logic
    radiuses = [10000, 25000, 50000] # 10km, 25km, 50km
    for r in radiuses:
        query = f"""
        [out:json][timeout:15];
        (
          node["amenity"="hospital"](around:{r},{lat},{lon});
          way["amenity"="hospital"](around:{r},{lat},{lon});
          relation["amenity"="hospital"](around:{r},{lat},{lon});
          
          node["amenity"="clinic"](around:{r},{lat},{lon});
          way["amenity"="clinic"](around:{r},{lat},{lon});
          relation["amenity"="clinic"](around:{r},{lat},{lon});
          
          node["amenity"="doctors"](around:{r},{lat},{lon});
          way["amenity"="doctors"](around:{r},{lat},{lon});
          relation["amenity"="doctors"](around:{r},{lat},{lon});
          
          node["healthcare"](around:{r},{lat},{lon});
          way["healthcare"](around:{r},{lat},{lon});
          relation["healthcare"](around:{r},{lat},{lon});
        );
        out center;
        """
        try:
            resp = requests.post(overpass_url, data={'data': query}, timeout=15)
            resp.raise_for_status()
            elements = resp.json().get("elements", [])
            if len(elements) >= 3:
                break
        except Exception as e:
            print(f"OSM Overpass query failed for radius {r}: {e}")
            
    # 2. District Fallback Logic
    if len(elements) < 2:
        print("Triggering district fallback...")
        try:
            # Reverse geocode to get district
            url = "https://nominatim.openstreetmap.org/reverse"
            params = {"lat": lat, "lon": lon, "format": "json", "zoom": 10}
            headers = {"User-Agent": "AIHealthGuard/1.0"}
            resp = requests.get(url, params=params, headers=headers, timeout=5)
            
            if resp.ok:
                data = resp.json()
                address = data.get("address", {})
                
                # Determine district name realistically
                district = address.get("state_district") or address.get("county") or address.get("city")
                state = address.get("state")
                
                if district and state:
                    # Clean up district name (Nominatim sometimes appends 'District')
                    district_clean = district.replace(" District", "")
                    
                    # Query Overpass by area
                    query = f"""
                    [out:json][timeout:25];
                    area["name"="{state}"]->.state;
                    area["name"="{district_clean}"]->.district;
                    (
                      node["amenity"="hospital"](area.state)(area.district);
                      way["amenity"="hospital"](area.state)(area.district);
                      node["amenity"="clinic"](area.state)(area.district);
                      way["amenity"="clinic"](area.state)(area.district);
                      node["healthcare"="hospital"](area.state)(area.district);
                      node["healthcare"="clinic"](area.state)(area.district);
                    );
                    out center;
                    """
                    
                    resp = requests.post(overpass_url, data={'data': query}, timeout=25)
                    resp.raise_for_status()
                    district_elements = resp.json().get("elements", [])
                    if district_elements:
                        elements.extend(district_elements)
                        source = "district_fallback"
        except Exception as e:
            print(f"District fallback failed: {e}")

    # 3. Format and process
    hospitals = []
    seen_names = set()
    
    for el in elements:
        tags = el.get("tags", {})
        name = tags.get("name")
        if not name:
            # Skip unnamed amenities unless they are clearly emergency
            if tags.get("emergency") == "yes":
                name = "Emergency Facility"
            else:
                continue
                
        # Deduplicate by name roughly
        if name in seen_names:
            continue
        seen_names.add(name)
        
        is_emergency = tags.get("emergency") == "yes"
        phone = tags.get("phone", tags.get("contact:phone", "N/A"))
        
        h_lat = el.get("lat") or (el.get("center", {}).get("lat"))
        h_lon = el.get("lon") or (el.get("center", {}).get("lon"))
        
        if h_lat is None or h_lon is None:
            continue
            
        distance = round(haversine(lat, lon, h_lat, h_lon), 1)
        nav_link = f"https://www.google.com/maps/dir/?api=1&destination={h_lat},{h_lon}"
        
        hospitals.append({
            "name": name,
            "distance_km": distance,
            "emergency": is_emergency,
            "phone": phone,
            "nav_link": nav_link,
            "source": source
        })
    
    # 4. Sort strictly by distance
    hospitals.sort(key=lambda x: x["distance_km"])
    
    # We'll limit to 10 for UI tidiness
    final_list = hospitals[:10]
    
    # Identify the absolute nearest emergency facility to tag it explicitly
    nearest_emergency = None
    for h in final_list:
        if h["emergency"] or "hospital" in h["name"].lower():
            nearest_emergency = h
            break
            
    # If we have a nearest emergency, explicitly mark it for the UI
    if nearest_emergency:
        nearest_emergency["is_nearest_emergency"] = True
        
    # Update Cache
    find_nearby_hospitals.cache[cache_key] = {
        "timestamp": now,
        "data": final_list
    }
        
    return final_list