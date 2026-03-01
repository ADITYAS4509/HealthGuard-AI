import requests
import json
import time

url = "http://127.0.0.1:8000/analyze"

def test_endpoint(payload, name):
    print(f"--- Running Test: {name} ---")
    try:
        response = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=10)
        print(f"Status Code: {response.status_code}")
        print("Response:", json.dumps(response.json(), indent=2))
        print("--- PASS ---\n")
    except Exception as e:
        print(f"--- FAIL: {e} ---\n")

print("Starting verification tests...")
time.sleep(1)

test_endpoint({}, "Empty Payload")
test_endpoint({"symptoms": None, "age": "five", "lat": "bad"}, "Garbage Types Payload")
test_endpoint({"symptoms": ["chest pain", "severe bleeding"], "age": 45, "lat": 28.6139, "lon": 77.2090}, "Critical Symptoms (GPS)")
test_endpoint({"symptoms": ["mild headache"], "age": 25, "city": "Mumbai"}, "Low Symptoms (City)")

print("Tests completed.")
