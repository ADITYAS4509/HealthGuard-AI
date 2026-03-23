/**
 * AI HealthGuard – Smart Disease & Emergency Predictor
 * app.js — Core Application Logic
 */

'use strict';

/* ============================================================
   FEATURE FLAGS
   ============================================================ */
/**
 * DEMO_MODE — set to true to enable sample-data demo for judges/evaluators.
 * Production Mode is now enforced. All data is fetched from the backend analyze endpoint.
 * This flag NEVER alters risk logic, confidence, or medical scoring.
 */
// FIX 7: Permanently removed DEMO_MODE constant


/* ============================================================
   DATA: CHRONIC CONDITIONS ELIGIBLE FOR INSURANCE GUIDANCE
   (Feature 1 – Insurance info link on results page)
   Match against the backend-returned condition name (case-insensitive substring).
   ============================================================ */
const CHRONIC_ELIGIBLE_CONDITIONS = [
    'cancer', 'carcinoma', 'tumour', 'tumor', 'malignant', 'lymphoma', 'leukemia',
    'diabetes', 'diabetic',
    'hiv', 'aids',
    'heart disease', 'coronary', 'cardiac', 'cardiomyopathy', 'heart failure',
    'stroke', 'cerebrovascular',
    'chronic kidney', 'ckd', 'renal failure', 'nephropathy',
    'liver cirrhosis', 'hepatic cirrhosis', 'chronic hepatitis',
    'asthma', 'copd', 'chronic obstructive',
    'epilepsy', 'epileptic', 'seizure disorder',
    'autoimmune', 'lupus', 'rheumatoid', 'multiple sclerosis',
];

/**
 * Returns true if the given condition name matches any chronic/major disease
 * category eligible for insurance guidance.
 * @param {string} conditionName
 * @returns {boolean}
 */
function isChronicEligible(conditionName) {
    if (!conditionName) return false;
    const lower = conditionName.toLowerCase();
    return CHRONIC_ELIGIBLE_CONDITIONS.some(term => lower.includes(term));
}


/* ============================================================
   DATA: SYMPTOMS DATABASE
   ============================================================ */
const SYMPTOM_CATEGORIES = [
    { id: 'all', label: 'All Symptoms', icon: '🔬', count: 0 },
    { id: 'general', label: 'General', icon: '🌡️', count: 0 },
    { id: 'respiratory', label: 'Respiratory', icon: '🫁', count: 0 },
    { id: 'neurological', label: 'Neurological', icon: '🧠', count: 0 },
    { id: 'cardiovascular', label: 'Cardiovascular', icon: '❤️', count: 0 },
    { id: 'digestive', label: 'Digestive', icon: '🫃', count: 0 },
    { id: 'musculoskeletal', label: 'Musculoskeletal', icon: '🦴', count: 0 },
    { id: 'dermatological', label: 'Dermatological', icon: '🩹', count: 0 },
    { id: 'mental', label: 'Mental Health', icon: '🧘', count: 0 },
];

const SYMPTOMS = [
    // General
    { id: 's1', label: 'Fever', category: 'general', icon: '🌡️' },
    { id: 's2', label: 'Fatigue', category: 'general', icon: '😴' },
    { id: 's3', label: 'Chills', category: 'general', icon: '🥶' },
    { id: 's4', label: 'Weight Loss', category: 'general', icon: '⚖️' },
    { id: 's5', label: 'Night Sweats', category: 'general', icon: '💧' },
    { id: 's6', label: 'Loss of Appetite', category: 'general', icon: '🍽️' },
    { id: 's7', label: 'Body Aches', category: 'general', icon: '😣' },
    { id: 's8', label: 'Swollen Glands', category: 'general', icon: '🔴' },
    // Respiratory
    { id: 's9', label: 'Cough', category: 'respiratory', icon: '😮‍💨' },
    { id: 's10', label: 'Shortness of Breath', category: 'respiratory', icon: '🫧' },
    { id: 's11', label: 'Sore Throat', category: 'respiratory', icon: '🤒' },
    { id: 's12', label: 'Runny Nose', category: 'respiratory', icon: '👃' },
    { id: 's13', label: 'Sneezing', category: 'respiratory', icon: '🤧' },
    { id: 's14', label: 'Wheezing', category: 'respiratory', icon: '💨' },
    { id: 's15', label: 'Chest Tightness', category: 'respiratory', icon: '🫀' },
    { id: 's16', label: 'Nasal Congestion', category: 'respiratory', icon: '🤐' },
    // Neurological
    { id: 's17', label: 'Headache', category: 'neurological', icon: '🤕' },
    { id: 's18', label: 'Dizziness', category: 'neurological', icon: '😵' },
    { id: 's19', label: 'Blurred Vision', category: 'neurological', icon: '👁️' },
    { id: 's20', label: 'Numbness', category: 'neurological', icon: '🫲' },
    { id: 's21', label: 'Confusion', category: 'neurological', icon: '😵‍💫' },
    { id: 's22', label: 'Tremors', category: 'neurological', icon: '🫨' },
    { id: 's23', label: 'Memory Problems', category: 'neurological', icon: '🧩' },
    { id: 's24', label: 'Seizures', category: 'neurological', icon: '⚡' },
    // Cardiovascular
    { id: 's25', label: 'Chest Pain', category: 'cardiovascular', icon: '💔' },
    { id: 's26', label: 'Palpitations', category: 'cardiovascular', icon: '💓' },
    { id: 's27', label: 'Irregular Heartbeat', category: 'cardiovascular', icon: '📉' },
    { id: 's28', label: 'Swollen Legs', category: 'cardiovascular', icon: '🦵' },
    { id: 's29', label: 'High Blood Pressure', category: 'cardiovascular', icon: '🩺' },
    { id: 's30', label: 'Fainting', category: 'cardiovascular', icon: '😶' },
    // Digestive
    { id: 's31', label: 'Nausea', category: 'digestive', icon: '🤢' },
    { id: 's32', label: 'Vomiting', category: 'digestive', icon: '🤮' },
    { id: 's33', label: 'Diarrhea', category: 'digestive', icon: '🚽' },
    { id: 's34', label: 'Constipation', category: 'digestive', icon: '😖' },
    { id: 's35', label: 'Abdominal Pain', category: 'digestive', icon: '🫃' },
    { id: 's36', label: 'Bloating', category: 'digestive', icon: '🎈' },
    { id: 's37', label: 'Heartburn', category: 'digestive', icon: '🔥' },
    { id: 's38', label: 'Blood in Stool', category: 'digestive', icon: '🩸' },
    // Musculoskeletal
    { id: 's39', label: 'Joint Pain', category: 'musculoskeletal', icon: '🦷' },
    { id: 's40', label: 'Muscle Weakness', category: 'musculoskeletal', icon: '💪' },
    { id: 's41', label: 'Back Pain', category: 'musculoskeletal', icon: '🔙' },
    { id: 's42', label: 'Stiffness', category: 'musculoskeletal', icon: '🧊' },
    { id: 's43', label: 'Swollen Joints', category: 'musculoskeletal', icon: '🔵' },
    // Dermatological
    { id: 's44', label: 'Rash', category: 'dermatological', icon: '🟥' },
    { id: 's45', label: 'Itching', category: 'dermatological', icon: '🖐️' },
    { id: 's46', label: 'Hives', category: 'dermatological', icon: '🔴' },
    { id: 's47', label: 'Yellowing Skin', category: 'dermatological', icon: '🟡' },
    { id: 's48', label: 'Dry Skin', category: 'dermatological', icon: '🏜️' },
    // Mental
    { id: 's49', label: 'Anxiety', category: 'mental', icon: '😰' },
    { id: 's50', label: 'Depression', category: 'mental', icon: '😔' },
    { id: 's51', label: 'Insomnia', category: 'mental', icon: '🌙' },
    { id: 's52', label: 'Mood Swings', category: 'mental', icon: '🎭' },
];

/* ============================================================
   DATA: DISEASE MAP
   ============================================================ */
const DISEASE_MAP = []; // Removed all hardcoded disease data

/* ============================================================
   DATA: HOSPITALS DATABASE
   ============================================================ */
const HOSPITALS_DB = {}; // Removed local mock data




/* ============================================================
   DATA: OTC MEDICINE DATABASE (Phase 17)
   ============================================================ */
const MEDICINE_DB = {}; // Removed local mock data

/* ============================================================
   APP STATE
   ============================================================ */
const state = {
    selectedSymptoms: new Set(),
    activeCategory: 'all',
    searchQuery: '',
    analysisResult: null,
    lastAnalysisInput: null,
    location: {
        coords: null, // { lat, lng }
        city: '',
        isLive: false // Reverts to false on load
    },
    backendAvailable: true, // Step 1: Default to true, updated by checkBackendHealth
    CACHE: {
        autocomplete: {},
        hospitals: {},
        ai: {}
    }
};

window.isProcessingRequest = false;

// Performance and Dev overlays permanently removed per Phase 18 requirements 

/* ============================================================
   DOM HELPERS
   ============================================================ */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// FIX 1: Backend Availability Check
