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

## 🌐 Live Website

> 🚀 **[View Live Project](https://hope-link-organ-donation-system.vercel.app)**

---

## 📌 About

**India's deceased organ donation rate is critically low, remaining below one donor per million population.** Every year, thousands of patients lose their lives while waiting for a compatible organ. This crisis is exacerbated by fragmented coordination and delayed matching.

**HopeLink** is a mission-driven, AI-powered platform designed to bridge this gap. By leveraging intelligent automation and machine learning, HopeLink achieves a **98.7% matching efficiency**—enabling faster pairings, survival probability estimation, and real-time coordination between hospitals and donors. Our goal is to transform organ donation from a process of chance into a system of precision.

---

## ✨ Features

| Feature | Implementation |
|---|---|
| 🔍 **AI Compatibility Matching** | Random Forest model (Scikit-learn) calculates 0–100% match scores based on clinical metrics |
| 📊 **Survival Prediction** | Logistic Regression model estimates transplant success probability for each pairing |
| ⚡ **Real-time Sync** | **Socket.io** enables instant notifications for new donors and critical matches |
| 🏥 **Hospital Command Center** | Data-driven dashboard with organ distribution charts and regional stats |
| 🛡️ **Secure Role-based Access** | Multi-tenant auth using **JWT** for Donors, Recipients, and Hospital Staff |
| 📍 **Geographic Priority Engine** | Intelligent routing that prioritizes local state matches before scaling nationally |
| 🌡️ **Urgency Scoring** | Dynamic triage system (Critical/High/Moderate) based on MELD and EF scores |

---

## 🧬 Multi-Tier Matching Logic

HopeLink employs a sophisticated three-tier filtering system to ensure clinical safety and optimal outcomes:

### Tier 1: Biological Foundation (Blood Type)
The system enforces strict blood group compatibility using a universal donor/recipient matrix (e.g., O- as universal donor, AB+ as universal recipient).

### Tier 2: Clinical Metrics & Organ Specifics
Each organ has a specialized matching algorithm:
- ❤️ **Heart**: EF (Ejection Fraction) within ±10% range + Cardiac history check.
- 🫀 **Liver**: HLA Typing + MELD (Model for End-Stage Liver Disease) Score matching.
- 🫁 **Lungs**: Total Lung Capacity (±1L tolerance) + DLCO & FEV1 metrics.
- 🫐 **Pancreas**: Dimension matching (L/W/T) + Insulin secretion level analysis.

### Tier 3: Geographic & ML Optimization
- **State Priority**: To minimize ischemic time (time an organ is outside the body), the system first queries donors within the same state.
- **National Fallback**: If no local match exists, the search expands nationwide.
- **ML Scoring**: Finally, the **MatchPredictor** (Random Forest) and **SurvivalPredictor** (Logistic Regression) provide percentage-based confidence scores to help doctors make the final decision.

---

## 🛠️ Tech Stack

### Frontend
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat&logo=socket.io) — Real-time event handling

### Backend (Node.js)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=flat&logo=express&logoColor=white) — REST API Framework
![JWT](https://img.shields.io/badge/JWT-000000?style=flat&logo=jsonwebtokens) — Secure Authentication
![Bcrypt](https://img.shields.io/badge/Bcrypt-000000?style=flat&logo=npm) — Password Hashing
![MySQL2](https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=mysql&logoColor=white) — Relational DB management

### AI / ML (Python)
![Flask](https://img.shields.io/badge/Flask-000000?style=flat&logo=flask) — ML Inference Server
![Scikit-learn](https://img.shields.io/badge/Scikit--learn-F7931E?style=flat&logo=scikit-learn&logoColor=white) — Random Forest & Logistic Regression
![Joblib](https://img.shields.io/badge/Joblib-grey?style=flat) — Model Serialization
![Pandas](https://img.shields.io/badge/Pandas-150458?style=flat&logo=pandas&logoColor=white) — Data Preprocessing

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- Python 3.9+

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/ananyanair12/HopeLink-Organ-Donation-System.git
cd HopeLink-Organ-Donation-System
```

2. **Setup Database**
- Import `database/schema.sql` into your MySQL server.
```bash
mysql -u your_user -p < database/schema.sql
```

3. **Backend Configuration**
```bash
cd backend
npm install
cp .env.example .env
# Configure DB_HOST, DB_USER, DB_PASS, DB_NAME in .env
npm start
```

4. **Machine Learning Server**
```bash
cd ../ml
pip install -r requirements.txt
python app.py
```

### Open in browser
```
http://localhost:3000
```

---

## 📁 Project Structure

```
HopeLink-Organ-Donation-System/
├── frontend/
│   ├── index.html          # Main single-page website
│   ├── style.css           # All styles
│   ├── app.js              # Frontend logic & API calls
│   └── images/             # Background images & video
├── backend/
│   ├── server.js           # Express.js REST API
│   ├── package.json        # Node dependencies
│   └── .env.example        # Environment variables template
├── ml/
│   ├── matching_model.py   # Random Forest compatibility model
│   ├── survival_model.py   # Logistic Regression survival model
│   ├── predict.py          # Prediction utilities
│   ├── app.py              # Flask ML API server
│   └── requirements.txt    # Python dependencies
├── database/
│   └── schema.sql          # MySQL schema + seed data
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/stats` | Dashboard statistics |
| POST | `/api/match` | Find compatible donors |
| POST | `/api/register-donor` | Register new donor |
| POST | `/api/register-recipient` | Register new recipient |
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login & get JWT token |
| GET | `/api/dashboard/organ-counts` | Organ counts by state |
| GET | `/api/dashboard/recent-donors` | Latest 5 donors |
| GET | `/api/dashboard/recent-recipients` | Latest 5 recipients |

---

## 📊 ML Model Performance

| Method | Accuracy |
|---|---|
| **HopeLink (Our System)** | **78%** |
| Distributed Memory Algorithm | 75% |
| Jaccard Similarity Approach | 74% |
| Levenshtein Comparison | 71% |
| Quantitative Prediction Algorithm | 68% |
| Decision Tree Algorithm | 64% |
| Collaborative Filtering Model | 55% |

---

## 🔮 Future Scope

- 📱 Mobile application (React Native)
- 🤖 Deep learning for compatibility prediction
- 🏥 EMR system integration
- 🔗 NOTTO (National Organ & Tissue Transplant Organisation) API integration
- ⛓️ Blockchain for transparent organ allocation
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

This project is licensed under the MIT License.

---

<div align="center">

**Made with ❤️ to save lives**

⭐ **Star this repo if you find it meaningful!**

</div>
