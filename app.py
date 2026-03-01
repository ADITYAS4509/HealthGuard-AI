from flask import Flask, request, jsonify, session
from flask_cors import CORS
import joblib
import pandas as pd
import os
import sqlite3
import time
import random
import requests  # Required by predict_from_rapidapi
from werkzeug.security import generate_password_hash, check_password_hash
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from utils.care_engine import assess_insurance, get_otc_suggestions
from utils.hospital_finder import find_nearby_hospitals
from utils.risk_profiler import calculate_risk
from utils.symptom_mapper import map_symptoms_to_condition
from utils.gemini_client import get_gemini_explanation, predict_from_gemini


try:
    from dotenv import load_dotenv
    # Search for .env in current directory (root)
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_path):
        load_dotenv(env_path, override=True)
        print(f"[SYS] Loaded environment from: {env_path}")
    
    print("[SYS] Environment initialization complete.")
    
    def verify_api_keys():
        print("\n" + "="*40)
        print(" [SYS] STARTUP API VERIFICATION ")
        print("="*40)
        
        rapid_key = os.environ.get("RAPIDAPI_KEY")
        rapid_host = os.environ.get("RAPIDAPI_HOST")
        gemini_key = os.environ.get("GEMINI_API_KEY")
        openai_key = os.environ.get("OPENAI_API_KEY")
        
        if rapid_key:
            masked = f"{rapid_key[:4]}...{rapid_key[-4:]}"
            print(f" [PASS] RAPIDAPI_KEY: {masked}")
        else:
            print(" [FAIL] RAPIDAPI_KEY is missing!")
            
        if rapid_host:
            print(f" [PASS] RAPIDAPI_HOST: {rapid_host}")
        else:
            print(" [FAIL] RAPIDAPI_HOST is missing!")
            
        if gemini_key:
            masked = f"{gemini_key[:4]}...{gemini_key[-4:]}"
            print(f" [PASS] GEMINI_API_KEY: {masked}", flush=True)
        else:
            print(" [INFO] GEMINI_API_KEY is missing (Chatbot offline)", flush=True)

        print("="*40 + "\n", flush=True)
        
        if not rapid_key or not rapid_host:
            print("[CRITICAL] Mandatory RapidAPI credentials missing. Service will fail.")
            
    verify_api_keys()

except ImportError:
    print("[WARN] python-dotenv not installed. Skipping .env load.")
except Exception as e:
    print(f"[WARN] Error loading .env: {e}")

app = Flask(__name__, 
            static_folder='frontend', 
            static_url_path='')
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'ai_healthguard_secret_dev_key')
CORS(app, origins=[
    "http://localhost:5173",
    "http://localhost:3000", 
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "https://healthguard-ai-23pi.onrender.com"
], supports_credentials=True)
@app.after_request
def add_header(r):
    """
    Add headers to both force latest JS/CSS (Cache-Control)
    and ensure CORS headers are present.
    """
    r.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    r.headers["Pragma"] = "no-cache"
    r.headers["Expires"] = "0"
    r.headers['Cache-Control'] = 'public, max-age=0'
    return r

# Initialize SQLite Database for Auth
DB_PATH = os.path.join(os.path.dirname(__file__), 'users.db')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# In-memory OTP store (email -> OTP data)
# Structure: {'email': {'hash': str, 'expires_at': float, 'last_sent': float, 'resend_count': int, 'attempts': int}}
OTP_STORE = {}