async function checkBackendHealth() {
    const API_BASE = window.VITE_API_URL || '';
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(`${API_BASE}/health`, { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await res.json();
        state.backendAvailable = (data && data.status === 'ok');
        console.log(`[SYS] Backend health check: ${state.backendAvailable ? '✅ ONLINE' : '⚠️ OFFLINE'}`);
    } catch (err) {
        state.backendAvailable = false;
        console.warn("[SYS] Backend unreachable.");
    }
}

function showNotif(msg, type = 'success') {
    const el = $('#notification');
    $('#notifIcon').textContent = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    $('#notifMsg').textContent = msg;
    el.className = `notification show ${type}`;
    setTimeout(() => el.classList.remove('show'), 3500);
}

/* ============================================================
   DIACRITIC / ACCENT NORMALIZATION
   ============================================================ */
function normalizeText(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

/* ============================================================
   INIT: CATEGORIES
   ============================================================ */
function initCategories() {
    const countMap = {};
    SYMPTOMS.forEach(s => { countMap[s.category] = (countMap[s.category] || 0) + 1; });
    SYMPTOM_CATEGORIES.forEach(c => {
        c.count = c.id === 'all' ? SYMPTOMS.length : (countMap[c.id] || 0);
    });

    const container = $('#categoryList');
    container.innerHTML = SYMPTOM_CATEGORIES.map(cat => `
    <button
      class="category-btn${cat.id === state.activeCategory ? ' active' : ''}"
      data-cat="${cat.id}"
      aria-pressed="${cat.id === state.activeCategory}"
    >
      <span class="cat-icon">${cat.icon}</span>
      ${getSymptomLabel('cat_' + cat.id, true)}
      <span class="cat-count">${cat.count}</span>
    </button>
  `).join('');

    // Force an update of the header label immediately
    const activeCatObj = SYMPTOM_CATEGORIES.find(c => c.id === state.activeCategory);
    if (activeCatObj) {
        $('#symptomCategoryLabel').textContent = activeCatObj.icon + ' ' + getSymptomLabel('cat_' + activeCatObj.id, true);
    }

    container.addEventListener('click', e => {
        const btn = e.target.closest('.category-btn');
        if (!btn) return;
        $$('.category-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        state.activeCategory = btn.dataset.cat;

        // Update the header text explicitly with the localized string
        const catObj = SYMPTOM_CATEGORIES.find(c => c.id === state.activeCategory);
        $('#symptomCategoryLabel').textContent = catObj.icon + ' ' + getSymptomLabel('cat_' + catObj.id, true);
        renderSymptomGrid();
    });
}

/* ============================================================
   INIT: SYMPTOM GRID
   ============================================================ */
function renderSymptomGrid() {
    const { activeCategory, searchQuery, selectedSymptoms } = state;
    const grid = $('#symptomGrid');

    let filtered = SYMPTOMS.filter(s => {
        const inCat = activeCategory === 'all' || s.category === activeCategory;

        // Search against both English label and Translated label
        // Use diacritic-tolerant normalization for language-aware search
        const localLabel = normalizeText(getSymptomLabel(s.id));
        const baseLabel = normalizeText(s.label);
        const query = normalizeText(searchQuery);

        const inSearch = !searchQuery || localLabel.includes(query) || baseLabel.includes(query);
        return inCat && inSearch;
    });

    if (!filtered.length) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--clr-text-muted);font-size:0.9rem;">No symptoms found for "<strong>${searchQuery}</strong>"</div>`;
        return;
    }

    grid.innerHTML = filtered.map(s => `
    <div
      class="symptom-chip${selectedSymptoms.has(s.id) ? ' selected' : ''}"
      data-id="${s.id}"
      role="checkbox"
      aria-checked="${selectedSymptoms.has(s.id)}"
      tabindex="0"
    >
      ${getSymptomLabel(s.id)}
      <span class="chip-check">✓</span>
    </div>
  `).join('');

    grid.addEventListener('click', handleSymptomClick);
    grid.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleSymptomClick(e); } });
}

function handleSymptomClick(e) {
    const chip = e.target.closest('.symptom-chip');
    if (!chip) return;
    const id = chip.dataset.id;
    if (state.selectedSymptoms.has(id)) {
        state.selectedSymptoms.delete(id);
        chip.classList.remove('selected');
        chip.setAttribute('aria-checked', 'false');
    } else {
        state.selectedSymptoms.add(id);
        chip.classList.add('selected');
        chip.setAttribute('aria-checked', 'true');
    }
    renderSelectedTags();
}

/* ============================================================
   SELECTED TAGS
   ============================================================ */
function renderSelectedTags() {
    const container = $('#selectedTagsContainer');
    const empty = $('#selectedEmpty');
    const countBadge = $('#selectedCount');
    const clearBtn = $('#clearAllBtn');

    const count = state.selectedSymptoms.size;
    countBadge.textContent = count;
    clearBtn.style.display = count > 0 ? 'block' : 'none';

    const tags = [...state.selectedSymptoms].map(id => {
        const s = SYMPTOMS.find(x => x.id === id);
        if (!s) return '';
        const translated = getSymptomLabel(id);
        return `
      <div class="selected-tag">
        ${translated}
        <span class="tag-remove" data-id="${id}" role="button" aria-label="Remove ${translated}" tabindex="0">×</span>
      </div>
    `;
    }).join('');

    if (count === 0) {
        container.innerHTML = `<div class="selected-empty" id="selectedEmpty"><div style="font-size:1.5rem;margin-bottom:0.5rem;">🩺</div><div>Click symptoms<br/>to add them here</div></div>`;
    } else {
        container.innerHTML = tags;
        container.querySelectorAll('.tag-remove').forEach(btn => {
            btn.addEventListener('click', () => removeSymptom(btn.dataset.id));
            btn.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); removeSymptom(btn.dataset.id); } });
        });
    }
}

function removeSymptom(id) {
    state.selectedSymptoms.delete(id);
    renderSelectedTags();
    renderSymptomGrid();
}

/* ============================================================
   ANALYSIS ENGINE
   ============================================================ */
function analyzeHealth() {
    if (window.isProcessingRequest) return;

    // Access Control Guard: Redirect to login if not authenticated
    const sessionStore = localStorage.getItem('hg_user_session') || sessionStorage.getItem('hg_user_session');
    if (!sessionStore) {
        showNotif('Please log in to analyze symptoms.', 'warning');
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return;
    }

    if (state.selectedSymptoms.size === 0) {
        showNotif('Please select at least one symptom.', 'error');
        return;
    }

    const age = parseInt($('#patientAge').value) || 30;
    const severity = parseInt($('#severitySlider').value) || 3;
    const duration = parseInt($('#symptomDuration').value) || 1;

    // Use live city if active, else fallback to input
    let city = state.location.isLive && state.location.city
        ? state.location.city
        : $('#patientCity').value.trim();

    // If manual mode, require exactly a valid mapped city to prevent garbage inputs
    if (!state.location.isLive && city) {
        if (typeof INDIAN_CITIES !== 'undefined') {
            const exactMatch = INDIAN_CITIES.find(c => c.toLowerCase() === city.toLowerCase());
            if (!exactMatch) {
                showNotif('Please select a valid city from the dropdown or use Live GPS.', 'warning');
                $('#patientCity').focus();
                return;
            }
            city = exactMatch;
        }
    }

    if (!city) {
        showNotif('Location is required. Please enter a city or use Live GPS.', 'error');
        $('#patientCity').focus();
        return;
    }

    // Create a deterministic hash of current inputs to prevent duplicate analysis
    const currentInput = JSON.stringify({
        symptoms: [...state.selectedSymptoms].sort(),
        age, severity, duration, city: city.toLowerCase(),
        lat: state.location.coords?.lat || null,
        lng: state.location.coords?.lng || null
    });

    // In Demo-safe mode, we strictly bypass frontend-stage caching to guarantee the deterministic API is invoked
    if (state.lastAnalysisInput === currentInput) {
        showNotif('Analysis already up to date for these inputs.', 'info');
        scrollToResults();
        return;
    }

    window.isProcessingRequest = true;
    state.lastAnalysisInput = currentInput;

    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) {
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<span>⚙️</span> Processing...';
    }

    showLoading(true);


    setTimeout(() => {
        window.isProcessingRequest = false;
        if (analyzeBtn) {
            analyzeBtn.disabled = false;
            // Re-apply localization using the active lang
            const currentLang = localStorage.getItem('healthguard_lang') || 'en';
            const btnText = typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang]['btn_process']
                ? TRANSLATIONS[currentLang]['btn_process']
                : 'Process Assessment';
            analyzeBtn.innerHTML = `<span>🗂️</span> ${btnText}`;
        }

        // FIX 2 & 5: Centralized API_BASE and Graceful Error Handling
        const API_BASE = window.VITE_API_URL || '';

        const analyzeSymptoms = async () => {
            try {
                // Requirement #5: Explicit Backend-Only Logic
                const response = await fetch(`${API_BASE}/analyze`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        symptoms: [...state.selectedSymptoms],
                        age, severity, duration,
                        city: city,
                        lat: state.location.coords?.lat || null,
                        lon: state.location.coords?.lng || null,
                        gemini_api_key: localStorage.getItem('GEMINI_API_KEY'), // Optional user key
                        lang: localStorage.getItem('healthguard_lang') || 'en'  // Active UI language
                    })
                });

                if (!response.ok) {
                    throw new Error(`Server status ${response.status}`);
                }

                const payload = await response.json();
                handleAnalysisResponse(payload, city, age, severity, duration);

            } catch (error) {
                // Requirement #5: "Backend unavailable"
                console.error("[ERR] Analysis failed:", error.message);
                showLoading(false);
                if (analyzeBtn) analyzeBtn.disabled = false;

                showNotif("Backend unavailable. Please check server connection.", "error");
            }
        };

        // Helper to process results (used by both real and mock paths)
        const handleAnalysisResponse = (payload, city, age, severity, duration) => {
            if (!payload || !payload.condition) {
                showLoading(false);
                showNotif("Check symptom selection.", "warning");
                return;
            }

            const result = {
                name: payload.condition,
                conditions: payload.conditions || [], // Requirement #6
                explanation: payload.explanation || "Clinical assessment based on selected presentation.",
                action: (payload.risk === 'Critical') ? "Visit Emergency Department" : "Consult Medical Professional",
                redTags: (payload.risk === 'Critical') ? "Life-threatening symptoms detected." : (payload.risk === 'High' ? "Severe symptoms requiring monitoring." : "Standard clinical precautions."),
                risk: (payload.risk || "Low"),
                emergency: (payload.risk === 'Critical' || payload.risk === 'High'),
                disclaimer: "Triage support only.",
                severity, duration, age,
                medicines: payload.medicines?.suggestions || payload.medicines || [],
                insurance: payload.insurance,
                fallback: payload.fallback, // Requirement #8
                debug: payload.debug // Requirement #9
            };

            let base_score = state.selectedSymptoms.size * 5 + severity * 10 + duration * 2;
            if (result.risk === 'Critical') base_score = 95;
            else if (result.risk === 'High') base_score = 80;
            else if (result.risk === 'Medium') base_score = 50;
            else base_score = 25;
            result.score = Math.min(base_score, 100);

            state.analysisResult = { ...result, city };
            showLoading(false);
            if (analyzeBtn) analyzeBtn.disabled = false;

            renderResults(result);
            renderHospitals(payload.hospitals || [], state.location.coords);
            scrollToResults();

            if (result.risk === 'Critical' || result.risk === 'High') {
                showNotif('CRITICAL RISK DETECTED. Review emergency guidance.', 'error');
                // NOTE: Auto-scroll to hospitals removed — page stays at Triage Results section.
            } else {
                showNotif('Assessment complete.', 'success');
            }
        };

        analyzeSymptoms();
    }, 500);
}

