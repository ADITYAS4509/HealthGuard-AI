def assess_insurance(age, risk_level, emergency, condition_name="Unknown"):
    """
    Assess insurance eligibility and guidance based on condition type.
    """
    ACUTE_CONDITIONS = [
        "Common Cold", "Flu", "Influenza", "Viral Infection", "Headache", 
        "Fever", "Acute Gastritis", "Minor Injury", "General Symptoms"
    ]
    
    is_acute = any(acute.lower() in condition_name.lower() for acute in ACUTE_CONDITIONS)
    
    if is_acute:
        eligibility = "Ineligible"
        reason = "Acute/Minor condition"
    else:
        eligibility = "Eligible"
        reason = "Potential Chronic or Serious condition"

    if emergency:
        claim_type = "Emergency"
        guidance = [
            "Contact emergency services immediately.",
            "Inform insurance provider about the emergency.",
            "Submit claim with medical reports and bills."
        ]
    elif risk_level == "High" or risk_level == "Critical":
        claim_type = "Hospitalization"
        guidance = [
            "Visit a hospital for check-up.",
            "Keep all medical records.",
            "File hospitalization claim with insurance."
        ]
    else:
        claim_type = "OPD"
        guidance = [
            "Consult a general physician.",
            "Collect prescription and bills.",
            "Submit OPD claim."
        ]
    
    if eligibility == "Ineligible":
        guidance = ["Insurance claims are typically not applicable for acute/minor illnesses.", "Consult your policy for OPD coverage details."]
    
    if (age < 18 or age > 65) and eligibility == "Eligible":
        guidance.append("Check for senior/child specific coverage.")
    
    return eligibility, claim_type, guidance, reason

def get_otc_suggestions(symptoms, age, condition="Unknown"):
    """
    Returns condition-aware OTC medicine suggestions and supportive care.
    """
    suggestions = []
    age_category = "Adult" if age >= 12 else "Child"
    symptoms_lower = [s.lower() for s in symptoms]
    condition_lower = condition.lower()

    # 1. Condition-Specific Guidance (Priority)
    if "dengue" in condition_lower:
        suggestions.append({
            "name": "Paracetamol 500mg-650mg (Acetaminophen)",
            "purpose": "Fever and severe body ache relief",
            "dosage": "1 tablet every 6 hours. Do not exceed 4g/day. AVOID Aspirin/Ibuprofen/NSAIDs."
        })
        suggestions.append({
            "name": "Hydration Support (ORS)",
            "purpose": "Maintain fluid balance and prevent dehydration",
            "dosage": "Consume 2-3 liters of fluids (ORS, coconut water, juice) spread throughout the day."
        })
    elif "malaria" in condition_lower or "typhoid" in condition_lower:
        suggestions.append({
            "name": "Paracetamol 500mg (Dolo/Crocin)",
            "purpose": "Manage high-grade fever",
            "dosage": "1 tablet every 4-6 hours if temperature >100°F."
        })
        suggestions.append({
            "name": "ORS & Nutrient-Rich Fluids",
            "purpose": "Electrolyte balance and energy",
            "dosage": "Sip ORS frequently. Stick to a light, easily digestible diet (porridge, soup)."
        })
    elif "covid" in condition_lower or "influenza" in condition_lower:
        suggestions.append({
            "name": "Paracetamol 500mg & Vitamin C",
            "purpose": "Fever relief and immunity",
            "dosage": "Paracetamol: 1 tab 4 times/day. Vit C (500mg): 1 tab daily."
        })
        suggestions.append({
            "name": "Respiratory Supportive Care",
            "purpose": "Clear nasal passages",
            "dosage": "Warm saline gargles 3 times a day. Steam inhalation twice daily."
        })
    elif "cold" in condition_lower or "sinus" in condition_lower or "rhinitis" in condition_lower:
        suggestions.append({
            "name": "Cetirizine 10mg or Phenylephrine",
            "purpose": "Nasal congestion and runny nose relief",
            "dosage": "Cetirizine: 1 tablet at night. Phenylephrine: As per package instruction."
        })
    elif "migraine" in condition_lower or "headache" in condition_lower:
        suggestions.append({
            "name": "Naproxen or Paracetamol/Caffeine",
            "purpose": "Severe headache relief",
            "dosage": "Follow package instructions. Rest in a dark, quiet room."
        })
    elif "gerd" in condition_lower or "reflux" in condition_lower or "gastritis" in condition_lower:
        suggestions.append({
            "name": "Antacid (Magnesium/Aluminum Hydroxide)",
            "purpose": "Heartburn and acidity relief",
            "dosage": "2 teaspoons or 1-2 chewable tablets after meals or at bedtime."
        })

    # 2. Symptom-Based Logic (Augmentation)
    if any(s in symptoms_lower for s in ['fever', 'chills', 'body ache', 'headache']) and not any("Paracetamol" in d["name"] for d in suggestions):
        if age_category == "Child":
            suggestions.append({
                "name": "Paracetamol Syrup (Pediatric)",
                "purpose": "Fever and pain relief",
                "dosage": "10-15mg/kg every 6 hours. Max 4 doses in 24h."
            })
        else:
            suggestions.append({
                "name": "Paracetamol (Acetaminophen) 500mg",
                "purpose": "Fever and ache relief",
                "dosage": "1-2 tablets every 6 hours. Max 4000mg per day."
            })
                 
    if any(s in symptoms_lower for s in ['cough', 'dry cough']) and not any("Cough" in d["purpose"] for d in suggestions):
        if age_category == "Child":
            suggestions.append({
                "name": "Honey-based Soothing Syrup",
                "purpose": "Throat relief (Avoid for <1y)",
                "dosage": "5ml as needed for throat comfort."
            })
        else:
            suggestions.append({
                "name": "Dextromethorphan (OTC Suppressant)",
                "purpose": "Dry cough relief",
                "dosage": "10ml every 8-12 hours."
            })

    if any(s in symptoms_lower for s in ['nausea', 'vomiting', 'stomach ache', 'diarrhea']) and not any("ORS" in d["name"] for d in suggestions):
         suggestions.append({
            "name": "Oral Rehydration Salts (ORS)",
            "purpose": "Prevent dehydration",
            "dosage": "Mix 1 sachet in 1L clean water. Sip frequently."
         })

    # 3. Always provide General Supportive Care
    suggestions.append({
        "name": "General Supportive Care",
        "purpose": "Optimal Recovery",
        "dosage": "Complete bed rest. Drink at least 3 liters of water daily. Monitor symptoms closely."
    })
    
    disclaimer = "⚠️ MEDICAL DISCLAIMER: These are general Over-The-Counter (OTC) suggestions. They are NOT a prescription. Consult a physician before consuming any medication."
    
    return {
        "suggestions": suggestions,
        "disclaimer": disclaimer
    }
