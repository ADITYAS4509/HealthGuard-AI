import json
import os

languages = {
    'en': 'English',
    'hi': 'हिन्दी',       # Hindi
    'kn': 'ಕನ್ನಡ',      # Kannada
    'mr': 'मराठी',       # Marathi
    'ta': 'தமிழ்',      # Tamil
    'te': 'తెలుగు',     # Telugu
    'ml': 'മലയാളം',   # Malayalam
    'bn': 'বাংলা',     # Bengali
    'gu': 'ગુજરાતી',   # Gujarati
    'pa': 'ਪੰਜਾਬੀ',     # Punjabi
    'or': 'ଓଡ଼ିଆ',       # Odia
    'ur': 'اردو',        # Urdu
    'as': 'অসমীয়া',    # Assamese
    'ne': 'नेपाली',      # Nepali
    'kok': 'कोंकणी'      # Konkani
}

# Define the English base keys
translations_base = {
    'nav_symptoms': 'Symptoms',
    'nav_analyze': 'Analyze',
    'nav_results': 'Results',
    'nav_hospitals': 'Hospitals',
    'btn_start_intake': 'Start Intake',
    
    'intake_step1': 'Intake Step 1',
    'clinical_presentation': 'Clinical Presentation',
    'clinical_desc': 'Enter the symptoms you are currently experiencing.',
    'search_symptoms_placeholder': 'Search symptoms (e.g., Fever, Cough)...',
    'common_symptoms': 'Or select common symptoms below:',
    'btn_clear_all': 'Clear All',
    
    'intake_step2': 'Intake Step 2',
    'patient_demographics': 'Patient Demographics',
    'demographics_desc': 'Core information for accurate risk assessment.',
    'label_age': 'Patient Age (Years)',
    'label_duration': 'Symptom Duration',
    'unit_days': 'Days',
    'unit_weeks': 'Weeks',
    'unit_months': 'Months',
    'label_location': 'Current Location',
    'search_location_placeholder': 'Search city or click live GPS icon...',
    
    'btn_process': 'Process Assessment',
    
    'disclaimer': 'Medical Disclaimer: AI HealthGuard provides preliminary screening based on statistical modeling. It does not provide medical diagnoses. Always consult a healthcare professional for severe symptoms.',
    
    'results_title': 'Triage Report',
    'results_desc': 'Preliminary clinical assessment generated based on your inputted parameters.',
    'risk_score': 'Risk Score',
    'quick_summary': 'Quick Summary',
    
    'insurance_title': 'Insurance Guidance',
    'insurance_desc': 'Based on your risk assessment, here is your insurance eligibility and recommended next steps.',
    
    'hospitals_title': 'Authorized Facilities',
    'hospitals_desc': 'Hospitals near your location.',
    'btn_refresh': 'Refresh',
    
    'lang_selector': 'Translate'
}