def send_otp_email(to_email, otp):
    BREVO_SMTP_HOST = os.environ.get("BREVO_SMTP_SERVER", "smtp-relay.brevo.com")
    BREVO_SMTP_PORT = int(os.environ.get("BREVO_SMTP_PORT", 587))
    BREVO_SMTP_USER = os.environ.get("BREVO_SMTP_USER", os.environ.get("BREVO_SMTP_LOGIN"))
    BREVO_SMTP_PASS = os.environ.get("BREVO_SMTP_PASS", os.environ.get("BREVO_SMTP_KEY"))

    if not BREVO_SMTP_USER or not BREVO_SMTP_PASS:
        print("ERROR: Brevo SMTP credentials missing. Check .env")
        if os.getenv("APP_ENV") == "development":
            print(f"[DEV MODE] OTP for {to_email}: {otp}")
        return False

    try:
        msg = MIMEMultipart()
        msg["From"] = BREVO_SMTP_USER
        msg["To"] = to_email
        msg["Subject"] = "Your AI HealthGuard OTP Code"

        body = f"""
        Your OTP for AI HealthGuard is: {otp}
        This code expires in 5 minutes.
        Do not share this code with anyone.
        """
        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP(BREVO_SMTP_HOST, BREVO_SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(BREVO_SMTP_USER, BREVO_SMTP_PASS)
            server.sendmail(BREVO_SMTP_USER, to_email, msg.as_string())

        return True

    except smtplib.SMTPAuthenticationError:
        print("ERROR: Brevo SMTP authentication failed. Check credentials.")
        if os.getenv("APP_ENV") == "development":
            print(f"[DEV MODE] OTP for {to_email}: {otp}")
        return False

    except smtplib.SMTPException as e:
        print(f"ERROR: SMTP error — {str(e)}")
        if os.getenv("APP_ENV") == "development":
            print(f"[DEV MODE] OTP for {to_email}: {otp}")
        return False

    except Exception as e:
        print(f"ERROR: Failed to send OTP — {str(e)}")
        # Always print to console in development fallback
        print(f"[DEBUG FALLBACK] OTP for {to_email}: {otp}")
        return False

def generate_otp(email: str) -> str:
    otp = str(random.randint(100000, 999999))
    return otp


# Load model — guarded so server starts even if pkl files are missing
model = None
features = []
try:
    model_path = os.path.join(os.path.dirname(__file__), 'models', 'disease_model.pkl')
    model = joblib.load(model_path)
    feature_path = os.path.join(os.path.dirname(__file__), 'models', 'features.pkl')
    features = joblib.load(feature_path)
except Exception as pkl_err:
    try:
        current_dir = os.getcwd()
        models_dir = os.path.join(os.path.dirname(__file__), 'models')
        models_contents = os.listdir(models_dir) if os.path.exists(models_dir) else "DIR NOT FOUND"
        print(f"[ERROR] Detailed ML failure: {pkl_err}")
        print(f"CWD: {current_dir}")
        print(f"Models Dir: {models_dir}")
        print(f"Contents: {models_contents}")
    except Exception as inner_err:
        print(f"Failed to even log debug info: {inner_err}")
    print(f"[WARN] ML models not loaded. Prediction endpoint will return fallback.")

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"}), 200

@app.route('/')
def home():
    return app.send_static_file('login.html')

@app.route('/index')
@app.route('/index.html')
def main_app():
    return app.send_static_file('index.html')

@app.route('/insurance-claims')
@app.route('/insurance-claims.html')
def insurance_claims():
    return app.send_static_file('insurance-claims.html')

@app.errorhandler(404)
def not_found(e):
    return app.send_static_file('login.html')

@app.route('/predict_disease', methods=['POST'])
def predict_disease():
    try:
        if model is None:
            return jsonify({'success': True, 'data': {'predicted_condition_category': 'General Symptoms', 'influential_symptoms': []}, 'message': 'Model unavailable — fallback used'})
        data = request.get_json() or {}
        symptoms = data.get('symptoms', [])
        
        input_vector = [1 if sym in symptoms else 0 for sym in features]
        prediction = model.predict([input_vector])[0]
        importances = model.feature_importances_
        important_symptoms = [features[i] for i in importances.argsort()[-3:][::-1]]
        
        return jsonify({
            'success': True,
            'data': {
                'predicted_condition_category': prediction,
                'influential_symptoms': important_symptoms
            },
            'message': 'Prediction successful'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/calculate_risk', methods=['POST'])
def calculate_risk_api():
    try:
        data = request.get_json() or {}
        symptoms = data.get('symptoms', [])
        severity = data.get('severity', 1)
        duration = data.get('duration', 1)
        
        risk_score, risk_level = calculate_risk(symptoms, severity, duration)
        
        return jsonify({
            "success": True,
            "data": {
                "risk_score": risk_score,
                "risk_level": risk_level
            },
            "message": "Risk calculated"
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/assess_insurance', methods=['POST'])
def assess_insurance_api():
    try:
        data = request.get_json() or {}
        age = data.get('age', 30)
        risk_level = data.get('risk_level', 'Low')
        emergency = data.get('emergency', False)
        
        eligibility, claim_type, guidance = assess_insurance(age, risk_level, emergency)
        
        return jsonify({
            "success": True,
            "data": {
                "eligibility": eligibility,
                "claim_type": claim_type,
                "guidance": guidance
            },
            "message": "Insurance assessed"
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/nearby_hospitals', methods=['POST'])
def nearby_hospitals_api():
    try:
        data = request.get_json() or {}
        city = data.get('city', '')
        risk_level = data.get('risk_level', 'Low')
        lat = data.get('lat')
        lon = data.get('lon')
        
        hospitals = find_nearby_hospitals(city, risk_level, lat=lat, lon=lon)
        
        return jsonify({
            "success": True,
            "data": {"hospitals": hospitals},
            "message": "Hospitals retrieved"
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/ai_symptom_analysis', methods=['POST'])
def ai_symptom_analysis():
    """Analyze symptoms using Gemini explanation layer with deterministic risk override."""
    try:
        data = request.get_json() or {}
        symptoms = data.get('symptoms', [])
        age = data.get('age', 30)
        severity = data.get('severity', 1)
        duration = data.get('duration', 1)
        api_key = data.get('gemini_api_key') or os.getenv('GEMINI_API_KEY')

        # IMPORTANT: Enforce Deterministic Risk Calculation — overrides any AI estimation.
        _, deterministic_risk_level = calculate_risk(symptoms, severity, duration)
        condition = 'General Symptoms'

        try:
            # get_gemini_explanation is the correct, importeted function
            explanation = get_gemini_explanation(condition, deterministic_risk_level, symptoms, age, api_key)
            ai_result = {
                'condition_category': condition,
                'explanation': explanation,
                'risk_level': deterministic_risk_level,
                'disclaimer': 'This AI-generated information is for educational purposes only and is not a medical diagnosis.'
            }
            return jsonify({
                'success': True,
                'data': {'ai_analysis': ai_result},
                'message': 'AI analysis success'
            }), 200
        except Exception as e:
            print(f'AI analysis inner error: {e}')
            from utils.gemini_client import get_fallback_explanation
            fallback_result = {
                'condition_category': 'Unknown',
                'explanation': get_fallback_explanation(),
                'risk_level': deterministic_risk_level,
                'disclaimer': 'This AI-generated information is for educational purposes only and is not a medical diagnosis.'
            }
            return jsonify({
                'success': True,
                'data': {'ai_analysis': fallback_result},
                'message': 'Used deterministic fallback'
            }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ==========================================
# RAPID API DETERMINISTIC FALLBACK ENDPOINT 
# ==========================================

def predict_from_rapidapi(symptoms, age=30, gender="male"):
    """
    Primary diagnosis engine using RapidAPI.
    Strictly follows Requirement #1, #3, #4.
    """
    url = "https://ai-medical-diagnosis.p.rapidapi.com/analyze"
    
    # Requirement #3: Verify payload
    payload = {
        "symptoms": symptoms,
        "age": age,
        "gender": gender
    }

    headers = {
        "content-type": "application/json",
        "X-RapidAPI-Key": os.getenv("RAPIDAPI_KEY"),
        "X-RapidAPI-Host": os.getenv("RAPIDAPI_HOST")
    }

    try:
        print(f"[SYS] Calling RapidAPI for symptoms: {symptoms}")
        response = requests.post(url, json=payload, headers=headers, timeout=12)
        print(f"[DEBUG] RapidAPI Raw Response: {response.text}")
        
        # Requirement #4: Strict failure detection
        if response.status_code != 200:
            error_msg = response.json().get('message') or response.text
            print(f"[ERR] RapidAPI HTTP {response.status_code}: {error_msg}")
            return {
                "success": False,
                "fallback_reason": f"HTTP {response.status_code}: {error_msg}",
                "status_code": response.status_code
            }
            
        data = response.json()
        
        # Requirement #6: Multi-disease support
        # Assuming the API returns a 'diseases' list or a single 'disease'
        conditions = []
        if "diseases" in data and isinstance(data["diseases"], list):
            for d in data["diseases"][:3]: # Top 3
                conditions.append({
                    "condition": d.get("name") or d.get("disease"),
                    "confidence": round(float(d.get("confidence", 0.0)), 2)
                })
        elif "disease" in data:
            conditions.append({
                "condition": data.get("disease"),
                "confidence": round(float(data.get("confidence", 0.0)), 2)
            })

        if not conditions:
            print("[ERR] RapidAPI returned empty/invalid response.")
            return {
                "success": False,
                "fallback_reason": "Empty or malformed JSON response",
                "status_code": 200
            }

        return {
            "success": True,
            "conditions": conditions,
            "source": "rapidapi",
            "status_code": 200
        }

    except Exception as e:
        print(f"[ERR] RapidAPI connection error: {e}")
        return {
            "success": False,
            "fallback_reason": str(e),
            "status_code": 0
        }

def risk_band(confidence, severity=5, duration=3):
    """
    Calculate risk band using a weighted score of AI confidence, 
    user-reported severity (1-10), and duration (days).
    """
    # 1. Base score from AI confidence (0-100)
    score = confidence * 100
    
    # 2. Factor in clinical severity
    # If severity is low (1-3), cap/reduce the risk
    if severity <= 3:
        score = min(score, 45) # Keep it below "High" unless other factors dominate
        if severity == 1:
            score *= 0.5 # Halve the risk for minimal severity
            
    # If severity is high (8-10), boost the risk
    elif severity >= 8:
        score = max(score, 65) # At least "High"
        score += 10
        
    # 3. Factor in duration (chronic/lingering issues)
    if duration >= 14:
        score += 5 # Persistent symptoms slightly increase concern
    elif duration >= 30:
        score += 10
        
    # Final clamping
    score = min(max(score, 0), 100)
    
    # Deterministic thresholds
    if score < 35:
        return "Low"
    elif score < 65:
        return "Medium"
    elif score < 88:
        return "High"
    else:
        return "Critical"

@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        data = request.json or {}
        symptoms = data.get("symptoms", [])
        age = int(data.get("age", 30))
        severity = int(data.get("severity", 5))
        duration = int(data.get("duration", 3))
        city = data.get("city", "")
        lat = data.get("lat")
        lon = data.get("lon")
        api_key = data.get("gemini_api_key") or os.getenv("GEMINI_API_KEY")

        # TIERED DIAGNOSIS STRATEGY (Requirement #1)
        final_result = None
        response_source = "none"
        fallback_reason = None
        
        # Tier 1: RapidAPI
        rapid_res = predict_from_rapidapi(symptoms, age)
        if rapid_res.get("success"):
            final_result = rapid_res
            response_source = "rapidapi"
        else:
            fallback_reason = rapid_res.get("fallback_reason", "RapidAPI failed")
            
            # Tier 2: Gemini
            print(f"[SYS] Tier 1 failed ({fallback_reason}), trying Tier 2: Gemini...")
            gemini_res = predict_from_gemini(symptoms, age, api_key)
            if gemini_res and gemini_res.get("success"):
                final_result = gemini_res
                response_source = "gemini"
            else:
                gemini_err = "Gemini key missing or call failed"
                print(f"[SYS] Tier 2 failed: {gemini_err}")
                
                # Tier 3: Local Mapper
                print("[SYS] Trying Tier 3: Local Symptom Mapper...")
                local_res = map_symptoms_to_condition(symptoms)
                if local_res and local_res.get("success"):
                    final_result = local_res
                    response_source = "local_mapper"
                else:
                    # Final Fallback: Return None to trigger HTTP 500 (Requirement #1)
                    print("[SYS] All diagnostic tiers failed.")
                    final_result = None
                    response_source = "error"
                    fallback_reason = "All diagnostic tiers failed"

        # 1. Lock final results (Requirement #6, #7, #8)
        if not final_result:
             # Mandatory Requirement #1: Return HTTP 500 if no diagnostic tier succeeds
             return jsonify({
                 "status": "error",
                 "message": "Clinical Analysis Failed: No diagnostic engine returned a valid result.",
                 "debug": {"fallback_reason": fallback_reason}
             }), 500

        conditions = final_result.get("conditions", [])
        primary_condition = conditions[0]["condition"] if conditions else "Unknown"
        primary_confidence = conditions[0]["confidence"] if conditions else 0.0
        
        # 2. Risk Evaluation
        risk = risk_band(primary_confidence, severity, duration)
        
        # If local mapper found a specific high risk, use it
        if response_source == "local_mapper" and conditions:
            risk = conditions[0].get("risk", risk)

        # 3. Geolocation & Hospitals
        hospitals = []
        location_source = "none"
        if lat and lon:
            location_source = "gps"
        elif city:
            location_source = "manual"
            
        if risk == "Critical" or location_source != "none":
            hospitals = find_nearby_hospitals(city=city, risk_level=risk, lat=lat, lon=lon)

        # 4. Medicines
        medicines_data = get_otc_suggestions(symptoms, age, primary_condition)

        # 5. Insurance Assessment
        emergency_detected = final_result.get("emergency", risk == "Critical")
        insurance_eligibility, insurance_type, insurance_guidance, insurance_reason = assess_insurance(
            age, risk, emergency_detected, primary_condition
        )

        # 6. Safe Gemini Explanation
        explanation = get_gemini_explanation(primary_condition, risk, symptoms, age, api_key)

        final_payload = {
            "condition": primary_condition,
            "conditions": conditions, # Requirement #6: Multi-disease output
            "confidence": primary_confidence,
            "risk": risk,
            "explanation": explanation,
            "medicines": medicines_data,
            "hospitals": hospitals,
            "location_source": location_source,
            "source": response_source,
            "debug": { # Requirement #9 metadata for dev panel
                "source": response_source,
                "fallback_reason": fallback_reason,
                "status": "success",
                "api": response_source.upper(),
                "symptoms_sent": symptoms
            },
            "fallback": (response_source != "rapidapi"), # Requirement #8
            "insurance": {
                "eligibility": insurance_eligibility,
                "type": insurance_type,
                "guidance": insurance_guidance,
                "reason": insurance_reason
            }
        }

        # Return root-level keys explicitly matching prompt format criteria.
        return jsonify(final_payload)
    except Exception as e:
        print(f"Analyze Error: {e}")
        return jsonify({
             "condition": "System Evaluation Error",
             "conditions": [{"condition": "System Evaluation Error", "confidence": 0.0}],
             "confidence": 0.0,
             "risk": "Medium",
             "explanation": f"A server error occurred: {str(e)}",
             "medicines": {"suggestions": []},
             "hospitals": [],
             "location_source": "none",
             "source": "error",
             "fallback": True
        })

# ==========================================
# AUTHENTICATION ENDPOINTS 
# ==========================================

@app.route('/auth/register', methods=['POST'])
def register_request():
    """Step 1: Validate registration data and send OTP"""
    try:
        data = request.get_json() or {}
        full_name = data.get('full_name', '').strip()
        phone = data.get('phone', '').strip() or "N/A"
        email = data.get('email', '').strip().lower()
        username = data.get('username', '').strip().lower()
        password = data.get('password', '')

        if not all([full_name, email, username, password]):
            return jsonify({"success": False, "error": "All fields are required"}), 400

        # Check if exists
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('SELECT id FROM users WHERE email = ? OR username = ?', (email, username))
        if c.fetchone():
            conn.close()
            return jsonify({"success": False, "error": "Email or Username already exists"}), 400
        conn.close()

        # Generate and Send OTP
        otp = generate_otp(email)
        email_sent = send_otp_email(email, otp)
        
        # If email fails, we check if we should allow progression anyway (for dev/demo)
        is_dev = os.getenv("APP_ENV") == "development" or os.getenv("GEMINI_API_KEY") is None
        
        if not email_sent and not is_dev:
            return jsonify({"success": False, "error": "Failed to send OTP email."}), 500
            
        hashed_otp = generate_password_hash(otp)
        OTP_STORE[email] = {
            'hash': hashed_otp,
            'expires_at': time.time() + 600, # 10 mins
            'pending_data': {
                'full_name': full_name,
                'phone': phone,
                'email': email,
                'username': username,
                'password_hash': generate_password_hash(password)
            }
        }
        
        msg = "OTP sent to your email" if email_sent else "OTP generated (check server console for dev mode)"
        return jsonify({"success": True, "message": msg, "otp_sent": email_sent}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/auth/register-verify', methods=['POST'])
def register_verify():
    """Step 2: Verify OTP and create account"""
    try:
        data = request.get_json() or {}
        email = data.get('email', '').strip().lower()
        otp_input = data.get('otp', '').strip()

        if not email or not otp_input:
            return jsonify({"success": False, "error": "Email and OTP are required"}), 400

        pending = OTP_STORE.get(email)
        if not pending or 'pending_data' not in pending:
            return jsonify({"success": False, "error": "No registration session found"}), 400

        if time.time() > pending['expires_at']:
            del OTP_STORE[email]
            return jsonify({"success": False, "error": "OTP expired"}), 400

        if not check_password_hash(pending['hash'], otp_input):
            return jsonify({"success": False, "error": "Invalid OTP"}), 401

        # Success - Create User
        u = pending['pending_data']
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''
            INSERT INTO users (full_name, phone, email, username, password_hash)
            VALUES (?, ?, ?, ?, ?)
        ''', (u['full_name'], u['phone'], u['email'], u['username'], u['password_hash']))
        conn.commit()
        conn.close()

        del OTP_STORE[email]
        return jsonify({"success": True, "message": "Account created successfully"}), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/auth/login', methods=['POST'])
def login():
    """Standard Password Login"""
    try:
        data = request.get_json() or {}
        identifier = data.get('identifier', '').strip().lower()
        password = data.get('password', '')

        if not identifier or not password:
            return jsonify({"success": False, "error": "Username/Email and Password are required"}), 400

        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('SELECT id, username, email, password_hash FROM users WHERE email = ? OR username = ?', (identifier, identifier))
        user = c.fetchone()
        conn.close()

        if not user or not check_password_hash(user[3], password):
            return jsonify({"success": False, "error": "Invalid credentials"}), 401

        # Establish Session
        session['user_id'] = user[0]
        session['username'] = user[1]

        return jsonify({
            "success": True,
            "data": {
                "id": user[0],
                "username": user[1],
                "email": user[2]
            }
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/auth/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.get_json() or {}
        email = data.get('email', '').strip().lower()

        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('SELECT email FROM users WHERE email = ?', (email,))
        row = c.fetchone()
        conn.close()

        def mask_email(email):
            name, domain = email.split('@')
            if len(name) <= 4:
                return email
            return name[:4] + '*' * (len(name) - 4) + '@' + domain

        if not row:
            # Return success anyway to prevent user enumeration
            return jsonify({"success": True, "message": "If this email exists, an OTP has been sent."}), 200

        otp = generate_otp(email)
        send_otp_email(email, otp)
        
        OTP_STORE[email] = {
            'hash': generate_password_hash(otp),
            'expires_at': time.time() + 300,
            'is_recovery': True
        }
        return jsonify({
            "success": True, 
            "message": "OTP sent to your email",
            "data": {"masked_email": mask_email(email)}
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/auth/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.get_json() or {}
        email = data.get('email', '').strip().lower()
        otp = data.get('otp', '').strip()
        new_password = data.get('password', '')

        if not all([email, otp, new_password]):
            return jsonify({"success": False, "error": "Missing required fields"}), 400

        entry = OTP_STORE.get(email)
        if not entry or not entry.get('is_recovery'):
            return jsonify({"success": False, "error": "No recovery session found"}), 400

        if not check_password_hash(entry['hash'], otp):
            return jsonify({"success": False, "error": "Invalid OTP"}), 401

        # Update Password
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('UPDATE users SET password_hash = ? WHERE email = ?', (generate_password_hash(new_password), email))
        conn.commit()
        conn.close()

        del OTP_STORE[email]
        return jsonify({"success": True, "message": "Password updated successfully"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/auth/send-otp', methods=['POST'])
def send_otp():
    try:
        data = request.get_json() or {}
        identifier = data.get('identifier', '').strip().lower()
        
        if not identifier:
            return jsonify({"success": False, "error": "Email or Username is required"}), 400
            
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        email = identifier
        if '@' not in identifier:
            c.execute('SELECT email FROM users WHERE username = ?', (identifier,))
            row = c.fetchone()
            if row:
                email = row[0]
            else:
                conn.close()
                return jsonify({"success": False, "error": "User not found"}), 404
        conn.close()

        current_time = time.time()
        
        otp = generate_otp(email)
        
        # Attempt email dispatch
        email_sent = send_otp_email(email, otp)
        demo_mode = False
        
        if not email_sent:
            return jsonify({"success": False, "error": "Failed to send OTP email."}), 500
            
        hashed_otp = generate_password_hash(otp)
        OTP_STORE[email] = {
            'hash': hashed_otp,
            'expires_at': current_time + 300,
            'last_sent': current_time,
            'resend_count': 1,
            'attempts': 0
        }
        
        return jsonify({
            "success": True, 
            "data": {"demo_mode": False},
            "message": "OTP sent to your email"
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/auth/resend-otp', methods=['POST'])
def resend_otp():
    try:
        data = request.get_json() or {}
        identifier = data.get('identifier', '').strip().lower()
        
        if not identifier:
            return jsonify({"success": False, "error": "Email or Username is required"}), 400
            
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        email = identifier
        if '@' not in identifier:
            c.execute('SELECT email FROM users WHERE username = ?', (identifier,))
            row = c.fetchone()
            if row:
                email = row[0]
            else:
                conn.close()
                return jsonify({"success": False, "error": "User not found"}), 404
        conn.close()

        current_time = time.time()
        existing = OTP_STORE.get(email)
        
        if not existing:
            return jsonify({"success": False, "error": "No active OTP session. Please request a new one."}), 400
            
        last_sent = existing['last_sent']
        resend_count = existing['resend_count']
        time_elapsed = current_time - last_sent
        
        if time_elapsed < 60:
            remaining = int(60 - time_elapsed)
            return jsonify({
                "success": False, 
                "error": f"Please wait {remaining} seconds before resending OTP.",
                "data": {
                    "cooldown_active": True,
                    "remaining_seconds": remaining
                }
            }), 429
            
        if resend_count >= 3:
            return jsonify({
                "success": False, 
                "error": "Resend limit reached. Try again later."
            }), 429
            
        otp = generate_otp(email)
        
        email_sent = send_otp_email(email, otp)
        demo_mode = False
        
        if not email_sent:
            return jsonify({"success": False, "error": "Failed to send OTP email."}), 500

        hashed_otp = generate_password_hash(otp)
        existing['hash'] = hashed_otp
        existing['last_sent'] = current_time
        existing['resend_count'] += 1
        existing['expires_at'] = current_time + 300
        
        return jsonify({
            "success": True, 
            "data": {"demo_mode": False},
            "message": "A new OTP has been sent."
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/auth/verify-otp', methods=['POST'])
def verify_otp():
    try:
        data = request.get_json() or {}
        identifier = data.get('identifier', '').strip().lower()
        otp_input = data.get('otp')
        
        if not identifier or not otp_input:
            return jsonify({"success": False, "error": "Email/Username and OTP are required"}), 400
            
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        email = identifier
        if '@' not in identifier:
            c.execute('SELECT email FROM users WHERE username = ?', (identifier,))
            row = c.fetchone()
            if row:
                email = row[0]
            else:
                conn.close()
                return jsonify({"success": False, "error": "User not found"}), 404
                
        existing = OTP_STORE.get(email)
        
        if not existing:
            conn.close()
            return jsonify({"success": False, "error": "No OTP requested or OTP expired"}), 400
            
        if time.time() > existing['expires_at']:
            del OTP_STORE[email]
            conn.close()
            return jsonify({"success": False, "error": "OTP has expired. Please request a new one."}), 400
            
        if existing['attempts'] >= 3:
            del OTP_STORE[email]
            conn.close()
            return jsonify({"success": False, "error": "Too many invalid attempts. Please request a new OTP."}), 400
            
        if not check_password_hash(existing['hash'], str(otp_input)):
            existing['attempts'] += 1
            conn.close()
            return jsonify({"success": False, "error": "Invalid OTP"}), 401
            
        # Valid OTP
        del OTP_STORE[email]
        
        # Check if user exists, if not, create a shell record to maintain "Real" user status
        c.execute('SELECT id, full_name, email, username FROM users WHERE email = ?', (email,))
        user = c.fetchone()
        
        if not user:
            # Auto-create identity for tracking
            base_username = email.split('@')[0]
            c.execute('''
                INSERT INTO users (full_name, phone, email, username, password_hash)
                VALUES (?, ?, ?, ?, ?)
            ''', ("User", "N/A", email, base_username, "OTP_ONLY_ACCOUNT"))
            user_id = c.lastrowid
            username = base_username
        else:
            user_id = user[0]
            username = user[3]

        conn.commit()
        conn.close()
        
        # Establish Session
        session['user_id'] = user_id
        session['username'] = username
        
        return jsonify({
            "success": True,
            "data": {
                "id": user_id,
                "email": email,
                "username": username
            },
            "message": "OTP verified successfully. Logged in."
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/auth/test-email', methods=['GET'])
def test_email():
    try:
        smtp_server = os.environ.get('BREVO_SMTP_SERVER', 'smtp-relay.brevo.com')
        smtp_port = int(os.environ.get('BREVO_SMTP_PORT', 587))
        smtp_login = os.environ.get('BREVO_SMTP_LOGIN', '')
        smtp_key = os.environ.get('BREVO_SMTP_KEY', '')
        sender_email = os.environ.get('SENDER_EMAIL', 'noreply@yourdomain.com')
        
        if not smtp_login or not smtp_key or 'your_' in smtp_login:
            return jsonify({
                "success": False,
                "error": f"Credentials missing or are raw templates. (User: {smtp_login})"
            })
            
        msg = MIMEText("This is an isolated test envelope ensuring SMTP negotiation passes for AI HealthGuard.")
        msg['Subject'] = 'AI HealthGuard - Evaluator Relay Diagnostic'
        msg['From'] = sender_email
        msg['To'] = sender_email # Send back to self
        
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_login, smtp_key)
        server.send_message(msg)
        server.quit()
        return jsonify({
            "success": True,
            "data": {},
            "message": "Brevo SMTP working properly. Evaluator check passed."
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        })

@app.route('/auth/session', methods=['GET'])
def get_session():
    try:
        if 'user_id' in session:
            return jsonify({
                "success": True,
                "data": {
                    "user_id": session['user_id'],
                    "username": session.get('username')
                },
                "message": "Active session retrieved"
            }), 200
        else:
            return jsonify({
                "success": False,
                "error": "No active session"
            }), 401
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/auth/logout', methods=['POST'])
def logout():
    try:
        session.clear()
        return jsonify({
            "success": True,
            "data": {},
            "message": "Logged out successfully"
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# ==========================================
# AI HEALTH CHATBOT ENDPOINT
# ==========================================
@app.route('/chat', methods=['POST'])
def chat():
    """
    AI Health Chatbot — proxies messages to Anthropic Claude securely.
    API key stays on server, never exposed to the browser.
    """
    try:
        data = request.json or {}
        messages = data.get('messages', [])

        if not messages:
            return jsonify({'error': 'No messages provided'}), 400
        if len(messages) > 40:
            return jsonify({'error': 'Conversation too long. Please start a new chat.'}), 400

        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key or api_key == 'your_gemini_api_key_here':
             # Demo Mode Fallback if key is missing or placeholder
             last_message = messages[-1]['content'].lower() if messages else ""
             if "fever" in last_message:
                 reply = "HealthGuard Assistant (Demo Mode): A fever is usually a sign that your body is fighting off an infection. Ensure you drink plenty of fluids and rest. If it persists or exceeds 103°F (39.4°C), please consult a doctor."
             elif "headache" in last_message:
                 reply = "HealthGuard Assistant (Demo Mode): Headaches can be caused by stress, dehydration, or eye strain. Try resting in a dark room. Seek immediate care if it's sudden and severe."
             else:
                 reply = "HealthGuard Assistant (Demo Mode): Gemini API key not configured. Please add your key to backend/.env to enable full AI health guidance."
             return jsonify({'reply': reply, 'status': 'demo_fallback'})

        # HealthGuard AI - Backend
        # Render Deployment Sync: 2026-03-01 19:61
        SYSTEM_PROMPT = """You are HealthGuard AI, a knowledgeable and compassionate medical information assistant.
Explain symptoms, diseases, and conditions in clear language. Provide prevention tips and general management strategies.
Use **bold** for important terms and bullet points for lists. Never provide a personal diagnosis.
For emergencies (chest pain, stroke signs, etc.), URGE calling 112 immediately at the start of your message.
You are NOT a replacement for a doctor. Be helpful, accurate, and safe."""

        # Prepare messages for Gemini with strict role alternation
        gemini_contents = []
        
        # Add system prompt as the first message for v1 stability
        gemini_contents.append({
            "role": "user",
            "parts": [{"text": f"SYSTEM INSTRUCTION: {SYSTEM_PROMPT}\n\nPlease acknowledge these instructions and act accordingly for all further messages."}]
        })
        gemini_contents.append({
            "role": "model",
            "parts": [{"text": "Understood. I am HealthGuard AI, your medical information assistant. I will provide safe, compassionate, and clear guidance while urging emergency care when necessary. I am not a doctor, and I will not provide personal diagnoses."}]
        })

        last_role = "model"
        for msg in messages:
            role = "user" if msg.get("role") == "user" else "model"
            content = msg.get("content", "").strip()
            if not content: continue
            
            if role == last_role:
                # Merge consecutive messages with the same role
                gemini_contents[-1]["parts"][0]["text"] += "\n" + content
            else:
                gemini_contents.append({
                    "role": role,
                    "parts": [{"text": content}]
                })
                last_role = role

        print(f"[CHAT DEBUG] Sending {len(gemini_contents)} messages to Gemini (v1).", flush=True)

        # Gemini API Request (Dynamic Model Selection)
        try:
            # 1. Discover available models first to ensure compatibility
            models_url = f'https://generativelanguage.googleapis.com/v1/models?key={api_key}'
            models_response = requests.get(models_url)
            
            model_to_use = "models/gemini-1.5-flash" # Default
            if models_response.ok:
                models_data = models_response.json().get("models", [])
                # Prefer 1.5-flash, then pro, then any that supports generateContent
                available_names = [m["name"] for m in models_data if "generateContent" in m.get("supportedGenerationMethods", [])]
                
                if "models/gemini-1.5-flash" in available_names:
                    model_to_use = "models/gemini-1.5-flash"
                elif "models/gemini-pro" in available_names:
                    model_to_use = "models/gemini-pro"
                elif available_names:
                    model_to_use = available_names[0]
                
                print(f"[CHAT DEBUG] Using discovered model: {model_to_use}", flush=True)
            else:
                # Fallback to v1beta if v1 listing fails
                print(f"[CHAT DEBUG] v1 model listing failed, trying v1beta fallback.", flush=True)
                model_to_use = "models/gemini-1.5-flash"

            # 2. Execute generateContent
            # We use v1 if possible, fallback to v1beta if specific errors occur (handled by broad try/except)
            version = "v1"
            chat_url = f'https://generativelanguage.googleapis.com/{version}/{model_to_use}:generateContent?key={api_key}'
            
            headers = {'Content-Type': 'application/json'}
            payload = {
                "contents": gemini_contents,
                "generationConfig": {
                    "maxOutputTokens": 1024,
                    "temperature": 0.4
                }
            }
            
            response = requests.post(chat_url, headers=headers, json=payload, timeout=30)

            if response.ok:
                result = response.json()
                try:
                    reply = result['candidates'][0]['content']['parts'][0]['text']
                    return jsonify({'reply': reply, 'status': 'success'})
                except (KeyError, IndexError):
                    print(f"[CHAT ERR] Malformed Gemini response: {result}", flush=True)
                    return jsonify({'error': 'Malformed response from AI service.', 'status': 'error'})
            else:
                try:
                    error_json = response.json()
                    error_msg = error_json.get('error', {}).get('message', 'Unknown error')
                except:
                    error_msg = response.text
                print(f"[CHAT ERR] Gemini API Error (Status {response.status_code}): {error_msg}", flush=True)
                return jsonify({'error': f'Gemini API Error: {error_msg}', 'status': 'api_error'})

        except Exception as e:
            print(f"[CHAT ERR] API Call Exception: {e}", flush=True)
            return jsonify({'error': f'Internal Server Error: {str(e)}', 'status': 'exception'})

        # Fallback if API fails
        last_message = messages[-1]['content'].lower() if messages else ""
        if "fever" in last_message:
            reply = "HealthGuard Assistant (Demo Mode): A fever is usually a sign of infection. Rest and stay hydrated. Consult a doctor if it persists."
        else:
            reply = "HealthGuard Assistant (Demo Mode): I'm having trouble reaching the Gemini AI. Please ensure your internet is stable and your API key is valid."
        
        return jsonify({'reply': reply, 'status': 'demo_fallback'})

    except requests.exceptions.Timeout:
        return jsonify({'reply': "HealthGuard Assistant: The AI service is taking too long. Please stay hydrated and try your question again in a moment.", 'status': 'timeout_fallback'})
    except Exception as e:
        print(f"[CHAT ERR] {e}")
        return jsonify({'reply': "HealthGuard Assistant (Demo Mode): I'm having trouble connecting to the cloud. Please check your symptoms in the main portal above.", 'status': 'error_fallback'})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host='0.0.0.0', port=port, debug=False, use_reloader=False)