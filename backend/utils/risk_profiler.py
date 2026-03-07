def detect_emergency(symptoms):
    """
    Detect emergency conditions based on symptoms.
    """
    emergency_symptoms = [
        ['chest_pain', 'sweating'],
        ['chest_pain', 'shortness_of_breath'],
        ['shortness_of_breath', 'sweating'],
        ['fever', 'shortness_of_breath', 'fatigue']
    ]
    
    for combo in emergency_symptoms:
        if all(sym in symptoms for sym in combo):
            return True
    return False

def calculate_risk(symptoms, severity, duration):
    """
    Calculate deterministic risk score and level.
    """
    base_score = len(symptoms) * 5 + severity * 10 + duration * 2
    is_emerg = detect_emergency(symptoms)
    
    if is_emerg:
        base_score += 50
        level = "Critical"
    elif severity >= 4:
        level = "High"
    elif severity == 3:
        level = "Medium"
    else:
        level = "Low"
        
    risk_score = min(base_score, 100)
    return risk_score, level
