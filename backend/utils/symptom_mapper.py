"""
Local Symptom Mapper — HealthGuard Tier 3 Diagnostic Engine
Provides deterministic, symptom-aware fallback when AI APIs are unavailable.
Maps symptom IDs (s1–s52) from the frontend to clinical conditions.

Symptom ID Reference:
  s1=Fever, s2=Fatigue, s3=Chills, s4=Weight Loss, s5=Night Sweats,
  s6=Loss of Appetite, s7=Body Aches, s8=Swollen Glands, s9=Cough,
  s10=Shortness of Breath, s11=Sore Throat, s12=Runny Nose, s13=Sneezing,
  s14=Wheezing, s15=Chest Tightness, s16=Nasal Congestion, s17=Headache,
  s18=Dizziness, s19=Blurred Vision, s20=Numbness, s21=Confusion,
  s22=Tremors, s23=Memory Problems, s24=Seizures, s25=Chest Pain,
  s26=Palpitations, s27=Irregular Heartbeat, s28=Swollen Legs,
  s29=High Blood Pressure, s30=Fainting, s31=Nausea, s33=Diarrhea,
  s34=Constipation, s35=Abdominal Pain, s36=Bloating, s37=Heartburn,
  s38=Blood in Stool, s39=Joint Pain, s40=Muscle Weakness, s41=Back Pain,
  s42=Stiffness, s43=Swollen Joints, s44=Rash, s45=Itching, s46=Hives,
  s47=Yellowing Skin, s48=Dry Skin, s49=Anxiety, s50=Depression,
  s51=Insomnia, s52=Mood Swings
"""

