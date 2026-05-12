# 🫀 HopeLink — Organ Donation System

<div align="center">

![HopeLink Banner](frontend/images/hopelink_banner.png)

### *Your Gift Lives On.*

[![Backend](https://img.shields.io/badge/⚙️_Backend-Railway-blueviolet?style=for-the-badge)](https://romantic-balance-production-5ab2.up.railway.app/api/health)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Node](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql)](https://mysql.com)

</div>

---

## 🌐 Live Demo

> 🚀 **[View Live Project](https://hope-link-organ-donation-system.vercel.app)**

Frontend deployed on **Vercel** · Backend deployed on **Railway**

---

## 📌 About

India's deceased organ donation rate remains critically low — below one donor per million population. Thousands of patients lose their lives each year waiting for a compatible organ, worsened by fragmented coordination and delayed matching.

**HopeLink** is a full-stack, AI-assisted organ donation platform built to address this gap. It provides intelligent donor-recipient matching, survival probability estimation, real-time notifications, and a hospital command center — all in a single web application.

> This project was developed as an academic proof-of-concept. The ML models are trained on synthetically generated data and are not validated on real clinical datasets.

---

## ✨ Implemented Features

| Feature | Details |
|---|---|
| 🔍 **AI Compatibility Matching** | Random Forest model calculates a 0–100% match score based on blood group, age difference, organ-specific metrics, and geographic proximity |
| 📊 **Survival Prediction** | Logistic Regression model estimates transplant success probability for each donor-recipient pairing |
| ⚡ **Real-time Notifications** | Socket.io pushes instant toast notifications and bell alerts when a new donor registers or a match is made |
| 🏥 **Hospital Dashboard** | Role-protected dashboard with organ distribution bar chart, doughnut chart, and recent donor/recipient activity tables (Chart.js) |
| 🛡️ **Role-based Authentication** | JWT auth with three roles: `donor`, `recipient`, and `hospital`. Protected endpoints enforce role-specific access |
| 📍 **Geographic Priority Matching** | Matching first queries donors in the recipient's state; falls back to a national search if no local match is found |
| 🌡️ **Urgency Scoring** | Dynamic triage classification (Critical / High / Moderate / Stable) based on organ type, MELD score, and ejection fraction |
| 🩸 **Blood Group Compatibility Engine** | Full ABO compatibility matrix enforced server-side before any other matching criteria |

---

## 🧬 Matching Logic

HopeLink uses a three-tier filtering pipeline:

### Tier 1 — Blood Group Compatibility
Strict ABO compatibility is enforced using a full donor/recipient matrix (e.g. O- as universal donor, AB+ as universal recipient). Incompatible blood groups are excluded before any further processing.

### Tier 2 — Organ-Specific Clinical Criteria
Each organ type applies its own matching conditions:

- ❤️ **Heart** — Ejection Fraction within ±10% range + previous cardiac history check
- 🫀 **Liver** — HLA Typing match + MELD score filtering
- 🫁 **Lungs** — Total Lung Capacity within ±1L tolerance + DLCO and FEV1 metrics
- 🫐 **Pancreas** — Dimension matching (length/width/thickness) + insulin secretion level

### Tier 3 — Geographic and ML Scoring
- Same-state donors are prioritised to minimise ischemic time
- If no local match exists, the search expands nationally
- The **MatchPredictor** (Random Forest) and **SurvivalPredictor** (Logistic Regression) then attach percentage-based confidence scores to each result

---

## 🛠️ Tech Stack

### Frontend
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Socket.io](https://img.shields.io/badge/Socket.io_Client-010101?style=flat&logo=socket.io)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=flat&logo=chartdotjs&logoColor=white)

### Backend
![Express.js](https://img.shields.io/badge/Express.js-000000?style=flat&logo=express&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat&logo=socket.io)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat&logo=jsonwebtokens)
![Bcryptjs](https://img.shields.io/badge/Bcryptjs-000000?style=flat&logo=npm)
![MySQL2](https://img.shields.io/badge/MySQL2-4479A1?style=flat&logo=mysql&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat&logo=axios)

### AI / ML
![Flask](https://img.shields.io/badge/Flask-000000?style=flat&logo=flask)
![Scikit-learn](https://img.shields.io/badge/Scikit--learn-F7931E?style=flat&logo=scikit-learn&logoColor=white)
![Joblib](https://img.shields.io/badge/Joblib-grey?style=flat)
![Pandas](https://img.shields.io/badge/Pandas-150458?style=flat&logo=pandas&logoColor=white)
![NumPy](https://img.shields.io/badge/NumPy-013243?style=flat&logo=numpy)

### Database
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat&logo=mysql&logoColor=white)

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
Import the schema into your MySQL server:
```bash
mysql -u your_user -p < database/schema.sql
```
This creates the `organ_donation` database with all tables and seed data.

### 3. Configure and start the backend
```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your database credentials:
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
The backend serves both the REST API and the frontend static files at `http://localhost:3000`.

### 4. Start the ML inference server
```bash
cd ../ml
pip install -r requirements.txt
python app.py
```
The Flask server runs on `http://localhost:5001`. If it is not running, the matching endpoint will still return donor results — compatibility and survival scores will be `null`.

### 5. Open in browser
```
http://localhost:3000
```

---

## 📁 Project Structure

```
HopeLink-Organ-Donation-System/
├── frontend/
│   ├── index.html              # Single-page application
│   ├── style.css               # All styles
│   ├── app.js                  # Frontend logic, API calls, Socket.io client, dashboard charts
│   ├── vercel.json             # Vercel deployment config
│   └── images/                 # Background images and video assets
├── backend/
│   ├── server.js               # Express.js REST API + Socket.io server
│   ├── package.json            # Node.js dependencies
│   ├── Procfile                # Railway deployment config
│   └── .env.example            # Environment variables template
├── ml/
│   ├── app.py                  # Flask ML inference server (port 5001)
│   ├── matching_model.py       # Random Forest model training script
│   ├── survival_model.py       # Logistic Regression model training script
│   ├── predict.py              # MatchPredictor class
│   ├── requirements.txt        # Python dependencies
│   └── ml/                     # Serialised model files (model.pkl, survival_model.pkl)
├── database/
│   └── schema.sql              # MySQL schema and seed data
└── README.md
```

---

## 🔌 API Reference

All endpoints are relative to the base URL (`http://localhost:3000`).

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/health` | Health check | No |
| GET | `/api/stats` | Donor and recipient counts | No |
| POST | `/api/match` | Find compatible donors for a recipient | No |
| POST | `/api/auth/signup` | Create a new user account | No |
| POST | `/api/auth/login` | Login and receive a JWT token | No |
| GET | `/api/auth/me` | Get current authenticated user | Yes |
| POST | `/api/register-donor` | Register a new organ donor | Yes — `donor` role |
| POST | `/api/register-recipient` | Register a new recipient | Yes — `recipient` role |
| GET | `/api/dashboard/organ-counts` | Organ counts grouped by state | Yes — `hospital` role |
| GET | `/api/dashboard/recent-donors` | Latest 5 registered donors | Yes — `hospital` role |
| GET | `/api/dashboard/recent-recipients` | Latest 5 registered recipients | Yes — `hospital` role |

Protected endpoints require an `Authorization: Bearer <token>` header.

---

## 🤖 ML Models

Both models are trained on **synthetically generated data** using heuristic rules as a proof of concept. They are not trained on real clinical transplant records.

| Model | Algorithm | Purpose |
|---|---|---|
| MatchPredictor | Random Forest (100 estimators) | Predicts donor-recipient compatibility as a 0–100% score |
| SurvivalPredictor | Logistic Regression | Estimates post-transplant success probability as a 0–100% score |

Models are serialised with `joblib` and stored in `ml/ml/`. If the `.pkl` files are missing, they are automatically retrained from scratch when `app.py` starts.

---

## 🗄️ Database Schema

Five tables are defined in `database/schema.sql`:

| Table | Description |
|---|---|
| `users` | Authenticated users with roles: `donor`, `recipient`, `hospital` |
| `recipients` | Recipient profiles with organ-specific clinical fields |
| `heart_donors` | Heart donor profiles (ejection fraction, cardiac history) |
| `liver_donors` | Liver donor profiles (MELD score, HLA typing) |
| `lung_donors` | Lung donor profiles (total lung capacity, DLCO, FEV1) |
| `pancreas_donors` | Pancreas donor profiles (dimensions, insulin levels) |

The schema includes seed data for testing across multiple Indian states.

---

## 🏗️ Architecture Overview

```
Browser (Vercel)
      │
      │  HTTP / WebSocket
      ▼
Express.js Server (Railway · port 3000)
      │                    │
      │ MySQL2             │ Axios (HTTP)
      ▼                    ▼
MySQL Database      Flask ML Server
(organ_donation)    (localhost · port 5001)
```

- The backend serves the frontend as static files in production
- Socket.io runs on the same Express HTTP server
- The ML server is a separate Flask process; the backend calls it internally per match request
- In the live deployment, the ML server is co-located with the backend on Railway

---

## 🔮 Future Scope

- 📱 Mobile application (React Native)
- 🤖 ML models trained on real anonymised clinical datasets
- 🏥 EMR system integration
- 🔗 NOTTO (National Organ and Tissue Transplant Organisation) API integration
- ⛓️ Blockchain-based transparent organ allocation ledger
- 🌍 Expansion beyond India

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
