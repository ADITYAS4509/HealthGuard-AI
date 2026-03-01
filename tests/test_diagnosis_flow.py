import requests
import json

def test_diagnosis(symptoms, label):
    print(f"\n--- Testing: {label} ---")
    print(f"Symptoms: {symptoms}")
    try:
        response = requests.post(
            "http://127.0.0.1:8000/analyze",
            json={
                "symptoms": symptoms,
                "age": 45,
                "severity": 8,
                "duration": 1,
                "city": "Mumbai"
            },
            timeout=15
        )
        if response.status_code == 200:
            data = response.json()
            print(f"Primary: {data.get('condition')} ({data.get('confidence')*100}%)")
            print(f"Top 3 Conditions: {data.get('conditions')}")
            print(f"Risk: {data.get('risk')}")
            print(f"Source: {data.get('debug', {}).get('api')}")
            print(f"Fallback: {data.get('fallback')}")
        else:
            print(f"Error {response.status_code}: {response.text}")
    except Exception as e:
        print(f"Failed: {e}")

# Test Cases
test_diagnosis(["chest_pain", "shortness_of_breath"], "Critical Cardiac Case")
test_diagnosis(["fever", "cough", "fatigue"], "Standard Viral Case")
test_diagnosis(["nausea", "vomiting", "diarrhea"], "Gastro Case")
test_diagnosis(["joint_pain", "muscle_ache", "fever"], "Dengue/Viral Case")