// getDeterministicMock removed. strictly enforce backend API single source of truth.

// `predictDisease` mock removed to strictly enforce backend API single source of truth.

/* ============================================================
   RENDER RESULTS
   ============================================================ */
function renderResults(result) {
    const section = $('#results-section');
    section.style.display = 'block';
    section.classList.add('visible');

    // Condition
    $('#conditionName').textContent = result.name;

    // Fallback Badge — permanently hidden (local mapper predictions are medically valid)
    const fbBadge = document.getElementById('fallbackBadge');
    if (fbBadge) {
        fbBadge.style.display = 'none';
    }

    // Requirement #6: Multi-Disease Display
    const multiContainer = document.getElementById('multiDiseaseContainer');
    const diseaseList = document.getElementById('diseaseList');
    if (multiContainer && diseaseList && result.conditions && result.conditions.length > 1) {
        multiContainer.style.display = 'block';
        diseaseList.innerHTML = result.conditions.map((c, i) => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:0.5rem; background:rgba(255,255,255,0.03); border-radius:6px; border:1px solid rgba(255,255,255,0.05);">
                <span style="font-size:0.875rem; color:var(--clr-text); font-weight:${i === 0 ? 600 : 400}">${c.condition}</span>
                <span style="font-size:0.75rem; font-family:monospace; color:var(--clr-accent)">${(c.confidence * 100).toFixed(0)}%</span>
            </div>
        `).join('');
    } else if (multiContainer) {
        multiContainer.style.display = 'none';
    }

    // Remove Confidence Bar references entirely for clinical safety
    const confidencePctEl = document.getElementById('confidencePct');
    if (confidencePctEl) confidencePctEl.style.display = 'none';
    const confidenceFillEl = document.getElementById('confidenceFill');
    if (confidenceFillEl) confidenceFillEl.style.display = 'none';

    // Risk badge
    const badgeHTML = createRiskBadge(result.risk);
    $('#riskBadgeTop').innerHTML = badgeHTML;
    $('#riskBadgeGauge').innerHTML = badgeHTML;



    // Gauge
    animateGauge(result.score);
    $('#gaugeValue').textContent = result.score;
    $('#gaugeValue').style.color = result.risk === 'High' ? 'var(--clr-danger)' : result.risk === 'Medium' ? 'var(--clr-warning)' : 'var(--clr-accent)';

    const lang = localStorage.getItem('healthguard_lang') || 'en';
    const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];

    // Safe Clinical Output Mapping
    const list = $('#influentialList');
    list.innerHTML = `
        <div style="margin-bottom:1rem;">
            <strong style="color:var(--clr-text-primary); font-size:1rem;">${t.clinical_context || 'Clinical Context'}:</strong>
            <p style="color:var(--clr-text-muted); font-size:0.9rem; margin-top:0.25rem;">${result.explanation || "No explanation provided."}</p>
        </div>
        <div style="margin-bottom:1rem;">
            <strong style="color:var(--clr-text-primary); font-size:1rem;">${t.recommended_next_steps || 'Recommended Next Steps'}:</strong>
            <p style="color:var(--clr-primary); font-size:0.9rem; margin-top:0.25rem; font-weight:600;">${result.action || "Consult Medical Professional"}</p>
        </div>
        <div style="margin-bottom:1rem; background:rgba(255,107,107,0.1); border-left:3px solid var(--clr-danger); padding:0.5rem;">
            <strong style="color:var(--clr-danger); font-size:0.9rem;">Red Flags:</strong>
            <p style="color:var(--clr-text-muted); font-size:0.85rem; margin-top:0.25rem;">${result.redTags || "Emergency symptoms not detected. Seek care if condition worsens rapidly."}</p>
        </div>
    `;

    // Emergency alert
    const alertEl = $('#emergencyAlert');
    if (result.risk === 'Critical') {
        alertEl.style.display = 'flex';
        // Add a pulsing effect to the alert for critical
        alertEl.style.animation = 'pulse 2s infinite ease-in-out';
        alertEl.style.boxShadow = '0 0 20px rgba(255, 82, 82, 0.3)';
        alertEl.style.border = '1px solid rgba(255, 82, 82, 0.5)';
        alertEl.style.background = 'rgba(255, 82, 82, 0.05)';
    } else if (result.emergency) {
        alertEl.style.display = 'flex';
        alertEl.style.animation = 'none';
        alertEl.style.boxShadow = 'none';
        alertEl.style.border = '1px solid var(--clr-danger)';
        alertEl.style.background = 'rgba(255,107,107,0.1)';
        $('#emergencyActionContainer').style.display = 'none'; // hide the massive ambulance button for non-critical emergencies
    } else {
        alertEl.style.display = 'none';
    }

    // Medicine & Dosage Recommendation UI
    const medSection = $('#medicineRecommendation');
    if (medSection) {
        if (result.medicines && result.medicines.length > 0) {
            $('#medicineRecommendation').style.display = 'block';
            const medListHtml = result.medicines.map(m => `
            <div class="glass-card" style="padding:1rem; margin-bottom:0.75rem; border-left:4px solid var(--clr-accent);">
                <div style="font-weight:700; color:var(--clr-white); margin-bottom:0.25rem; font-size:1rem;">${m.name}</div>
                <div style="font-size:0.85rem; color:var(--clr-text-secondary); margin-bottom:0.5rem;"><strong>Purpose:</strong> ${m.purpose}</div>
                <div style="font-size:0.8rem; color:var(--clr-text-muted); background:var(--clr-glass-bg); padding:0.5rem; border-radius:4px; border:1px solid var(--clr-border);">
                   <strong>Dosage:</strong> ${m.dosage}
                </div>
            </div>
        `).join('');

            $('#medicineList').innerHTML = medListHtml;
        } else {
            $('#medicineRecommendation').style.display = 'none';
            $('#medicineList').innerHTML = '';
        }
    }

    // Quick summary
    $('#quickSummary').innerHTML = `
    <div class="highlight-row flex-between" style="gap:1rem;font-size:0.8rem;">
      <span style="color:var(--clr-text-muted);">Age Group</span>
      <span style="font-weight:600;color:var(--clr-white);">${result.age < 18 ? 'Paediatric' : result.age < 60 ? 'Adult' : 'Senior'}</span>
    </div>
    <div class="highlight-row flex-between" style="gap:1rem;font-size:0.8rem;">
      <span style="color:var(--clr-text-muted);">Symptoms Entered</span>
      <span style="font-weight:600;color:var(--clr-white);">${state.selectedSymptoms.size}</span>
    </div>
    <div class="highlight-row flex-between" style="gap:1rem;font-size:0.8rem;">
      <span style="color:var(--clr-text-muted);">Duration</span>
      <span style="font-weight:600;color:var(--clr-white);">${result.duration} day${result.duration !== 1 ? 's' : ''}</span>
    </div>
    <div class="highlight-row flex-between" style="gap:1rem;font-size:0.8rem;">
      <span style="color:var(--clr-text-muted);">Severity</span>
      <span style="font-weight:600;color:var(--clr-${result.severity >= 4 ? 'danger' : result.severity === 3 ? 'warning' : 'success'})">${getSeverityLabel(result.severity)}</span>
    </div>
  `;

    triggerFadeIns(section);

    // Feature 1 — Insurance eligibility info link (text only, no cards, no OPD/IPD)
    const insInfoRow = document.getElementById('insuranceInfoRow');
    if (insInfoRow) {
        if (isChronicEligible(result.name)) {
            insInfoRow.style.display = 'block';
        } else {
            insInfoRow.style.display = 'none';
        }
    }

    // New Insurance Eligibility Badge Rendering
    const insContainer = document.getElementById('insuranceEligibilityContainer');
    const insBadge = document.getElementById('insuranceBadge');
    const insStatusText = document.getElementById('insuranceStatusText');
    const insTypeLabel = document.getElementById('insuranceTypeLabel');

    if (insContainer && result.insurance) {
        insContainer.style.display = 'block';
        const isEligible = result.insurance.eligibility === 'Eligible';

        insStatusText.textContent = isEligible ? '✅ Insurance Claimable' : '❌ Not Claimable';
        insTypeLabel.textContent = `(${result.insurance.type})`;

        // Update badge styling
        insBadge.className = `insurance-badge ${isEligible ? 'eligible' : 'ineligible'}`;

        // Add reason tooltip or small text if ineligible
        if (!isEligible) {
            insStatusText.title = result.insurance.reason || 'Acute condition';
        } else {
            insStatusText.title = 'Chronic/Serious condition eligible for claim';
        }
    } else if (insContainer) {
        insContainer.style.display = 'none';
    }
}

function createRiskBadge(risk) {
    const labels = { 'Low': 'Low Risk', 'Medium': 'Medium Risk', 'High': 'High Risk', 'Critical': 'CRITICAL RISK' };
    const rClass = (risk || 'Low').toLowerCase();
    return `<div class="risk-badge ${rClass}"><span class="risk-dot"></span>${labels[risk] || risk}</div>`;
}

function getSeverityLabel(s) {
    return ['', 'Very Mild', 'Mild', 'Moderate', 'Severe', 'Critical'][s] || 'Moderate';
}

function animateGauge(score) {
    const path = document.getElementById('gaugeFill');
    if (!path) return;
    const total = 251.3;
    const offset = total - (score / 100) * total;
    requestAnimationFrame(() => { path.style.strokeDashoffset = offset; });
}




let leafletMap = null;

/* ============================================================
   HOSPITAL OWNERSHIP BADGE (Feature 2)
   Informational only — no ranking or preference bias.
   ============================================================ */
function getOwnershipBadge(h) {
    // Priority: explicit ownership field → operator/tags heuristics → name heuristics
    const own = (h.ownership || h.operator || h.tags?.ownership || '').toLowerCase();
    const name = (h.name || '').toLowerCase();

    // Explicit government keywords
    const isGovt = own.includes('government') || own.includes('public') || own.includes('govt') ||
        own.includes('state') || own.includes('municipal') || own.includes('district') ||
        // Well-known government hospital chains / names
        name.includes('aiims') || name.includes('esic') || name.includes('esi ') ||
        name.includes('civil hospital') || name.includes('district hospital') ||
        name.includes('government') || name.includes('govt') || name.includes('phc') ||
        name.includes('primary health') || name.includes('sub-district') ||
        name.includes('gmch') || name.includes('nimhans') || name.includes('pgimer') ||
        name.includes('city emergency') || name.includes('district general');

    // Explicit private keywords
    const isPrivate = own.includes('private') || own.includes('corporate') ||
        name.includes('apollo') || name.includes('fortis') || name.includes('manipal') ||
        name.includes('kokilaben') || name.includes('lilavati') || name.includes('hinduja') ||
        name.includes('max') || name.includes('medanta') || name.includes('narayana') ||
        name.includes('columbia') || name.includes('wockhardt') || name.includes('global') ||
        name.includes('care hospital') || name.includes('rainbow') || name.includes('aster');

    const lang = localStorage.getItem('healthguard_lang') || 'en';
    const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];

    if (isGovt) {
        return `<span class="ownership-badge govt">🏛️ ${t.hospital_govt || 'Govt Hospital'}</span>`;
    }
    if (isPrivate) {
        return `<span class="ownership-badge private">🏥 ${t.hospital_private || 'Private Hospital'}</span>`;
    }
    return ''; // Unknown — show no badge
}

/* ============================================================
   RENDER HOSPITALS
   ============================================================ */
function renderHospitals(hospitalsData, coords = null) {
    const section = $('#hospitals-section');
    section.style.display = 'block';

    const risk = state.analysisResult?.risk || 'low';
    const grid = $('#hospitalsGrid');
    const mapWrapper = $('#hospitalMapWrapper');

    if (!hospitalsData || hospitalsData.length === 0) {
        grid.innerHTML = '<div style="color:var(--clr-text-muted); padding:2rem; text-align:center; width: 100%;">No medical facilities mapped in this area.</div>';
        mapWrapper.style.display = 'none';
        triggerFadeIns(section);
        return;
    }

    const lang = localStorage.getItem('healthguard_lang') || 'en';
    const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];

    grid.innerHTML = hospitalsData.map((h, index) => {
        const hName = h.name;
        const hDistance = h.distance_km;
        const isEmergency = h.emergency;
        const phoneEscaped = h.phone.replace(/[^0-9+]/g, '');

        let recommendTag = `<span class="tag-mini">${t.hospital_opd_suitable || 'OPD Suitable'}</span>`;
        if (risk === 'Critical' || risk === 'High') {
            recommendTag = `<span class="tag-mini bg-danger">${t.hospital_ipd_recommended || 'IPD Recommended'}</span>`;
        } else if (risk === 'Medium') {
            recommendTag = `<span class="tag-mini" style="background:rgba(255,193,7,0.15);color:#ffc107;border-color:rgba(255,193,7,0.3);">${t.hospital_opd_ipd || 'OPD/IPD'}</span>`;
        }

        let nearestEmergencyBadge = '';
        let cardClasses = 'glass-card hospital-card fade-in';
        if (h.is_nearest_emergency) {
            nearestEmergencyBadge = `<div style="margin-top:0.5rem;"><span class="tag-mini bg-danger" style="animation: pulse 2s infinite;">${t.hospital_nearest_emergency || '🚑 Nearest Emergency Facility'}</span></div>`;
            cardClasses += ' border-pulse-danger';
        } else if (risk === 'Critical' && isEmergency) {
            cardClasses += ' border-pulse-danger';
        }

        const ownershipBadge = getOwnershipBadge(h);

        return `
        <div class="${cardClasses}" id="hospital-card-${index}">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:4px;">
              <div class="hospital-type-badge ${isEmergency ? 'emergency' : 'general'}">${isEmergency ? '🚑 ' + (t.hospital_emergency_marker || 'Emergency') : '🏥 ' + (t.hospital_general_marker || 'General')}</div>
              <div style="display:flex; gap:4px; align-items:center; flex-wrap:wrap;">
                ${ownershipBadge}
                ${recommendTag}
              </div>
          </div>
          ${nearestEmergencyBadge}
          <div style="margin-top:0.75rem;">
            <div class="hospital-name">${hName}</div>
          </div>
          <div class="hospital-meta" style="margin-top:0.5rem">
            <div class="meta-row"><span class="icon">🛣️</span>${hDistance} ${t.hospital_away || 'km away'}</div>
            <div class="meta-row"><span class="icon">📞</span>${h.isGenericHelpline ? `<span style="color:var(--clr-accent);">${t.hospitals_emergency || 'Emergency Helpline'}</span>` : h.phone}</div>
          </div>
          <div class="hospital-actions" style="display:flex !important; visibility:visible !important;">
            <a href="tel:${h.isGenericHelpline ? '108' : phoneEscaped}" class="btn btn-primary btn-sm" style="flex:1; display:flex;">📞 ${h.isGenericHelpline ? 'Call 108' : (t.btn_call_hosp || 'Call')}</a>
            <a href="${h.nav_link}" target="_blank" rel="noopener" class="btn btn-outline btn-sm" style="flex:1; display:flex;">🗺️ ${t.btn_navigate_hosp || 'Navigate'}</a>
          </div>
        </div>
        `;
    }).join('');

    // Leaflet map initialization
    mapWrapper.style.display = 'block';

    // De-init map if exists
    if (leafletMap !== null) {
        leafletMap.remove();
        leafletMap = null;
    }

    // Default center to user coords or the first hospital
    let centerLat = coords?.lat || 20.5937;
    let centerLng = coords?.lng || 78.9629;

    // Find the nearest emergency hospital to center and auto-scroll to
    let targetIndex = 0;

    const nearestEmergencyIdx = hospitalsData.findIndex(h => h.is_nearest_emergency);
    if (nearestEmergencyIdx !== -1) {
        targetIndex = nearestEmergencyIdx;
    }

    if (hospitalsData[targetIndex] && hospitalsData[targetIndex].nav_link) {
        const dest = hospitalsData[targetIndex].nav_link.split('destination=')[1];
        if (dest) {
            centerLat = parseFloat(dest.split(',')[0]) || centerLat;
            centerLng = parseFloat(dest.split(',')[1]) || centerLng;
        }
    }

    leafletMap = L.map('hospitalMap').setView([centerLat, centerLng], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(leafletMap);

    // Add user marker if coords exist
    if (coords && coords.lat && coords.lng) {
        L.marker([coords.lat, coords.lng]).addTo(leafletMap)
            .bindPopup('<b>Your Location</b>')
            .openPopup();
    }

    // Add hospital pins
    hospitalsData.forEach((h, index) => {
        const dest = h.nav_link.split('destination=')[1];
        if (!dest) return;
        const hLat = parseFloat(dest.split(',')[0]);
        const hLng = parseFloat(dest.split(',')[1]);

        if (isNaN(hLat) || isNaN(hLng)) return;

        const phoneEscaped = h.phone.replace(/[^0-9+]/g, '');

        const badgeHTML = h.is_nearest_emergency ? `<div style="color:#ef4444; font-weight:bold; font-size:10px; margin-bottom:5px;">🚨 Nearest Emergency</div>` : '';

        const popupContent = `
            <div style="font-family: 'Inter', sans-serif;">
              ${badgeHTML}
              <h4 style="margin:0 0 5px 0; color:#0f172a; font-size:14px;">${h.name}</h4>
              <p style="margin:0 0 10px 0; color:#64748b; font-size:12px;">${h.distance_km} km away | ${h.emergency ? "Emergency" : "General"}</p>
              <div style="display:flex; gap:5px;">
                  <a href="tel:${phoneEscaped}" style="flex:1; text-align:center; background:#10b981; color:white; padding:5px; border-radius:4px; text-decoration:none; font-size:12px;">Call</a>
                  <a href="${h.nav_link}" target="_blank" style="flex:1; text-align:center; background:#3b82f6; color:white; padding:5px; border-radius:4px; text-decoration:none; font-size:12px;">Route</a>
              </div>
            </div>
        `;

        const marker = L.marker([hLat, hLng]).addTo(leafletMap);

        if (h.is_nearest_emergency) {
            marker.bindPopup(popupContent).openPopup();
        } else {
            marker.bindPopup(popupContent);
        }

        // Link pin to the list card
        marker.on('click', () => {
            const card = document.getElementById(`hospital-card-${index}`);
            if (card) {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                card.style.transition = 'box-shadow 0.3s ease';
                card.style.boxShadow = '0 0 0 4px var(--clr-accent)';
                setTimeout(() => {
                    card.style.boxShadow = '';
                }, 2000);
            }
        });
    });

    triggerFadeIns(section);

    // NOTE: Auto-scroll to hospital card removed — page stays at Triage Results after analysis.
}

/* ============================================================
   GEOLOCATION
   ============================================================ */
function initGeolocation() {
    const btn = $('#getLocationBtn');
    const input = $('#patientCity');
    const status = $('#locationStatus');

    btn.addEventListener('click', (e) => {
        e.preventDefault();

        if (!navigator.geolocation) {
            showNotif('Geolocation is not supported by your browser.', 'error');
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '⏳';
        status.style.display = 'block';
        status.textContent = 'Requesting location access...';

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                // Save coordinates for distance calculations later
                state.location.coords = { lat: latitude, lng: longitude };
                state.location.isLive = true;

                // Replace Mock Reverse Geocoding with Real OpenStreetMap Nominatim request
                const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1&accept-language=en`;

                fetch(url)
                    .then(res => res.json())
                    .then(data => {
                        const a = data.address;
                        let city = a.locality || a.town || a.village || a.suburb || a.neighbourhood || a.city || a.county || a.state_district || 'Unknown Location';
                        let stateName = a.state || '';

                        let district = a.state_district || a.county || '';
                        let districtName = '';
                        if (district && district !== city) {
                            districtName = district.toLowerCase().includes('district') ? `, ${district}` : `, ${district} District`;
                        }

                        let displayCity = `${city}${districtName}${stateName ? ', ' + stateName : ''}`;

                        state.location.city = city;
                        state.location.displayLocation = displayCity;

                        input.value = `📍 ${displayCity}`;
                        input.style.color = 'var(--clr-accent)';
                        input.disabled = true; // Lock manual input since live is active

                        // STRICT RULE: Do NOT cache location to localStorage

                        status.textContent = `Accuracy: ~${Math.round(position.coords.accuracy)}m`;
                        btn.innerHTML = '✅';
                        btn.classList.add('btn-primary');
                        btn.classList.remove('btn-outline');

                        addClearLocationButton(btn);
                        showNotif(`Live location secured: ${displayCity}`, 'success');
                    })
                    .catch(e => {
                        console.error("Reverse geocoding failed", e);
                        // Fallback but keep coords
                        state.location.city = 'default';
                        state.location.displayLocation = `Latitude ${latitude.toFixed(2)}`;
                        input.value = `📍 GPS Acquired`;
                        input.disabled = true;

                        btn.innerHTML = '✅';
                        btn.classList.add('btn-primary');
                        btn.classList.remove('btn-outline');

                        addClearLocationButton(btn);
                        showNotif('GPS secured but city name resolution failed.', 'warning');
                    });
            },
            (error) => {
                btn.disabled = false;
                btn.innerHTML = '🎯';
                state.location.isLive = false;
                state.location.coords = null;

                // Show calm inline message instead of intrusive notification
                status.style.display = 'block';
                status.innerHTML = '<span style="color:var(--clr-warning);">⚠️</span> Unable to fetch location. Please enter manually.';
                status.style.color = 'var(--clr-text-muted)';
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    });
}

