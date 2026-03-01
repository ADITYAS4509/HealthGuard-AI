import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = "https://raw.githubusercontent.com/nshntarora/Indian-Cities-JSON/master/cities.json"

req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req, context=ctx) as response:
        data = json.loads(response.read().decode())
        indian_cities = []
        for city in data:
            name = city.get('name')
            state = city.get('state')
            if name and state:
                indian_cities.append(f"{name}, {state}")
        
        # Manually add missing towns and specific region focus
        essential_towns = [
            "Chikodi, Karnataka", "Athani, Karnataka", "Nipani, Karnataka", "Gokak, Karnataka",
            "Hubballi, Karnataka", "Dharwad, Karnataka", "Bidar, Karnataka", "Ballari, Karnataka", "Kalaburagi, Karnataka"
        ]
        indian_cities.extend(essential_towns)
        indian_cities = list(set(indian_cities))
        indian_cities.sort()
        
        js_content = f"// Automatically generated comprehensive Indian cities database for autocomplete\nconst INDIAN_CITIES = {json.dumps(indian_cities)};\n"
        
        with open("site/public/assets/js/cities.js", "w", encoding="utf-8") as f:
            f.write(js_content)
            
        print(f"Generated {len(indian_cities)} cities.")
except Exception as e:
    print(f"Error fetching data: {e}")