# The translations mapped to keys
t = {
    'en': translations_base,
    'hi': {
        'nav_symptoms': 'लक्षण (Symptoms)',
        'nav_analyze': 'विश्लेषण (Analyze)',
        'nav_results': 'परिणाम (Results)',
        'nav_hospitals': 'अस्पताल (Hospitals)',
        'btn_start_intake': 'शुरू करें',
        'intake_step1': 'चरण 1',
        'clinical_presentation': 'नैदानिक प्रस्तुति (Symptoms)',
        'clinical_desc': 'कृपया वे लक्षण दर्ज करें जो आप वर्तमान में अनुभव कर रहे हैं।',
        'search_symptoms_placeholder': 'लक्षण खोजें (उदा: बुखार, खांसी)...',
        'common_symptoms': 'या नीचे दिए गए सामान्य लक्षणों का चयन करें:',
        'btn_clear_all': 'सभी मिटाएं',
        'intake_step2': 'चरण 2',
        'patient_demographics': 'रोगी विवरण (Details)',
        'demographics_desc': 'सटीक जोखिम मूल्यांकन के लिए मुख्य जानकारी।',
        'label_age': 'रोगी की आयु (वर्ष)',
        'label_duration': 'लक्षण की अवधि',
        'unit_days': 'दिन',
        'unit_weeks': 'सप्ताह',
        'unit_months': 'महीने',
        'label_location': 'वर्तमान स्थान',
        'search_location_placeholder': 'शहर खोजें या लाइव GPS आइकन पर क्लिक करें...',
        'btn_process': 'मूल्यांकन प्रोसेस करें',
        'disclaimer': 'चिकित्सा अस्वीकरण: AI HealthGuard प्रारंभिक जांच प्रदान करता है। यह चिकित्सा निदान प्रदान नहीं करता है। हमेशा एक डॉक्टर से परामर्श लें।',
        'results_title': 'मूल्यांकन रिपोर्ट',
        'results_desc': 'आपके द्वारा दर्ज किए गए मापदंडों के आधार पर प्रारंभिक नैदानिक मूल्यांकन।',
        'risk_score': 'जोखिम स्कोर',
        'quick_summary': 'त्वरित सारांश (Summary)',
        'insurance_title': 'बीमा मार्गदर्शन (Insurance)',
        'insurance_desc': 'आपके जोखिम मूल्यांकन के आधार पर बीमा पात्रता और अगले कदम।',
        'hospitals_title': 'अधिकृत अस्पताल',
        'hospitals_desc': 'आपके स्थान के पास के अस्पताल।',
        'btn_refresh': 'रिफ्रेश करें',
        'lang_selector': 'भाषा (Language)'
    },
    'kn': {
        'nav_symptoms': 'ಲಕ್ಷಣಗಳು (Symptoms)',
        'nav_analyze': 'ವಿಶ್ಲೇಷಣೆ (Analyze)',
        'nav_results': 'ಫಲಿತಾಂಶಗಳು (Results)',
        'nav_hospitals': 'ಆಸ್ಪತ್ರೆಗಳು (Hospitals)',
        'btn_start_intake': 'ಪ್ರಾರಂಭಿಸಿ',
        'intake_step1': 'ಹಂತ 1',
        'clinical_presentation': 'ರೋಗಲಕ್ಷಣಗಳು',
        'clinical_desc': 'ನೀವು ಪ್ರಸ್ತುತ ಅನುಭವಿಸುತ್ತಿರುವ ಲಕ್ಷಣಗಳನ್ನು ನಮೂದಿಸಿ.',
        'search_symptoms_placeholder': 'ಲಕ್ಷಣಗಳನ್ನು ಹುಡುಕಿ (ಉದಾ: ಜ್ವರ, ಕೆಮ್ಮು)...',
        'common_symptoms': 'ಅಥವಾ ಕೆಳಗಿನ ಸಾಮಾನ್ಯ ಲಕ್ಷಣಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ:',
        'btn_clear_all': 'ಎಲ್ಲವನ್ನೂ ಅಳಿಸಿ',
        'intake_step2': 'ಹಂತ 2',
        'patient_demographics': 'ರೋಗಿಯ ವಿವರಗಳು (Details)',
        'demographics_desc': 'ನಿಖರವಾದ ಅಪಾಯದ ಮೌಲ್ಯಮಾಪನಕ್ಕಾಗಿ ಮುಖ್ಯ ಮಾಹಿತಿ.',
        'label_age': 'ವಯಸ್ಸು (ವರ್ಷಗಳು)',
        'label_duration': 'ಲಕ್ಷಣದ ಅವಧಿ',
        'unit_days': 'ದಿನಗಳು',
        'unit_weeks': 'ವಾರಗಳು',
        'unit_months': 'ತಿಂಗಳುಗಳು',
        'label_location': 'ಪ್ರಸ್ತುತ ಸ್ಥಳ',
        'search_location_placeholder': 'ನಗರವನ್ನು ಹುಡುಕಿ ಅಥವಾ GPS ಕ್ಲಿಕ್ ಮಾಡಿ...',
        'btn_process': 'ಮೌಲ್ಯಮಾಪನ ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಿ',
        'disclaimer': 'ವೈದ್ಯಕೀಯ ಹಕ್ಕು ನಿರಾಕರಣೆ: ಇದು ಪ್ರಾಥಮಿಕ ತಪಾಸಣೆ ಮಾತ್ರ. ದಯವಿಟ್ಟು ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.',
        'results_title': 'ಮೌಲ್ಯಮಾಪನ ವರದಿ',
        'results_desc': 'ನಿಮ್ಮ ಮಾಹಿತಿಯ ಆಧಾರದ ಮೇಲೆ ಪ್ರಾಥಮಿಕ ವರದಿ.',
        'risk_score': 'ಅಪಾಯದ ಅಂಕ',
        'quick_summary': 'ತ್ವರಿತ ಸಾರಾಂಶ',
        'insurance_title': 'ವಿಮೆ ಮಾರ್ಗದರ್ಶನ (Insurance)',
        'insurance_desc': 'ನಿಮ್ಮ ವಿಮಾ ಅರ್ಹತೆ ಮತ್ತು ಶಿಫಾರಸು ಮಾಡಲಾದ ಮುಂದಿನ ಹಂತಗಳು.',
        'hospitals_title': 'ಸ್ಥಳೀಯ ಆಸ್ಪತ್ರೆಗಳು',
        'hospitals_desc': 'ನಿಮ್ಮ ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆಗಳು.',
        'btn_refresh': 'ರಿಫ್ರೆಶ್ (Refresh)',
        'lang_selector': 'ಭಾಷೆ (Language)'
    },
    'mr': {
        'nav_symptoms': 'लक्षणे (Symptoms)',
        'nav_analyze': 'विश्लेषण (Analyze)',
        'nav_results': 'निकाल (Results)',
        'nav_hospitals': 'रुग्णालये (Hospitals)',
        'btn_start_intake': 'सुरू करा',
        'intake_step1': 'पायरी 1',
        'clinical_presentation': 'क्लिनिकल सादरीकरण',
        'clinical_desc': 'सध्या जाणवणारी लक्षणे प्रविष्ट करा.',
        'search_symptoms_placeholder': 'लक्षणे शोधा (उदा: ताप, खोकला)...',
        'common_symptoms': 'किंवा खालील सामान्य लक्षणे निवडा:',
        'btn_clear_all': 'सर्व पुसून टाका',
        'intake_step2': 'पायरी 2',
        'patient_demographics': 'रुग्णाचा तपशील (Details)',
        'demographics_desc': 'अचूक जोखीम मूल्यांकनासाठी मुख्य माहिती.',
        'label_age': 'वय (वर्षे)',
        'label_duration': 'लक्षणांचा कालावधी',
        'unit_days': 'दिवस',
        'unit_weeks': 'आठवडे',
        'unit_months': 'महिने',
        'label_location': 'सध्याचे ठिकाण',
        'search_location_placeholder': 'शहर शोधा किंवा GPS वर क्लिक करा...',
        'btn_process': 'मूल्यांकन प्रक्रिया करा',
        'disclaimer': 'वैद्यकीय अस्वीकरण: हे केवळ प्राथमिक तपासणीसाठी आहे. नेहमी डॉक्टरांचा सल्ला घ्या.',
        'results_title': 'मूल्यांकन अहवाल',
        'results_desc': 'तुम्ही दिलेल्या माहितीवर आधारित प्राथमिक अहवाल.',
        'risk_score': 'जोखीम स्कोअर',
        'quick_summary': 'संक्षिप्त सारांश',
        'insurance_title': 'विमा मार्गदर्शन (Insurance)',
        'insurance_desc': 'तुमच्या जोखमीच्या मूल्यांकनावर आधारित विमा पात्रता.',
        'hospitals_title': 'अधिकृत रुग्णालये',
        'hospitals_desc': 'तुमच्या जवळील रुग्णालये.',
        'btn_refresh': 'रिफ्रेश करा',
        'lang_selector': 'भाषा (Language)'
    },
    'ta': {
        'nav_symptoms': 'அறிகுறிகள்',
        'nav_analyze': 'பகுப்பாய்வு',
        'nav_results': 'முடிவுகள்',
        'nav_hospitals': 'மருத்துவமனைகள்',
        'btn_start_intake': 'தொடங்கவும்',
        'intake_step1': 'படி 1',
        'clinical_presentation': 'மருத்துவ அறிகுறி',
        'clinical_desc': 'தற்போது நீங்கள் அனுபவிக்கும் அறிகுறிகளை உள்ளிடவும்.',
        'search_symptoms_placeholder': 'அறிகுறிகளை தேடவும் (காய்ச்சல், இருமல்)...',
        'common_symptoms': 'அல்லது பொதுவான அறிகுறிகளை தேர்ந்தெடுக்கவும்:',
        'btn_clear_all': 'அனைத்தையும் அழி',
        'intake_step2': 'படி 2',
        'patient_demographics': 'நோயாளி விவரங்கள்',
        'demographics_desc': 'சரியான ஆபத்து மதிப்பீட்டிற்கான முக்கிய தகவல்.',
        'label_age': 'நோயாளியின் வயது',
        'label_duration': 'அறிகுறி காலம்',
        'unit_days': 'நாட்கள்',
        'unit_weeks': 'வாரங்கள்',
        'unit_months': 'மாதங்கள்',
        'label_location': 'தற்போதைய இடம்',
        'search_location_placeholder': 'நகரத்தை தேடவும் அல்லது GPS ஐ அழுத்தவும்...',
        'btn_process': 'மதிப்பீட்டை தொடங்கு',
        'disclaimer': 'பொறுப்புத்துறப்பு: இது முதற்கட்ட பரிசோதனை மட்டுமே. மருத்துவரை அணுகவும்.',
        'results_title': 'பகுப்பாய்வு அறிக்கை',
        'results_desc': 'உங்கள் உள்ளீட்டின் அடிப்படையில் முதற்கட்ட அறிக்கை.',
        'risk_score': 'ஆபத்து நிலை',
        'quick_summary': 'விரைவான சுருக்கம்',
        'insurance_title': 'காப்பீடு வழிகாட்டுதல்',
        'insurance_desc': 'உங்கள் மருத்துவ காப்பீட்டு தகுதி மற்றும் அடுத்தக்கட்ட நடவடிக்கைகள்.',
        'hospitals_title': 'அருகம்பாமை மருத்துவமனைகள்',
        'hospitals_desc': 'உங்கள் அருகிலுள்ள மருத்துவமனைகள்.',
        'btn_refresh': 'புதுப்பி',
        'lang_selector': 'மொழி (Language)'
    },
    'te': {
        'nav_symptoms': 'లక్షణాలు',
        'nav_analyze': 'విశ్లేషించండి',
        'nav_results': 'ఫలితాలు',
        'nav_hospitals': 'ఆసుపత్రులు',
        'btn_start_intake': 'ప్రారంభించండి',
        'intake_step1': 'దశ 1',
        'clinical_presentation': 'క్లినికల్ లక్షణాలు',
        'clinical_desc': 'మీరు ప్రస్తుతం అనుభవిస్తున్న వ్యాధి లక్షణాలను నమోదు చేయండి.',
        'search_symptoms_placeholder': 'లక్షణాలను శోధించండి (ఉదా: జ్వరం, దగ్గు)...',
        'common_symptoms': 'లేదా పాత లక్షణాలను ఎంచుకోండి:',
        'btn_clear_all': 'అన్ని తీసివేయండి',
        'intake_step2': 'దశ 2',
        'patient_demographics': 'రోగి వివరాలు',
        'demographics_desc': 'ఖచ్చితమైన ప్రమాద అంచనా కోసం సమాచారం.',
        'label_age': 'రోగి వయస్సు (సంవత్సరాలు)',
        'label_duration': 'లక్షణాలు ఎంతకాలం ఉన్నాయి',
        'unit_days': 'రోజులు',
        'unit_weeks': 'వారాలు',
        'unit_months': 'నెలలు',
        'label_location': 'ప్రస్తుత ప్రదేశం',
        'search_location_placeholder': 'నగరం శోధించండి లేదా GPS క్లిక్ చేయండి...',
        'btn_process': 'అంచనా వేయండి',
        'disclaimer': 'గమనిక: ఇది ప్రాథమిక పరీక్ష మాత్రమే. దయచేసి వైద్యుడిని సంప్రదించండి.',
        'results_title': 'పరీక్షా నివేదిక',
        'results_desc': 'మీరు ఇచ్చిన సమాచారం ఆధారంగా ప్రాథమిక నివేదిక.',
        'risk_score': 'ప్రమాద స్కోరు',
        'quick_summary': 'శీఘ్ర సారాంశం',
        'insurance_title': 'భీమా మార్గదర్శకత్వం',
        'insurance_desc': 'మీ ప్రమాద అంచనా ఆధారంగా మీ భీమా అర్హత.',
        'hospitals_title': 'అధీకృత ఆసుపత్రులు',
        'hospitals_desc': 'మీ సమీపంలో ఉన్న ఆసుపత్రులు.',
        'btn_refresh': 'రీఫ్రెష్ చేయండి',
        'lang_selector': 'భాష (Language)'
    }
}