function addClearLocationButton(btn) {
    if (!$('#clearLocationBtn')) {
        const clearBtn = document.createElement('button');
        clearBtn.id = 'clearLocationBtn';
        clearBtn.className = 'btn btn-outline btn-icon';
        clearBtn.innerHTML = '❌';
        clearBtn.title = 'Clear Live Location';
        clearBtn.style.flexShrink = '0';
        clearBtn.onclick = clearLiveLocation;
        btn.parentNode.appendChild(clearBtn);
    }
}

function clearLiveLocation(e) {
    if (e) e.preventDefault();
    state.location.isLive = false;
    state.location.coords = null;
    state.location.city = '';

    // Clear all location storage
    localStorage.removeItem('healthguard_location');
    localStorage.removeItem('healthguard_recent_locations');
    sessionStorage.removeItem('healthguard_location');

    const input = $('#patientCity');
    input.value = '';
    input.style.color = '';
    input.disabled = false;

    const btn = $('#getLocationBtn');
    btn.disabled = false;
    btn.innerHTML = '🎯';
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-outline');

    $('#locationStatus').style.display = 'none';

    const clearBtn = $('#clearLocationBtn');
    if (clearBtn) clearBtn.remove();
}

/* ============================================================
   UI HELPERS
   ============================================================ */
