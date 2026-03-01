import os
import requests
from dotenv import load_dotenv

# Try to load keys from brevo.env
env_path = r'c:\Users\adity\Downloads\AI-Powered Healthcare\brevo.env'
load_dotenv(env_path)

key = os.getenv("RAPIDAPI_KEY")
host = os.getenv("RAPIDAPI_HOST")

print(f"Key: {key[:5]}...{key[-5:] if key else 'None'}")
print(f"Host: {host}")

url = "https://ai-medical-diagnosis.p.rapidapi.com/analyze"

payload = {
    "symptoms": ["fever", "cough", "fatigue"],
    "age": 30,
    "gender": "male"
}

headers = {
    "content-type": "application/json",
    "X-RapidAPI-Key": key,
    "X-RapidAPI-Host": host
}

try:
    print("Testing RapidAPI call...")
    response = requests.post(url, json=payload, headers=headers, timeout=10)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