# The remaining languages can fallback to English with prefix or partial translation, 
# for brevity and since we only need UI to demonstrate multilingual capability.
for code in ['ml', 'bn', 'gu', 'pa', 'or', 'ur', 'as', 'ne', 'kok']:
    t[code] = translations_base.copy()
    t[code]['nav_symptoms'] = f"Symptoms ({languages[code]})"
    t[code]['btn_start_intake'] = f"Start ({languages[code]})"
    t[code]['lang_selector'] = languages[code]

out_str = f"""/* ============================================================
   AUTO-GENERATED MULTILINGUAL DICTIONARY
   ============================================================ */
const LANGUAGES = {json.dumps(languages, indent=4, ensure_ascii=False)};
const TRANSLATIONS = {json.dumps(t, indent=4, ensure_ascii=False)};

function setLanguage(langCode) {{
    if (!TRANSLATIONS[langCode]) langCode = 'en';
    
    // Update active state in selector if exists
    const selector = document.getElementById('langSelector');
    if (selector) selector.value = langCode;

    // Traverse DOM for data-i18n tags
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {{
        const key = el.getAttribute('data-i18n');
        // Handle placeholders vs textContent
        if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {{
            if (TRANSLATIONS[langCode][key]) el.setAttribute('placeholder', TRANSLATIONS[langCode][key]);
        }} else {{
            if (TRANSLATIONS[langCode][key]) el.textContent = TRANSLATIONS[langCode][key];
        }}
    }});
    
    // Save preference
    localStorage.setItem('healthguard_lang', langCode);
    document.documentElement.lang = langCode;
}}

// Initialize script on load
window.addEventListener('DOMContentLoaded', () => {{
    const savedLang = localStorage.getItem('healthguard_lang') || 'en';
    setLanguage(savedLang);
}});
"""

os.makedirs('site/public/assets/js', exist_ok=True)
with open('site/public/assets/js/i18n.js', 'w', encoding='utf-8') as f:
    f.write(out_str)
print("i18n.js generated successfully.")
