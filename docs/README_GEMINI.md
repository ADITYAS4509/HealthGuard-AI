Gemini integration (AI Symptom Predictor)

This project includes an optional integration with Google Gemini (via the `google-generativeai` Python SDK) to provide patient-friendly AI analysis of symptoms.

Setup

1. Install the SDK (in your Python environment):

```bash
pip install google-generativeai
```

2. Configure API key (preferred):

```bash
export GEMINI_API_KEY="YOUR_API_KEY"
# On Windows (PowerShell)
$env:GEMINI_API_KEY="YOUR_API_KEY"
```

Alternatively, for hackathon/demo use you can include `gemini_api_key` in the POST payload to `/ai_symptom_analysis`.

3. Optional: choose a model by setting `GEMINI_MODEL` environment variable (defaults to `gpt-4o-mini` in code):

```bash
export GEMINI_MODEL="gpt-4o-mini"
```

Endpoints

- POST `/ai_symptom_analysis` - payload: `{'symptoms': [...], 'age': 30, 'severity': 2, 'duration': 1}`
  - Returns JSON with `ai_analysis` containing:
    - `possible_conditions` (list)
    - `risk_level` (Low/Medium/High)
    - `risk_reason` (string)
    - `explanation` (string)
    - `next_steps` (list)
    - `emergency` (bool)
    - `disclaimer` (string)

Notes & Safety

- The Gemini output is used as decision-support only. It is NOT a medical diagnosis.
- The backend includes fallback behavior if the SDK is not installed or the API key is not set.
- Always validate outputs before relying on them in production.