SYMPTOM_CONDITION_MAP = [

    # ── CRITICAL / EMERGENCY ────────────────────────────────────────────
    {
        "condition": "Cardiac Event (Suspected Angina / MI)",
        "triggers": ["s25", "s26", "s10", "s15", "s30"],
        "required": ["s25"],  # chest pain must be present
        "min_triggers": 2,
        "risk": "Critical",
        "emergency": True,
    },
    {
        "condition": "Hypertensive Crisis",
        "triggers": ["s29", "s17", "s25", "s21", "s19"],
        "required": ["s29"],  # high blood pressure must be present
        "min_triggers": 2,
        "risk": "Critical",
        "emergency": True,
    },
    {
        "condition": "Stroke (Suspected)",
        "triggers": ["s20", "s21", "s19", "s22", "s30"],
        "required": [],
        "min_triggers": 2,
        "risk": "Critical",
        "emergency": True,
    },
    {
        "condition": "Anaphylaxis (Severe Allergic Reaction)",
        "triggers": ["s46", "s44", "s10", "s14", "s45"],
        "required": ["s10"],  # breathing difficulty must be present
        "min_triggers": 2,
        "risk": "Critical",
        "emergency": True,
    },
    {
        "condition": "Sepsis / Severe Systemic Infection",
        "triggers": ["s1", "s21", "s2", "s18", "s3", "s10"],
        "required": ["s1", "s21"],  # fever + confusion required
        "min_triggers": 3,
        "risk": "Critical",
        "emergency": True,
    },
    {
        "condition": "Epileptic Seizure",
        "triggers": ["s24"],
        "required": ["s24"],
        "min_triggers": 1,
        "risk": "Critical",
        "emergency": True,
    },

    # ── HIGH RISK ────────────────────────────────────────────────────────
    {
        "condition": "Acute Asthma / COPD Exacerbation",
        "triggers": ["s10", "s14", "s15", "s9", "s2"],
        "required": ["s10"],  # breathing difficulty required
        "min_triggers": 2,
        "risk": "High",
        "emergency": False,
    },
    {
        "condition": "Pneumonia",
        "triggers": ["s9", "s10", "s1", "s15", "s3", "s2"],
        "required": [],
        "min_triggers": 3,
        "risk": "High",
        "emergency": False,
    },
    {
        "condition": "Heat Stroke / Heat Exhaustion",
        "triggers": ["s1", "s18", "s21", "s2", "s31", "s17"],
        "required": ["s1"],  # fever required
        "min_triggers": 3,
        "risk": "High",
        "emergency": True,
    },
    {
        "condition": "Arrhythmia / Irregular Heart Rhythm",
        "triggers": ["s26", "s27", "s18", "s30", "s25"],
        "required": ["s26"],  # palpitations required
        "min_triggers": 2,
        "risk": "High",
        "emergency": False,
    },
    {
        "condition": "Acute Appendicitis",
        "triggers": ["s35", "s1", "s31", "s6"],
        "required": ["s35", "s1"],  # abdominal pain + fever required
        "min_triggers": 3,
        "risk": "High",
        "emergency": True,
    },
    {
        "condition": "Gastrointestinal Bleeding",
        "triggers": ["s38", "s35", "s18", "s2"],
        "required": ["s38"],  # blood in stool must be present
        "min_triggers": 1,
        "risk": "High",
        "emergency": True,
    },
    {
        "condition": "Jaundice / Liver Disease",
        "triggers": ["s47", "s6", "s2", "s35", "s31"],
        "required": ["s47"],  # yellowing skin must be present
        "min_triggers": 1,
        "risk": "High",
        "emergency": False,
    },
    {
        "condition": "Severe Dehydration",
        "triggers": ["s33", "s31", "s18", "s2", "s1"],
        "required": ["s33"],  # diarrhea required
        "min_triggers": 3,
        "risk": "High",
        "emergency": False,
    },

    # ── MEDIUM RISK ──────────────────────────────────────────────────────
    {
        "condition": "Dengue / Viral Haemorrhagic Fever",
        "triggers": ["s1", "s39", "s7", "s44", "s17", "s2"],
        "required": ["s1"],
        "min_triggers": 3,
        "risk": "Medium",
        "emergency": False,
    },
    {
        "condition": "COVID-19 / Influenza",
        "triggers": ["s1", "s9", "s2", "s11", "s7", "s3"],
        "required": [],
        "min_triggers": 3,
        "risk": "Medium",
        "emergency": False,
    },
    {
        "condition": "Typhoid Fever",
        "triggers": ["s1", "s6", "s2", "s35", "s4"],
        "required": ["s1"],
        "min_triggers": 3,
        "risk": "Medium",
        "emergency": False,
    },
    {
        "condition": "Urinary Tract Infection (UTI)",
        "triggers": ["s1", "s3", "s35", "s2"],
        "required": [],
        "min_triggers": 2,
        "risk": "Medium",
        "emergency": False,
    },
    {
        "condition": "Food Poisoning / Gastroenteritis",
        "triggers": ["s31", "s33", "s35", "s36", "s1"],
        "required": [],
        "min_triggers": 2,
        "risk": "Medium",
        "emergency": False,
    },
    {
        "condition": "Migraine",
        "triggers": ["s17", "s19", "s31", "s18", "s2"],
        "required": ["s17"],
        "min_triggers": 2,
        "risk": "Medium",
        "emergency": False,
    },
    {
        "condition": "Rheumatoid Arthritis / Inflammatory Joint Disease",
        "triggers": ["s39", "s43", "s42", "s40", "s7"],
        "required": ["s39"],
        "min_triggers": 2,
        "risk": "Medium",
        "emergency": False,
    },
    {
        "condition": "Diabetes / Hyperglycaemia",
        "triggers": ["s2", "s4", "s19", "s20", "s18"],
        "required": [],
        "min_triggers": 3,
        "risk": "Medium",
        "emergency": False,
    },
    {
        "condition": "Hypothyroidism",
        "triggers": ["s2", "s4", "s42", "s48", "s50"],
        "required": [],
        "min_triggers": 3,
        "risk": "Medium",
        "emergency": False,
    },
    {
        "condition": "Anxiety / Panic Disorder",
        "triggers": ["s49", "s26", "s10", "s18", "s51", "s52"],
        "required": ["s49"],
        "min_triggers": 2,
        "risk": "Medium",
        "emergency": False,
    },
    {
        "condition": "Anaemia",
        "triggers": ["s2", "s18", "s40", "s10", "s30"],
        "required": [],
        "min_triggers": 3,
        "risk": "Medium",
        "emergency": False,
    },
    {
        "condition": "Peptic Ulcer / Gastritis",
        "triggers": ["s35", "s37", "s31", "s6"],
        "required": ["s37"],
        "min_triggers": 2,
        "risk": "Medium",
        "emergency": False,
    },
    {
        "condition": "Malaria",
        "triggers": ["s1", "s3", "s7", "s17", "s2", "s31"],
        "required": ["s1", "s3"],
        "min_triggers": 3,
        "risk": "Medium",
        "emergency": False,
    },

    # ── LOW RISK ─────────────────────────────────────────────────────────
    {
        "condition": "Common Cold",
        "triggers": ["s12", "s11", "s13", "s9", "s16", "s17"],
        "required": [],
        "min_triggers": 2,
        "risk": "Low",
        "emergency": False,
    },
    {
        "condition": "Acute Sinusitis",
        "triggers": ["s17", "s16", "s12", "s11", "s9"],
        "required": ["s16"],
        "min_triggers": 2,
        "risk": "Low",
        "emergency": False,
    },
    {
        "condition": "Seasonal Allergies / Allergic Rhinitis",
        "triggers": ["s13", "s12", "s45", "s16", "s44"],
        "required": [],
        "min_triggers": 2,
        "risk": "Low",
        "emergency": False,
    },
    {
        "condition": "Contact Dermatitis / Skin Allergy",
        "triggers": ["s44", "s45", "s46", "s48"],
        "required": [],
        "min_triggers": 2,
        "risk": "Low",
        "emergency": False,
    },
    {
        "condition": "Musculoskeletal Pain / Muscle Strain",
        "triggers": ["s41", "s42", "s40", "s7", "s39"],
        "required": [],
        "min_triggers": 2,
        "risk": "Low",
        "emergency": False,
    },
    {
        "condition": "Acid Reflux / GERD",
        "triggers": ["s37", "s35", "s31", "s9"],
        "required": ["s37"],
        "min_triggers": 2,
        "risk": "Low",
        "emergency": False,
    },
    {
        "condition": "Irritable Bowel Syndrome (IBS)",
        "triggers": ["s34", "s36", "s35", "s33"],
        "required": [],
        "min_triggers": 2,
        "risk": "Low",
        "emergency": False,
    },
    {
        "condition": "Stress / Burnout",
        "triggers": ["s51", "s49", "s17", "s2", "s52"],
        "required": [],
        "min_triggers": 3,
        "risk": "Low",
        "emergency": False,
    },
    {
        "condition": "Depression",
        "triggers": ["s50", "s2", "s51", "s6", "s4"],
        "required": ["s50"],
        "min_triggers": 2,
        "risk": "Low",
        "emergency": False,
    },
    {
        "condition": "Bronchitis",
        "triggers": ["s9", "s15", "s11", "s2"],
        "required": ["s9"],
        "min_triggers": 2,
        "risk": "Low",
        "emergency": False,
    },

    # ── SINGLE-SYMPTOM FALLBACKS (isolated presentations) ────────────────
    {
        "condition": "Fever — Cause Undetermined (Medical Consult Required)",
        "triggers": ["s1"],
        "required": ["s1"],
        "min_triggers": 1,
        "risk": "Low",
        "emergency": False,
    },
    {
        "condition": "Tension Headache",
        "triggers": ["s17"],
        "required": ["s17"],
        "min_triggers": 1,
        "risk": "Low",
        "emergency": False,
    },
    {
        "condition": "Acute Cough (Likely Viral / Irritant)",
        "triggers": ["s9"],
        "required": ["s9"],
        "min_triggers": 1,
        "risk": "Low",
        "emergency": False,
    },
    {
        "condition": "Generalised Fatigue (Cause Undetermined)",
        "triggers": ["s2"],
        "required": ["s2"],
        "min_triggers": 1,
        "risk": "Low",
        "emergency": False,
    },
    {
        "condition": "Abdominal Discomfort (Medical Consult Recommended)",
        "triggers": ["s35"],
        "required": ["s35"],
        "min_triggers": 1,
        "risk": "Low",
        "emergency": False,
    },
    {
        "condition": "Dizziness — Cause Undetermined",
        "triggers": ["s18"],
        "required": ["s18"],
        "min_triggers": 1,
        "risk": "Low",
        "emergency": False,
    },
    {
        "condition": "Sore Throat / Pharyngitis",
        "triggers": ["s11"],
        "required": ["s11"],
        "min_triggers": 1,
        "risk": "Low",
        "emergency": False,
    },
    {
        "condition": "Joint Pain — Cause Undetermined",
        "triggers": ["s39"],
        "required": ["s39"],
        "min_triggers": 1,
        "risk": "Low",
        "emergency": False,
    },
    {
        "condition": "Skin Rash — Cause Undetermined",
        "triggers": ["s44"],
        "required": ["s44"],
        "min_triggers": 1,
        "risk": "Low",
        "emergency": False,
    },
    {
        "condition": "Back Pain",
        "triggers": ["s41"],
        "required": ["s41"],
        "min_triggers": 1,
        "risk": "Low",
        "emergency": False,
    },
    {
        "condition": "Nausea — Cause Undetermined",
        "triggers": ["s31"],
        "required": ["s31"],
        "min_triggers": 1,
        "risk": "Low",
        "emergency": False,
    },
    {
        "condition": "Shortness of Breath — Medical Evaluation Required",
        "triggers": ["s10"],
        "required": ["s10"],
        "min_triggers": 1,
        "risk": "Low",
        "emergency": False,
    },
    {
        "condition": "Anxiety / Emotional Distress",
        "triggers": ["s49"],
        "required": ["s49"],
        "min_triggers": 1,
        "risk": "Low",
        "emergency": False,
    },
    {
        "condition": "Heartburn / Acid Reflux (Mild)",
        "triggers": ["s37"],
        "required": ["s37"],
        "min_triggers": 1,
        "risk": "Low",
        "emergency": False,
    },
    {
        "condition": "Rash / Skin Irritation",
        "triggers": ["s44"],
        "required": ["s44"],
        "min_triggers": 1,
        "risk": "Low",
        "emergency": False,
    },
    {
        "condition": "Insomnia / Sleep Disturbance",
        "triggers": ["s51"],
        "required": ["s51"],
        "min_triggers": 1,
        "risk": "Low",
        "emergency": False,
    },
]