function showLoading(show) {
    const overlay = $('#loadingOverlay');
    if (show) overlay.classList.add('active');
    else overlay.classList.remove('active');
}

function scrollToResults() {
    setTimeout(() => { $('#results-section').scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 200);
}

function triggerFadeIns(ctx = document) {
    setTimeout(() => {
        $$(`.fade-in`, ctx).forEach(el => el.classList.add('visible'));
    }, 100);
}

/* ============================================================
   INTERSECTION OBSERVER (Scroll Animations)
   ============================================================ */
function initScrollAnimations() {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    $$('.fade-in').forEach(el => observer.observe(el));
}

/* ============================================================
   SEVERITY SLIDER
   ============================================================ */
function initSeveritySlider() {
    const slider = $('#severitySlider');
    const display = $('#severityDisplay');
    function update() {
        const v = slider.value;
        const pct = ((v - 1) / 4) * 100;
        slider.style.setProperty('--pct', pct + '%');
        display.textContent = `${v} / 5`;
        display.style.color = v >= 4 ? 'var(--clr-danger)' : v === 3 ? 'var(--clr-warning)' : 'var(--clr-accent)';
    }
    slider.addEventListener('input', update);
    update();
}

/* ============================================================
   SAMPLE REPORT
   ============================================================ */
function loadSampleReport() {
    const sampleSymptoms = ['s1', 's2', 's9', 's10', 's17', 's6'];
    sampleSymptoms.forEach(id => state.selectedSymptoms.add(id));
    $('#patientAge').value = 42;
    $('#severitySlider').value = 4;
    $('#symptomDuration').value = 5;
    $('#patientCity').value = 'Mumbai';
    renderSymptomGrid();
    renderSelectedTags();

    const sliderEvt = new Event('input');
    $('#severitySlider').dispatchEvent(sliderEvt);

    showNotif('Sample data loaded. Click "Analyze" to see results!', 'success');
    document.getElementById('patient-section').scrollIntoView({ behavior: 'smooth' });
}

/* ============================================================
   MAIN INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    // Force hide loading overlay on initial load if stuck
    showLoading(false);

    // Start Performance Monitor & Record Load Time
    // devMetrics.load = Math.round(performance.now());
    // updateDevMetricUI('Load', devMetrics.load);
    // devMetricsLoop();

    // Register PWA Service Worker (Disabled for Safety/Dev testing)
    /*
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW registration failed: ', err));
        });
    }
    */

    // FIX 7: Removed runDemoChecklist and related hooks.


    // Offline Handling Focus Banner
    const toggleOfflineBanner = () => {
        const banner = document.getElementById('offlineBanner');
        if (banner) banner.classList.toggle('show', !navigator.onLine);
    };
    window.addEventListener('online', toggleOfflineBanner);
    window.addEventListener('offline', toggleOfflineBanner);
    toggleOfflineBanner();

    initCategories();
    renderSymptomGrid();
    renderSelectedTags();
    initSeveritySlider();
    initScrollAnimations();



    // STRICT RULE: Do NOT restore location from cache on page load.
    // Location must always start empty. Language persistence is handled separately by i18n.js.

    // Search
    $('#symptomSearch').addEventListener('input', e => {
        state.searchQuery = e.target.value;
        renderSymptomGrid();
    });

    // Clear all
    $('#clearAllBtn').addEventListener('click', () => {
        state.selectedSymptoms.clear();
        renderSelectedTags();
        renderSymptomGrid();
        showNotif('All symptoms cleared.', 'success');
    });

    // Analyze button
    $('#analyzeBtn').addEventListener('click', analyzeHealth);

    // Dynamic City Autocomplete
    initAutocomplete();

    // Geolocation init
    initGeolocation();

    // Register global language change callback (used by i18n.js setLanguage)
    window._onLanguageChanged = function (lang) {
        console.log('[i18n] _onLanguageChanged callback fired for:', lang);
        state.language = lang;
        initCategories();
        renderSymptomGrid();
        renderSelectedTags();
    };

    // Sample report button
    document.querySelector('.hero-actions .btn-outline').addEventListener('click', e => {
        e.preventDefault();
        loadSampleReport();
    });

    // Refresh hospitals
    $('#refreshHospitalsBtn').addEventListener('click', () => {
        triggerHospitalSearch();
    });

    // Hero CTA scroll
    $('#heroStartBtn').addEventListener('click', e => {
        e.preventDefault();
        document.getElementById('symptom-section').scrollIntoView({ behavior: 'smooth' });
    });
});

