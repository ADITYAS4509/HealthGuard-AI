import os
import json
import time

try:
    import google.generativeai as genai
    SDK_AVAILABLE = True
except ImportError:
    SDK_AVAILABLE = False

def translate_text(text, target_lang="hi", api_key=None):
    """
    Translates a single string or a list of strings to the target language using Gemini.
    """
    if not SDK_AVAILABLE or not text:
        return text

    if not api_key:
        api_key = os.environ.get("GEMINI_API_KEY")

    if not api_key:
        return text

    # Map language codes to names for Gemini
    lang_names = {
        "en": "English", "hi": "Hindi", "kn": "Kannada", "mr": "Marathi",
        "ta": "Tamil", "te": "Telugu", "ml": "Malayalam", "bn": "Bengali",
        "gu": "Gujarati", "pa": "Punjabi", "or": "Odia", "ur": "Urdu",
        "as": "Assamese", "ne": "Nepali", "kok": "Konkani"
    }
    target_lang_name = lang_names.get(target_lang, "Hindi")

    if target_lang == "en":
        return text

    system_prompt = (
        f"You are a professional medical translator. ALWAYS respond in {target_lang_name} ONLY. "
        f"Translate the provided text or list of texts accurately into {target_lang_name}. "
        "Keep medical terminology accurate. Do NOT provide any other text."
    )

    try:
        genai.configure(api_key=api_key)
        model_name = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
        model = genai.GenerativeModel(model_name=model_name, system_instruction=system_prompt)

        input_data = text
        if isinstance(text, list):
            input_data = json.dumps(text)

        response = model.generate_content(
            f"Translate to {target_lang_name}: {input_data}",
            generation_config=genai.types.GenerationConfig(temperature=0.0)
        )

        if response and hasattr(response, "text"):
            result = response.text.strip()
            # If it was a list, try to parse JSON
            if isinstance(text, list):
                try:
                    # Clean markdown
                    if result.startswith("```json"): result = result[7:]
                    elif result.startswith("```"): result = result[3:]
                    if result.endswith("```"): result = result[:-3]
                    return json.loads(result)
                except:
                    return result
            return result
    except Exception as e:
        print(f"[ERR] Translation failed: {e}")
        return text

    return text