def map_symptoms_to_condition(symptoms):
    """
    symptoms: list of strings — symptom IDs from frontend (e.g. ['s1', 's9'])
    Returns: dict with conditions list, or None if no match.
    """
    if not symptoms:
        return None

    normalized = set(s.lower().strip() for s in symptoms)

    risk_weight = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1}
    matches = []

    for entry in SYMPTOM_CONDITION_MAP:
        # Check required symptoms first
        required = entry.get("required", [])
        if required and not all(r in normalized for r in required):
            continue

        match_count = sum(1 for t in entry["triggers"] if t in normalized)

        if match_count >= entry["min_triggers"]:
            base_confidence = 0.65
            extra = min(match_count - entry["min_triggers"], 6)
            confidence = round(min(base_confidence + (extra * 0.05), 0.95), 2)

            matches.append({
                "condition": entry["condition"],
                "confidence": confidence,
                "risk": entry["risk"],
                "emergency": entry["emergency"],
                "match_count": match_count,
                "risk_weight": risk_weight.get(entry["risk"], 1),
            })

    if not matches:
        return None

    # Sort: most specific match first (match_count), then by risk severity for tiebreaks
    matches.sort(
        key=lambda x: (x["match_count"], x["risk_weight"]),
        reverse=True
    )

    # Return top 3 unique conditions
    seen = set()
    results = []
    for m in matches:
        if m["condition"] not in seen:
            seen.add(m["condition"])
            results.append({
                "condition": m["condition"],
                "confidence": m["confidence"],
                "risk": m["risk"],
                "emergency": m["emergency"]
            })
        if len(results) == 3:
            break

    return {
        "success": True,
        "conditions": results,
        "source": "local_mapper",
        "fallback": True
    }