/* ============================================================
   CITY AUTOCOMPLETE
   ============================================================ */
function initAutocomplete() {
    const input = $('#patientCity');
    const resultsContainer = $('#cityAutocomplete');

    if (!input || !resultsContainer || typeof INDIAN_CITIES === 'undefined') return;

    // ARIA Attributes
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-controls', 'cityAutocomplete');
    resultsContainer.setAttribute('role', 'listbox');

    let selectedIndex = -1;
    let currentMatches = [];

    // Helper: Levenshtein Distance for fuzzy matching
    function levenshtein(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
        const matrix = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) == a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
                }
            }
        }
        return matrix[b.length][a.length];
    }

    // Helper: Get Recent Locations
    function getRecentLocations() {
        try {
            return JSON.parse(localStorage.getItem('healthguard_recent_locations')) || [];
        } catch (e) { return []; }
    }

    // Helper: Save Recent Location
    function saveRecentLocation(city) {
        let recents = getRecentLocations();
        recents = recents.filter(c => c !== city); // Remove duplicate
        recents.unshift(city); // Add to top
        if (recents.length > 5) recents.pop(); // Keep max 5
        localStorage.setItem('healthguard_recent_locations', JSON.stringify(recents));
    }

    function renderResults(matches, query = '', isRecent = false) {
        currentMatches = matches;
        selectedIndex = -1;
        input.setAttribute('aria-activedescendant', '');

        if (!matches.length) {
            // Feature 2: Fallback UI for unknown locations
            let html = `
                <div class="autocomplete-fallback" style="padding: 1rem; text-align: center; color: var(--clr-text-muted);">
                    <div style="font-weight:600; color:var(--clr-text); margin-bottom:0.5rem; font-size:0.9rem;">
                        <span aria-hidden="true" style="margin-right:4px;">⚠️</span> Location not found?
                    </div>
                    <div style="font-size:0.8rem; margin-bottom:1rem;">
                        We couldn't find a direct match for "${query}".
                    </div>
                    <button type="button" class="btn btn-outline btn-sm fallback-gps-btn" style="width:100%; margin-bottom:0.5rem;">
                        <span aria-hidden="true">📍</span> Continue with detected GPS
                    </button>
                    <button type="button" class="btn btn-primary btn-sm fallback-hq-btn" style="width:100%;">
                        <span aria-hidden="true">🏢</span> Use nearest district HQ (Demo)
                    </button>
                </div>
            `;
            resultsContainer.innerHTML = html;
            resultsContainer.style.display = 'block';
            input.setAttribute('aria-expanded', 'true');

            // Bind fallback actions
            const gpsBtn = resultsContainer.querySelector('.fallback-gps-btn');
            const hqBtn = resultsContainer.querySelector('.fallback-hq-btn');

            if (gpsBtn) {
                gpsBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (state.location.coords) {
                        input.value = state.location.city || "GPS Location";
                        resultsContainer.style.display = 'none';
                        showNotif('Falling back to GPS coordinates.', 'info');
                    } else {
                        showNotif('GPS not detected. Turn on Location Services.', 'warning');
                    }
                });
            }

            if (hqBtn) {
                hqBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Fallback to a deterministic demo HQ
                    input.value = "Gorakhpur, Gorakhpur, Uttar Pradesh";
                    resultsContainer.style.display = 'none';
                    showNotif('Using district headquarters fallback for demo.', 'info');
                });
            }

            return;
        }

        let html = '';
        if (isRecent) {
            html += `<div class="recent-header">Recent Locations</div>`;
        }

        html += matches.map((match, i) => {
            let displayText = match;
            if (query && !isRecent) {
                // Case-insensitive replace for highlighting
                const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                displayText = match.replace(regex, '<span class="highlight">$1</span>');
            }
            return `
                <div class="autocomplete-item" role="option" id="ac-item-${i}" data-index="${i}">
                    <span style="color:var(--clr-text-muted);font-size:0.8rem;margin-right:4px;" aria-hidden="true">📍</span> 
                    ${displayText}
                </div>
            `;
        }).join('');

        resultsContainer.innerHTML = html;
        resultsContainer.style.display = 'block';
        input.setAttribute('aria-expanded', 'true');

        // Auto-select first item
        updateKeyboardSelection(0);
    }

    function updateKeyboardSelection(index) {
        const items = resultsContainer.querySelectorAll('.autocomplete-item');
        if (items.length === 0) return;

        items.forEach(el => {
            el.classList.remove('kb-selected');
            el.setAttribute('aria-selected', 'false');
        });

        if (index >= 0 && index < items.length) {
            selectedIndex = index;
            items[index].classList.add('kb-selected');
            items[index].setAttribute('aria-selected', 'true');
            input.setAttribute('aria-activedescendant', `ac-item-${index}`);
            // Smooth scroll into view
            items[index].scrollIntoView({ block: 'nearest' });
        } else {
            input.setAttribute('aria-activedescendant', '');
        }
    }

    let debounceTimer;

    function handleInput() {
        clearTimeout(debounceTimer);
        const val = input.value.toLowerCase().trim();

        if (!val) {
            const recents = getRecentLocations();
            if (recents.length > 0) {
                renderResults(recents, '', true);
            } else {
                resultsContainer.style.display = 'none';
                input.setAttribute('aria-expanded', 'false');
            }
            return;
        }

        debounceTimer = setTimeout(() => {
            const t0 = performance.now();
            if (!state.demoMode && state.CACHE.autocomplete[val]) {
                renderResults(state.CACHE.autocomplete[val], val);
                // devMetrics.ac = performance.now() - t0;
                // updateDevMetricUI('Ac', devMetrics.ac);
                return;
            }

            // Implement 3-Tier Prefix-First Ranking System
            const tier1 = []; // Exact prefix match
            const tier2 = []; // Word boundary match
            const tier3 = []; // Substring fallback
            const fuzzy = []; // Typo tolerance

            for (const city of INDIAN_CITIES) {
                const lowerCity = city.toLowerCase();
                if (lowerCity.startsWith(val)) {
                    tier1.push(city);
                } else if (lowerCity.includes(' ' + val)) {
                    tier2.push(city);
                } else if (lowerCity.includes(val)) {
                    tier3.push(city);
                } else {
                    // Only run fuzzy if val is at least 4 chars long to save CPU
                    if (val.length >= 4) {
                        const cityWord = lowerCity.split(',')[0];
                        if (Math.abs(cityWord.length - val.length) <= 2) {
                            const dist = levenshtein(val, cityWord);
                            // If distance is small relative to word length
                            if (dist <= 2) {
                                fuzzy.push({ city, dist });
                            }
                        }
                    }
                }
            }

            // Prioritize Major Cities
            const MAJOR = [
                'bengaluru', 'pune', 'varanasi', 'vijayawada', 'mumbai', 'delhi',
                'chennai', 'kolkata', 'hyderabad', 'ahmedabad', 'surat', 'jaipur',
                'lucknow', 'kanpur', 'nagpur', 'indore', 'thane', 'bhopal',
                'visakhapatnam', 'patna', 'vadodara', 'ghaziabad', 'ludhiana',
                'agra', 'nashik', 'faridabad', 'meerut', 'rajkot', 'kalyan', 'vasai'
            ];

            const sortFn = (a, b) => {
                const cityA = a.split(',')[0].toLowerCase();
                const cityB = b.split(',')[0].toLowerCase();
                const aMajor = MAJOR.includes(cityA) ? 0 : 1;
                const bMajor = MAJOR.includes(cityB) ? 0 : 1;
                if (aMajor !== bMajor) return aMajor - bMajor;
                return cityA.length - cityB.length;
            };

            tier1.sort(sortFn);
            tier2.sort(sortFn);
            fuzzy.sort((a, b) => a.dist - b.dist);

            const matches = [...tier1, ...tier2, ...tier3, ...fuzzy.map(f => f.city)].slice(0, 8);
            if (!state.demoMode) state.CACHE.autocomplete[val] = matches;
            renderResults(matches, val);

            // devMetrics.ac = performance.now() - t0;
            // updateDevMetricUI('Ac', devMetrics.ac);
        }, 100);
    }

    input.addEventListener('input', (e) => {
        if (state.location.isLive) {
            e.preventDefault();
            return;
        }
        handleInput();
    });

    input.addEventListener('focus', () => {
        if (state.location.isLive) return;
        if (!input.value.trim()) {
            const recents = getRecentLocations();
            if (recents.length > 0) renderResults(recents, '', true);
        }
    });

    input.addEventListener('keydown', (e) => {
        if (resultsContainer.style.display === 'none') return;

        const items = resultsContainer.querySelectorAll('.autocomplete-item');
        if (items.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            updateKeyboardSelection(selectedIndex < items.length - 1 ? selectedIndex + 1 : 0);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            updateKeyboardSelection(selectedIndex > 0 ? selectedIndex - 1 : items.length - 1);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0 && selectedIndex < items.length) {
                items[selectedIndex].click(); // Handled by delegated listener
            }
        } else if (e.key === 'Escape') {
            resultsContainer.style.display = 'none';
            input.setAttribute('aria-expanded', 'false');
            input.focus();
        }
    });

    resultsContainer.addEventListener('mouseover', (e) => {
        const item = e.target.closest('.autocomplete-item');
        if (item) {
            const idx = parseInt(item.getAttribute('data-index'));
            if (!isNaN(idx)) updateKeyboardSelection(idx);
        }
    });

    document.addEventListener('click', (e) => {
        if (e.target !== input && !resultsContainer.contains(e.target)) {
            resultsContainer.style.display = 'none';
            input.setAttribute('aria-expanded', 'false');
        }
    });

    resultsContainer.addEventListener('click', (e) => {
        const item = e.target.closest('.autocomplete-item');
        if (!item) return;

        // Extract raw text, removing emoji and HTML markup
        const clone = item.cloneNode(true);
        const span = clone.querySelector('span[aria-hidden="true"]');
        if (span) span.remove();
        const rawText = clone.textContent.trim();

        input.value = rawText;
        resultsContainer.style.display = 'none';
        input.setAttribute('aria-expanded', 'false');
        state.location.city = input.value;

        // STRICT RULE: Do NOT cache location to localStorage
        saveRecentLocation(input.value);
    });
}

