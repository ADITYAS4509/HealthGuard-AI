"""
HealthGuard Gemini Client
Provides AI-powered symptom analysis and clinical explanations via Google Gemini.
"""

import os

try:
    import google.generativeai as genai
    SDK_AVAILABLE = True
except ImportError:
    SDK_AVAILABLE = False
    print("[WARN] google-generativeai not installed. Gemini features disabled.")


def get_fallback_explanation():
    return (
        "Based on your reported symptoms, a clinical evaluation is recommended. "
        "Please consult a qualified healthcare professional for a proper diagnosis and treatment plan. "
        "If symptoms worsen, seek emergency care immediately."
    )


def get_gemini_explanation(condition, risk_level, symptoms, age, api_key=None, lang="en"):
    """
    Generates a short clinical explanation for the given condition and risk level.
    Returns a plain text string in the user's chosen language.
    """
    if not SDK_AVAILABLE:
        return get_fallback_explanation()

    if not api_key:
        api_key = os.environ.get("GEMINI_API_KEY")

    if not api_key:
        return get_fallback_explanation()

    fallback = get_fallback_explanation()

    lang_names = {
        "en": "English", "hi": "Hindi", "kn": "Kannada", "mr": "Marathi",
        "ta": "Tamil", "te": "Telugu", "ml": "Malayalam", "bn": "Bengali",
        "gu": "Gujarati", "pa": "Punjabi", "or": "Odia", "ur": "Urdu",
        "as": "Assamese", "ne": "Nepali", "kok": "Konkani"
    }
    lang_name = lang_names.get(lang, "English")
    print(f"[SYS] Gemini Explanation - Condition: {condition}, Lang: {lang} ({lang_name})")

    system_prompt = (
        f"You are a medical information assistant. ALWAYS respond in {lang_name} language ONLY. "
        f"Even scientific terms should be translated or transliterated to {lang_name}. "
        "Given a condition, risk level, and symptoms, provide a 2–3 sentence clinical context "
        "explaining what this means for the patient in plain language. "
        "Do NOT diagnose. Recommend professional consultation."
    )

    user_prompt = (
        f"Patient: Age {age}, Symptoms: {', '.join(symptoms)}. "
        f"Predicted Condition: {condition}. Risk Level: {risk_level}. "
        f"Provide a brief, clear clinical context in 2-3 sentences."
    )

    try:
        genai.configure(api_key=api_key)
        model_name = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
        model = genai.GenerativeModel(
            model_name=model_name,
            system_instruction=system_prompt
        )

        response = model.generate_content(
            user_prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.2
            )
        )

        if response and hasattr(response, 'text'):
            text = response.text
        else:
            text = ""

        if not text or len(text.strip()) == 0:
            return fallback

        return text.strip()

    except Exception as e:
        print(f"Gemini AI Analysis Error: {e}")
        return fallback


def predict_from_gemini(symptoms, age=30, api_key=None, model_name=None, lang="en"):
    """
    Uses Gemini to perform a clinical assessment and suggest up to 3 conditions.
    Returns condition names in the user's selected language.
    """
    import time
    import json

    # Guarantee absolute determinism by neutralizing click-order variance
    symptoms = sorted([str(s) for s in symptoms])

    if not api_key:
        api_key = os.environ.get("GEMINI_API_KEY")

    if not SDK_AVAILABLE or not api_key:
        return None

    lang_names = {
        "en": "English", "hi": "Hindi", "kn": "Kannada", "mr": "Marathi",
        "ta": "Tamil", "te": "Telugu", "ml": "Malayalam", "bn": "Bengali",
        "gu": "Gujarati", "pa": "Punjabi", "or": "Odia", "ur": "Urdu",
        "as": "Assamese", "ne": "Nepali", "kok": "Konkani"
    }
    lang_name = lang_names.get(lang, "English")
    print(f"[SYS] Gemini Prediction - Symptoms: {symptoms}, Lang: {lang} ({lang_name})")

    system_prompt = (
        f"You are a medical triage assistant. ALWAYS respond in {lang_name} language ONLY. "
        f"Translate all condition names to {lang_name}. "
        "Analyze the symptoms and age to suggest the most likely clinical conditions. "
        "RULES:\n"
        f"- Return ONLY a JSON object with a key 'conditions' containing a list of objects.\n"
        f"- Each object must have: 'condition' (string in {lang_name}) and 'confidence' (float 0.0-1.0).\n"
        "- Provide up to 3 conditions, sorted by confidence.\n"
        "- Do NOT provide any other text.\n"
    )

    user_prompt = f"Patient Age: {age}, Symptoms: {', '.join(symptoms)}. List the top 3 likely conditions."

    genai.configure(api_key=api_key)
    # Model rotation list: ordered by availability (least used first per screenshot)
    if model_name is None:
        primary = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
        model_candidates = [primary, "gemini-2.0-flash-lite", "gemini-2.0-flash-exp", "gemini-1.5-flash"]
    else:
        model_candidates = [model_name]

    # Retry with model rotation on rate limit
    max_retries = len(model_candidates)
    wait_times = [3, 5, 10]

    for attempt in range(max_retries):
        current_model_name = model_candidates[attempt] if attempt < len(model_candidates) else model_candidates[-1]
        print(f"[SYS] Gemini attempt {attempt+1}: using model '{current_model_name}'")
        model = genai.GenerativeModel(
            model_name=current_model_name,
            system_instruction=system_prompt
        )
        try:
            response = model.generate_content(
                user_prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.0,
                    response_mime_type="application/json"
                )
            )

            if not response or not hasattr(response, 'text'):
                return None

            raw_text = response.text.strip()
            # Clean markdown codeblocks if Gemini mistakenly includes them
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            elif raw_text.startswith("```"):
                raw_text = raw_text[3:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]

            try:
                data = json.loads(raw_text.strip())
            except json.JSONDecodeError as je:
                print(f"[ERR] JSON decode failed: {raw_text[:80]}... {je}")
                return None

            conditions_data = data.get("conditions", [])
            if not conditions_data and "condition" in data:
                conditions_data = [{"condition": data["condition"], "confidence": data.get("confidence", 0.7)}]

            conditions = []
            for c in conditions_data[:3]:
                conditions.append({
                    "condition": str(c.get("condition", "Unknown")),
                    "confidence": round(float(c.get("confidence", 0.7)), 2)
                })

            print(f"[SYS] Gemini succeeded with '{current_model_name}'. Conditions: {[c['condition'] for c in conditions]}")
            return {
                "success": True,
                "conditions": conditions,
                "source": "gemini"
            }

        except Exception as e:
            err_str = str(e).lower()
            is_rate_limit = (
                "429" in err_str or
                "rate" in err_str or
                "quota" in err_str or
                "resource_exhausted" in err_str or
                "too many requests" in err_str
            )
            if is_rate_limit and attempt < max_retries - 1:
                wait = wait_times[attempt]
                print(f"[WARN] Gemini rate limited (attempt {attempt + 1}/{max_retries}). Retrying in {wait}s...")
                time.sleep(wait)
                continue
            else:
                print(f"[ERR] predict_from_gemini failed on attempt {attempt + 1}: {e}")
                return None

    return None
