# 🏥 HealthGuard AI — AI-Powered Healthcare Management System

> An intelligent, multilingual health triage platform built with Python Flask and vanilla JavaScript. Powered by Google Gemini and real-time hospital mapping, HealthGuard AI enables users to analyze symptoms, understand risk levels, discover nearby medical facilities, and make smarter healthcare decisions.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=flat-square)](https://healthguard-ai-23pi.onrender.com)
[![Python](https://img.shields.io/badge/Python-3.11+-blue?style=flat-square&logo=python)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.x-black?style=flat-square&logo=flask)](https://flask.palletsprojects.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **AI Symptom Analysis** | Gemini-powered multilingual symptom assessment |
| 🗺️ **Hospital Finder** | Real-time nearby hospitals via OpenStreetMap |
| 🌐 **15+ Languages** | UI + AI results in Hindi, Tamil, Telugu, Kannada, and more |
| 🛡️ **Risk Profiler** | Dynamic risk scoring (Low → Critical) with insurance guidance |
| 💊 **OTC Suggestions** | Condition-aware over-the-counter medicine recommendations |
| 🔐 **Secure Auth** | OTP-based email authentication via Brevo |
| 📋 **Insurance Guidance** | Automatic insurance eligibility assessment |
| 📱 **PWA Ready** | Installable Progressive Web App with offline support |

---

## 🏗️ Project Structure

```
HealthGuard-AI/
├── backend/
│   ├── app.py                  # Flask server — main entry point
│   ├── utils/
│   │   ├── gemini_client.py    # Google Gemini AI integration
│   │   ├── hospital_finder.py  # OpenStreetMap hospital search
│   │   ├── symptom_mapper.py   # Tier-3 local diagnostic engine
│   │   ├── care_engine.py      # OTC medications & insurance logic
│   │   ├── risk_profiler.py    # Risk scoring engine
│   │   └── translator.py       # Gemini-powered dynamic translation
│   ├── models/                 # ML model files (.pkl)
│   └── data/                   # Training/reference data
├── frontend/
│   ├── index.html              # Main app dashboard
│   ├── login.html              # Authentication page
│   ├── app.js                  # Core frontend logic
│   ├── style.css               # Global styles
│   ├── sw.js                   # Service Worker (PWA)
│   ├── manifest.json           # PWA manifest
│   └── assets/
│       ├── js/
│       │   ├── i18n.js         # 15+ language translations
│       │   ├── symptoms_i18n.js # Localized symptom names
│       │   └── cities.js       # City/location data
│       └── lib/
│           └── leaflet/        # Map rendering library
├── .env.example                # Environment variable template
├── requirements.txt            # Python dependencies
├── Procfile                    # Render/Heroku deployment config
├── runtime.txt                 # Python runtime version
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- A [Google Gemini API Key](https://aistudio.google.com/)
- A [Brevo API Key](https://brevo.com/) (for OTP email)

### 1. Clone the Repository
```bash
git clone https://github.com/ADITYAS4509/HealthGuard-AI.git
cd HealthGuard-AI
```

### 2. Set Up Virtual Environment
```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
```bash
cp .env.example .env
```
Open `.env` and fill in your API keys:
```env
GEMINI_API_KEY=your_gemini_api_key_here
RAPIDAPI_KEY=your_rapidapi_key_here
RAPIDAPI_HOST=ai-medical-diagnosis.p.rapidapi.com
BREVO_API_KEY=your_brevo_api_key_here
SENDER_EMAIL=your_sender_email@example.com
```

### 5. Run the Application
```bash
python backend/app.py
```
Open your browser and navigate to `http://localhost:8000`.

---

## 🌐 Multilingual Support

HealthGuard AI supports **15+ Indian and global languages**:

`English` `Hindi` `Kannada` `Tamil` `Telugu` `Malayalam` `Bengali` `Marathi` `Gujarati` `Punjabi` `Odia` `Urdu` `Assamese` `Nepali` `Konkani`

The AI diagnoses, clinical explanations, hospital names, and all UI labels adapt dynamically to your chosen language.

---

## 🏥 AI Diagnosis Pipeline (Tiered)

```
User Symptoms
     │
     ▼
 Tier 1: RapidAPI Medical Diagnosis
     │ (if unavailable or fails)
     ▼
 Tier 2: Google Gemini 2.0 Flash (with model rotation + retry)
     │ (if rate limited)
     ▼
 Tier 3: Local Symptom Mapper (deterministic, offline-capable)
```

---

## 🔐 Security Notes

- **Never commit `.env`** — all secrets are in `.env.example` as templates.
- The `users.db` SQLite database is excluded from version control by default.
- OTP authentication uses industry-standard password hashing.

---

## ☁️ Deployment

This app is pre-configured for **[Render](https://render.com/)** via `Procfile` and `runtime.txt`.

```
# Procfile
web: python backend/app.py
```

Set your environment variables directly in the Render dashboard under **Environment** settings.

---

## 👨‍💻 Author

**Aditya Shukla**
- Email: adityashukla4509@gmail.com
- GitHub: [@ADITYAS4509](https://github.com/ADITYAS4509)

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

*This project is a proof of ownership and intellectual property of Aditya Shukla.*