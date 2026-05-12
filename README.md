# 🫀 HopeLink — Organ Donation System

<div align="center">

![HopeLink Banner](frontend/images/hopelink_banner.png)

### *Your Gift Lives On.*

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Vercel-black?style=for-the-badge)](https://hope-link-organ-donation-system.vercel.app)
[![Backend](https://img.shields.io/badge/⚙️_Backend-Railway-blueviolet?style=for-the-badge)](https://romantic-balance-production-5ab2.up.railway.app/api/health)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Node](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql)](https://mysql.com)

</div>

---

## 📌 About

India's deceased organ donation rate remains critically low — below one donor per million population. Thousands of patients lose their lives each year waiting for a compatible organ, worsened by fragmented coordination and delayed matching.

**HopeLink** is a full-stack, AI-assisted organ donation platform that digitises and automates the donor-recipient matching process. It connects donors, recipients, and hospital staff on a single web application — using machine learning to score compatibility and predict transplant success, replacing manual coordination with a structured, data-driven workflow.

The platform supports three user roles, real-time notifications, a hospital analytics dashboard, and a three-tier clinical matching engine — all deployed and live.

> This project was developed as an academic proof-of-concept at Vellore Institute of Technology (2025). The ML models are trained on synthetically generated data and are not validated on real clinical datasets.

---

## ✨ Features

- 🔍 **AI Compatibility Matching** — Random Forest model scores each donor-recipient pair from 0–100% based on blood group, age, organ-specific clinical metrics, and geographic proximity
- 📊 **Survival Probability Estimation** — Logistic Regression model predicts post-transplant success probability for every match result
- 🩸 **Blood Group Compatibility Engine** — Full ABO compatibility matrix enforced server-side before any other filter runs
- 🫀 **Organ-Specific Clinical Matching** — Separate matching criteria per organ: Heart (EF, cardiac history), Liver (MELD, HLA), Lungs (TLC, DLCO, FEV1), Pancreas (dimensions, insulin)
- 📍 **Geographic Priority Engine** — State-first donor search to minimise ischemic time; falls back to national if no local match exists
- 🌡️ **Urgency Triage Scoring** — Server-side classification (Critical / High / Moderate / Stable) based on organ type, MELD score, ejection fraction, and patient age
- ⚡ **Real-time Notifications** — Socket.io pushes instant toast popups and bell alerts to all connected users when a donor registers or a match is made
- 🏥 **Hospital Command Center** — Role-gated dashboard with live organ counts, stacked bar chart by state, doughnut chart by organ type, and recent activity tables
- 🛡️ **Role-based Authentication** — JWT auth with three roles (`donor`, `recipient`, `hospital`); bcryptjs password hashing; role-enforced middleware on all protected routes
- 🔄 **Graceful ML Degradation** — If the ML server is offline, matching still returns donor results; scores are simply omitted

---

## 🏗️ Architecture

```
Browser  (Vercel — static frontend)
    │
    │  HTTP REST + WebSocket (Socket.io)
    ▼
Express.js Server  (Railway · port 3000)
    │                        │
    │  mysql2                │  Axios (internal HTTP)
    ▼                        ▼
MySQL Database          Flask ML Server
(organ_donation)        (port 5001)
```

- The Express server serves the frontend as static files and handles all API routes
- Socket.io runs on the same HTTP server instance as Express
- The Flask ML server is a separate process; the backend calls it per match request
- In production, both backend and ML server are co-located on Railway

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Charts | Chart.js (CDN) |
| Real-time | Socket.io (client + server) |
| Backend | Node.js, Express.js |
| Authentication | jsonwebtoken (JWT), bcryptjs |
| Database Driver | mysql2 |
| Internal HTTP | Axios (backend → ML server) |
| Database | MySQL 8.0 |
| ML Server | Python, Flask |
| ML Models | scikit-learn — RandomForestClassifier, LogisticRegression |
| Model Storage | joblib (.pkl serialisation) |
| Data Processing | pandas, NumPy |
| Frontend Deploy | Vercel |
| Backend Deploy | Railway |

---

## 📁 Project Structure

```
HopeLink-Organ-Donation-System/
├── frontend/
│   ├── index.html              # Single-page application
│   ├── style.css               # All styles
│   ├── app.js                  # API calls, Socket.io client, auth, dashboard charts
│   ├── vercel.json             # Vercel deployment config
│   └── images/                 # Background images and video assets
├── backend/
│   ├── server.js               # Express REST API + Socket.io server (all routes)
│   ├── package.json            # Node.js dependencies
│   ├── Procfile                # Railway deployment entry point
│   └── .env.example            # Environment variable template
├── ml/
│   ├── app.py                  # Flask inference server (port 5001)
│   ├── matching_model.py       # Random Forest training script
│   ├── survival_model.py       # Logistic Regression training script
│   ├── predict.py              # MatchPredictor class
│   ├── requirements.txt        # Python dependencies
│   └── ml/                     # Serialised models (model.pkl, survival_model.pkl)
├── database/
│   └── schema.sql              # Table definitions + seed data
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- Python 3.9+

### 1. Clone the repository

```bash
git clone https://github.com/ananyanair12/HopeLink-Organ-Donation-System.git
cd HopeLink-Organ-Donation-System
```

### 2. Set up the database

```bash
mysql -u your_user -p < database/schema.sql
```

Creates the `organ_donation` database with all six tables and seed data across multiple Indian states.

### 3. Configure and start the backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:

```
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=organ_donation
DB_PORT=3306
PORT=3000
JWT_SECRET=your_secret_here
```

```bash
npm start
```

Backend and frontend are both served at `http://localhost:3000`.

### 4. Start the ML inference server

```bash
cd ../ml
pip install -r requirements.txt
python app.py
```

Runs at `http://localhost:5001`. This step is optional — if the ML server is not running, match results are still returned without AI scores.

### 5. Open in browser

```
http://localhost:3000
```

---

## 📖 Usage

**As a Donor**
1. Sign up with role `donor`
2. Go to the Register section
3. Select the organ you wish to donate and fill in the organ-specific clinical fields

**As a Recipient**
1. Sign up with role `recipient`
2. Go to the Find a Match section
3. Enter your organ need, blood group, state, and clinical metrics
4. Submit — compatible donors are returned ranked by AI compatibility score, with urgency status and survival probability

**As Hospital Staff**
1. Sign up with role `hospital`
2. Go to the Dashboard section
3. View live organ availability charts and recent donor/recipient activity

**Real-time Notifications**
All connected users receive toast popups and bell notifications instantly when a new donor registers or a match is found — no page refresh required.

---

## 🧬 Matching Logic

HopeLink runs a three-tier filtering pipeline on every match request:

**Tier 1 — Blood Group Compatibility**
Full ABO matrix is enforced server-side. Incompatible blood groups are excluded before any further processing (e.g. O- donors are compatible with all recipients; AB+ recipients can receive from all groups).

**Tier 2 — Organ-Specific Clinical Criteria**

| Organ | Matching Criteria |
|---|---|
| ❤️ Heart | Ejection Fraction within ±10% + cardiac history check |
| 🫀 Liver | HLA Typing match + MELD score filter |
| 🫁 Lungs | Total Lung Capacity within ±1L + DLCO and FEV1 |
| 🫐 Pancreas | Dimension match (L/W/T) + insulin secretion level |

**Tier 3 — Geographic and ML Scoring**
- Same-state donors are queried first to minimise ischemic time
- If no local match exists, the search expands nationally
- MatchPredictor and SurvivalPredictor attach confidence scores to each result

---

## 🔌 API Reference

Base URL: `http://localhost:3000`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/health` | Health check | — |
| GET | `/api/stats` | Total donor and recipient counts | — |
| POST | `/api/match` | Run matching pipeline for a recipient | — |
| POST | `/api/auth/signup` | Create a new user account | — |
| POST | `/api/auth/login` | Login and receive a JWT token | — |
| GET | `/api/auth/me` | Get current authenticated user | ✅ |
| POST | `/api/register-donor` | Register a new organ donor | ✅ `donor` |
| POST | `/api/register-recipient` | Register a new recipient | ✅ `recipient` |
| GET | `/api/dashboard/organ-counts` | Organ counts grouped by state | ✅ `hospital` |
| GET | `/api/dashboard/recent-donors` | Latest 5 registered donors | ✅ `hospital` |
| GET | `/api/dashboard/recent-recipients` | Latest 5 registered recipients | ✅ `hospital` |

Protected endpoints require `Authorization: Bearer <token>` in the request header.

---

## 🤖 ML Models

Both models are trained on **synthetically generated data** using heuristic scoring rules. They serve as a proof-of-concept and are not trained on real clinical transplant records.

| Model | Algorithm | Output |
|---|---|---|
| MatchPredictor | Random Forest (100 estimators) | 0–100% donor-recipient compatibility score |
| SurvivalPredictor | Logistic Regression | 0–100% post-transplant success probability |

Models are serialised with `joblib` to `ml/ml/*.pkl`. If the files are missing on startup, `app.py` automatically retrains them from scratch.

---

## 🗄️ Database Schema

Six tables defined in `database/schema.sql`:

| Table | Description |
|---|---|
| `users` | Authenticated users with role: `donor`, `recipient`, or `hospital` |
| `recipients` | Recipient profiles with all organ-specific clinical fields |
| `heart_donors` | Ejection fraction, cardiac history |
| `liver_donors` | MELD score, HLA typing |
| `lung_donors` | Total lung capacity, DLCO, FEV1 |
| `pancreas_donors` | Dimensions (L/W/T), insulin levels |

Donor tables are intentionally separated by organ type to allow different clinical schemas per organ. The schema includes seed data across multiple Indian states for local testing.

---

## 🔮 Future Improvements

- 🤖 Retrain ML models on real anonymised clinical transplant datasets
- 📱 Mobile application (React Native) for donors and recipients
- 🔗 NOTTO API integration for live national registry data
- 🏥 EMR system integration to pull clinical data directly from hospitals
- ⛓️ Blockchain audit trail for transparent, immutable organ allocation records
- 📧 Email and SMS alerts via Twilio / SendGrid on critical matches
- 🔒 Tighten CORS policy and add rate limiting for production hardening
- 🫘 Expand organ types — Kidney, Cornea, Bone Marrow

---

## 📞 National Helplines

| Organisation | Contact |
|---|---|
| NOTTO | 1800-11-4770 |
| MOHAN Foundation | 044-45531121 |
| Organ India | +91-11-4050-7777 |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 👩‍💻 Creator

Built by **Ananya Nair**
Vellore Institute of Technology — 2025

---

<div align="center">

**Made with ❤️ to save lives**

⭐ Star this repo if you find it meaningful

</div>
