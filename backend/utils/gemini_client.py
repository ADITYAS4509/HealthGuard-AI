import os

# Try to import Google Generative AI SDK; handle gracefully if missing
try:
    import google.generativeai as genai
    SDK_AVAILABLE = True
except Exception:
    SDK_AVAILABLE = False


def get_fallback_explanation():
    """Returns a deterministic safe fallback explanation string."""
    return "Due to high system load or network instability, an extended explanation could not be generated. Please rely on the primary triage risk level and guidance provided."

def get_gemini_explanation(condition, risk_level, symptoms, age=30, api_key=None, model_name=None):
    """
    Generate a simple, conversational explanation using Google Gemini.
    """
    fallback = get_fallback_explanation()

    if not SDK_AVAILABLE or not api_key:
        return fallback

    # Build the structured prompt
    system_prompt = (
        "You are a healthcare decision-support assistant. "
        "IMPORTANT RULES:\n"
        "- Do NOT provide medical diagnoses.\n"
        "- Do NOT provide confidence percentages or probability scores.\n"
        "- Do NOT change or question the provided risk level.\n"
        "- Do NOT suggest specific medicines.\n"
        "- If risk is 'Critical', calmly mention that a hospital visit is strongly recommended.\n"
        "- Use calm, neutral, patient-friendly language.\n"
        "- Output ONLY a plain text explanation (2-4 sentences max).\n"
    )

    user_prompt = f"""
    The patient (Age: {age}) reported symptoms: {', '.join(symptoms) if symptoms else 'none'}.
    The deterministic system evaluated the condition as '{condition}' with a '{risk_level}' risk level.
    
    Provide a brief, reassuring explanation of what this might mean and general next steps, adhering strictly to your rules.
    """

    # Configure SDK
    try:
        genai.configure(api_key=api_key)
    except Exception:
        try:
            genai.client.configure(api_key=api_key)
        except Exception:
            return fallback

    if model_name is None:
        model_name = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")

    try:
        model = genai.GenerativeModel(
            model_name=model_name,
            system_instruction=system_prompt
        )
        
        response = model.generate_content(
            user_prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.2,
                max_output_tokens=300,
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

def predict_from_gemini(symptoms, age=30, api_key=None, model_name=None):
    """
    Uses Gemini to perform a clinical assessment and suggest up to 3 conditions.
    Returns: dict with conditions list
    """
    if not SDK_AVAILABLE or not api_key:
        return None

    system_prompt = (
        "You are a highly accurate medical triage assistant. "
        "Analyze the symptoms and age to suggest the most likely clinical conditions. "
        "RULES:\n"
        "- Return ONLY a JSON object with a key 'conditions' containing a list of objects.\n"
        "- Each object must have: 'condition' (string) and 'confidence' (float 0.0-1.0).\n"
        "- Provide up to 3 conditions, sorted by confidence.\n"
        "- Do NOT provide any other text.\n"
    )

    user_prompt = f"Patient Age: {age}, Symptoms: {', '.join(symptoms)}. List the top 3 likely conditions."

    try:
        genai.configure(api_key=api_key)
        if model_name is None:
            model_name = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")
            
        model = genai.GenerativeModel(
            model_name=model_name,
            system_instruction=system_prompt
        )
        
        response = model.generate_content(
            user_prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.1,
                max_output_tokens=200,
                response_mime_type="application/json"
            )
        )
        print(f"[DEBUG] Gemini Raw Response: {response.text if hasattr(response, 'text') else 'No Text'}")
        
        import json
        if response and hasattr(response, 'text'):
            data = json.loads(response.text)
            conditions_data = data.get("conditions", [])
            if not conditions_data and "condition" in data:
                conditions_data = [{"condition": data["condition"], "confidence": data.get("confidence", 0.7)}]
            
            conditions = []
            for c in conditions_data[:3]:
                conditions.append({
                    "condition": str(c.get("condition", "Unknown (Gemini)")),
                    "confidence": round(float(c.get("confidence", 0.7)), 2)
                })
                
            return {
                "success": True,
                "conditions": conditions,
                "source": "gemini"
            }
    except Exception as e:
        print(f"[ERR] predict_from_gemini failed: {e}")
        return None

    return None