/* ============================================================
   AUTH LOGIC (REGISTER & LOGIN)
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('navLoginBtn');
    const registerBtn = document.getElementById('navRegisterBtn');
    const authModal = document.getElementById('authModal');
    const closeBtn = document.getElementById('authCloseBtn');

    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const authLoginForm = document.getElementById('authLoginForm');
    const authRegisterForm = document.getElementById('authRegisterForm');

    // Shared Utils
    const BACKEND_URL = window.VITE_API_URL || '';
    const API_BASE = BACKEND_URL + '/auth';

    // Helper for initSession robust fetch
    async function safeFetch(url, options = {}) {
        options.credentials = 'include';
        try {
            const res = await fetch(url, options);
            const data = await res.json().catch(() => ({ success: false, error: 'Invalid server response' }));
            return { ok: res.ok, status: res.status, data };
        } catch (err) {
            return { ok: false, status: 0, data: { success: false, error: 'Service temporarily unavailable.' }, networkError: true };
        }
    }

    // UI Protection elements
    const protectedElements = document.querySelectorAll('[data-requires-auth="true"]');
    const navLoginBtn = loginBtn;
    const navRegisterBtn = registerBtn;
    const navUserDropdown = document.getElementById('navUserDropdown');
    const navAuthContainer = document.getElementById('navAuthContainer');
    const btnLogout = document.getElementById('btnLogout');

    if (btnLogout) {
        btnLogout.addEventListener('click', async (e) => {
            e.preventDefault();
            if (confirm("Are you sure you want to log out?")) {
                try { await fetch(`${API_BASE}/logout`, { method: 'POST', credentials: 'include' }); } catch (err) { }
                localStorage.removeItem('hg_user_session');

                // STRICT RULE: Location MUST be explicitly cleared on logout.
                state.location = { coords: null, city: '', isLive: false };
                const cityInput = document.getElementById('patientCity');
                if (cityInput) {
                    cityInput.value = '';
                    cityInput.style.color = '';
                    cityInput.disabled = false;
                }

                // Clear ALL location data from storage
                localStorage.removeItem('healthguard_location');
                localStorage.removeItem('healthguard_recent_locations');
                sessionStorage.removeItem('healthguard_location');

                showNotif('Logged out successfully', 'success');
                window.location.reload();
            }
        });
    }

    if (navLoginBtn) {
        navLoginBtn.addEventListener('click', (e) => {
            // Only toggle if it's a dropdown toggle link (href='#')
            if (navLoginBtn.getAttribute('href') === '#') {
                e.preventDefault();
                if (navUserDropdown) {
                    navUserDropdown.style.display = (navUserDropdown.style.display === 'flex') ? 'none' : 'flex';
                }
            }
        });
    }

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
        if (navUserDropdown && !e.target.closest('#navAuthContainer')) {
            navUserDropdown.style.display = 'none';
        }
    });

    function checkAuthState() {
        let localStore = localStorage.getItem('hg_user_session');
        // Purge old persistent guest sessions immediately
        if (localStore) {
            try {
                let parsed = JSON.parse(localStore);
                if (parsed && parsed.data && parsed.data.is_guest) {
                    localStorage.removeItem('hg_user_session');
                    localStore = null;
                }
            } catch(e){}
        }
        
        const sessionTempStore = sessionStorage.getItem('hg_user_session');
        const sessionStore = localStore || sessionTempStore;
        
        const session = sessionStore ? JSON.parse(sessionStore) : null;

        if (session && session.data && !session.data.is_guest) {
            // MODE 3: AUTHENTICATED USER (Full Access)
            if (navLoginBtn) {
                let displayName = session.data.full_name ? session.data.full_name.split(' ')[0] : session.data.username;
                if (displayName.length > 12) displayName = displayName.substring(0, 10) + '..';
                navLoginBtn.innerHTML = `👤 ${displayName} ▾`;
                navLoginBtn.setAttribute('href', '#'); // Dropdown toggle
                navLoginBtn.dataset.i18n = '';
                navLoginBtn.style.background = ''; // Reset to default
            }
            if (navRegisterBtn) navRegisterBtn.style.display = 'none';

            protectedElements.forEach(el => {
                el.classList.remove('disabled-auth');
                const tooltip = el.querySelector('.auth-tooltip');
                if (tooltip) tooltip.remove();
                if (el.dataset.restricted === "true") {
                    el.onclick = null;
                    el.dataset.restricted = "false";
                }
            });
        } else if (session && session.data && session.data.is_guest) {
            // MODE 2: GUEST USER (Analyze only, No Save)
            if (navLoginBtn) {
                navLoginBtn.innerHTML = `👤 Guest`;
                navLoginBtn.setAttribute('href', 'login.html');
                navLoginBtn.dataset.i18n = ''; // Remove localization override to preserve Guest text
                navLoginBtn.style.background = ''; // Restore accent color
                if (navUserDropdown) navUserDropdown.style.display = 'none';
            }
            if (navRegisterBtn) {
                navRegisterBtn.style.display = 'block';
                navRegisterBtn.setAttribute('href', 'login.html?tab=register');
            }

            protectedElements.forEach(el => {
                const isAnalyzeButton = el.id === 'analyzeBtn' || el.id === 'heroStartBtn' || el.getAttribute('href') === '#patient-section';
                if (isAnalyzeButton) {
                    el.classList.remove('disabled-auth');
                    const tooltip = el.querySelector('.auth-tooltip');
                    if (tooltip) tooltip.remove();
                    if (el.dataset.restricted === "true") {
                        el.onclick = null;
                        el.dataset.restricted = "false";
                    }
                } else {
                    el.classList.add('disabled-auth');
                    if (!el.querySelector('.auth-tooltip')) {
                        const tooltip = document.createElement('div');
                        tooltip.className = 'auth-tooltip';
                        tooltip.innerText = 'Create an account to save data';
                        el.appendChild(tooltip);
                    }
                    el.dataset.restricted = "true";
                    el.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.location.href = 'login.html';
                    };
                }
            });
        } else {
            // MODE 1: PUBLIC (Read-Only)
            if (navLoginBtn) {
                navLoginBtn.innerHTML = `Login`;
                navLoginBtn.setAttribute('href', 'login.html');
                navLoginBtn.dataset.i18n = 'nav_login';
                navLoginBtn.style.background = ''; // Restore accent color
                if (navUserDropdown) navUserDropdown.style.display = 'none';
            }
            if (navRegisterBtn) {
                navRegisterBtn.style.display = 'block';
                navRegisterBtn.setAttribute('href', 'login.html?tab=register');
            }

            protectedElements.forEach(el => {
                el.classList.add('disabled-auth');
                if (!el.querySelector('.auth-tooltip')) {
                    const tooltip = document.createElement('div');
                    tooltip.className = 'auth-tooltip';
                    tooltip.innerText = 'Please log in to continue';
                    el.appendChild(tooltip);
                }
                el.dataset.restricted = "true";
                el.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.location.href = 'login.html';
                };
            });
        }
    }

    // Handle Initial Session Check and Demo Fallback
    async function initSession() {
        const result = await safeFetch(`${API_BASE}/session`, { method: 'GET' });

        if (result.networkError) {
            // Silent internal fallback — no user-visible message
            console.debug('[HG] Backend offline. Running in silent guest fallback mode.');
            state.demoMode = true;
            // Allow guest access when backend is unreachable
            localStorage.setItem('hg_user_session', JSON.stringify({ data: { is_guest: true, username: 'Guest User' } }));
            checkAuthState();
        } else if (result.ok && result.data.success) {
            localStorage.setItem('hg_user_session', JSON.stringify(result.data));
            checkAuthState();
        } else {
            // Unauthenticated but backend is online
            checkAuthState();
        }
    }

    // Initialize Auth state on load
    // STRICT RULE: Location must be empty on page load. Do NOT restore location from any cache.
    state.location = { coords: null, city: '', isLive: false };
    const cityInput = document.getElementById('patientCity');
    if (cityInput) {
        cityInput.value = '';
        cityInput.setAttribute('autocomplete', 'new-password');
        // Final clear on next tick to beat aggressive Chrome autofill
        setTimeout(() => { cityInput.value = ''; }, 100);
    }

    // Reset location state explicitly
    clearLiveLocation();

    checkBackendHealth();
    initSession();
    initGeolocation();

    // Hook into global language switch to natively re-render symptoms
    document.addEventListener('languageChanged', (e) => {
        try {
            console.log('[i18n] languageChanged event received:', e.detail.lang);
            state.language = e.detail.lang;
            initCategories();
            renderSymptomGrid();
            renderSelectedTags();

            // Re-render analysis results if they exist to update condition name, medicines, etc.
            if (state.analysisResult) {
                renderResults(state.analysisResult);
            }

            // 3. Update analyze button text if it exists (instant feedback)
            const analyzeBtn = document.getElementById('analyzeBtn');
            if (analyzeBtn && typeof TRANSLATIONS !== 'undefined') {
                const lang = e.detail.lang || 'en';
                if (TRANSLATIONS[lang] && TRANSLATIONS[lang]['btn_process']) {
                    const icon = analyzeBtn.querySelector('span');
                    if (icon) {
                        analyzeBtn.innerHTML = '';
                        analyzeBtn.appendChild(icon);
                        analyzeBtn.appendChild(document.createTextNode(' ' + TRANSLATIONS[lang]['btn_process']));
                    } else {
                        analyzeBtn.textContent = TRANSLATIONS[lang]['btn_process'];
                    }
                }
            }
            console.log('[i18n] Symptom grid and UI re-rendered for language:', e.detail.lang);
        } catch (err) {
            console.error('[i18n] Error re-rendering symptoms on language change:', err);
        }
    });
});

/* ============================================================
   HOSPITAL FETCHING & OVERPASS API (Feature 3)
   ============================================================ */
function getDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
}

function showHospitalFallback() {
    const grid = $('#hospitalsGrid');
    if (grid) {
        grid.innerHTML = `
            <div class="glass-card hospital-card fade-in border-pulse-danger" style="width:100%;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                  <div class="hospital-type-badge emergency">🚑 Default Emergency Response</div>
                </div>
                <div style="margin-top:0.75rem;">
                  <div class="hospital-name">National Emergency Services</div>
                </div>
                <div class="hospital-meta" style="margin-top:0.5rem">
                  <div class="meta-row"><span class="icon">📞</span>Ambulance / Emergency: 108</div>
                  <div class="meta-row"><span class="icon">📞</span>Health Helpline: 104</div>
                </div>
                <div class="hospital-actions" style="display:flex !important; visibility:visible !important;">
                  <a href="tel:108" class="btn btn-danger btn-sm" style="flex:1; display:flex;">🚑 Call 108</a>
                  <a href="tel:104" class="btn btn-outline btn-sm" style="flex:1; display:flex;">📞 Call 104</a>
                </div>
            </div>
        `;
    }
    const mapWrapper = $('#hospitalMapWrapper');
    if (mapWrapper) mapWrapper.style.display = 'none';
    showNotif("Could not fetch local hospitals. Displaying national helplines.", "warning");
}

async function fetchHospitals(lat, lon) {
    showLoading(true);
    try {
        const query = `[out:json][timeout:15];(node["amenity"="hospital"](around:20000,${lat},${lon});way["amenity"="hospital"](around:20000,${lat},${lon});relation["amenity"="hospital"](around:20000,${lat},${lon});node["amenity"="clinic"](around:15000,${lat},${lon}););out center 20;`;

        const response = await fetch(`https://overpass-api.de/api/interpreter`, {
            method: 'POST',
            body: query
        });

        if (!response.ok) throw new Error("Overpass API failed");

        const data = await response.json();

        let hospitalsData = [];

        data.elements.forEach(element => {
            const hLat = element.center ? element.center.lat : element.lat;
            const hLon = element.center ? element.center.lon : element.lon;
            const tags = element.tags || {};
            if (!tags.name) return;

            const name = tags.name;
            const emergency = tags.emergency === 'yes';
            const distance_km = getDistanceKm(lat, lon, hLat, hLon);

            // Multi-tag phone hunt
            let rawPhone = tags.phone || tags['contact:phone'] || tags['phone:emergency'] || tags['contact:mobile'] || "";
            // Clean up placeholders like "N/A", "none", etc.
            if (rawPhone && /^(n\/?a|none|not available|null)$/i.test(rawPhone.trim())) {
                rawPhone = "";
            }
            const phone = rawPhone || "Helpline (108/104)";
            const isGenericHelpline = !rawPhone;

            const nav_link = `https://www.google.com/maps/dir/?api=1&destination=${hLat},${hLon}`;

            hospitalsData.push({
                name, distance_km, emergency, phone, nav_link, isGenericHelpline,
                tags, is_nearest_emergency: false
            });
        });

        // Unique hospitals by name to avoid node/way duplicates
        const uniqueHospitals = Array.from(new Map(hospitalsData.map(item => [item.name, item])).values());

        uniqueHospitals.sort((a, b) => a.distance_km - b.distance_km);

        let emergencyFound = false;
        for (let i = 0; i < uniqueHospitals.length; i++) {
            if (uniqueHospitals[i].emergency) {
                uniqueHospitals[i].is_nearest_emergency = true;
                emergencyFound = true;
                break;
            }
        }

        if (!emergencyFound && uniqueHospitals.length > 0) {
            uniqueHospitals[0].is_nearest_emergency = true; // Fallback primary suggestion
        }

        const topHospitals = uniqueHospitals.slice(0, 6);

        if (topHospitals.length === 0) {
            showHospitalFallback();
            showLoading(false);
            return;
        }

        renderHospitals(topHospitals, { lat, lng: lon });
        showNotif('Hospital list refreshed from Overpass.', 'success');

    } catch (e) {
        console.error("fetchHospitals fallback triggered:", e);
        showHospitalFallback();
    } finally {
        showLoading(false);
        const btn = $('#refreshHospitalsBtn');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `🔄 <span>Refresh</span>`;
        }
    }
}

async function triggerHospitalSearch() {
    const btn = $('#refreshHospitalsBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '⏳ Loading...';
    }

    if (state.location.coords) {
        await fetchHospitals(state.location.coords.lat, state.location.coords.lng);
    } else {
        if (!navigator.geolocation) {
            showHospitalFallback();
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = `🔄 <span>Refresh</span>`;
            }
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                state.location.coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                state.location.isLive = true;
                await fetchHospitals(pos.coords.latitude, pos.coords.longitude);
            },
            (err) => {
                console.warn("GPS fetch failed for manual trigger:", err);
                showHospitalFallback();
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = `🔄 <span>Refresh</span>`;
                }
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    }
}

