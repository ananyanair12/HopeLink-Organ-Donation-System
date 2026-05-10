# 🫀 HopeLink — Organ Donation System

<div align="center">

![HopeLink Banner](frontend/images/hopelink_banner.png)

### *Your Gift Lives On.*

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Visit_Website-gold?style=for-the-badge)](https://hope-link-organ-donation-system.vercel.app)
[![Backend](https://img.shields.io/badge/⚙️_Backend-Railway-blueviolet?style=for-the-badge)](https://romantic-balance-production-5ab2.up.railway.app/api/health)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Node](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql)](https://mysql.com)

</div>

---

## 🌐 Live Website

> **[https://hope-link-organ-donation-system.vercel.app](https://hope-link-organ-donation-system.vercel.app)**

---

## 📌 About

**HopeLink** is an AI-powered organ donation platform that connects organ donors with recipients across India — faster, smarter, and with compassion at its core.

India's deceased organ donation rate has remained **below one donor per million population** for over a decade. Thousands of patients lose their lives every year waiting for a suitable organ. HopeLink addresses this crisis through a centralised, accessible, and intelligent matching platform.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔍 **AI Donor Matching** | Matches recipients with compatible donors using blood group compatibility + organ-specific parameters |
| 🧠 **ML Compatibility Scoring** | Random Forest model scores each donor-recipient pair 0–100% |
| 📊 **Survival Prediction** | Logistic Regression model estimates transplant success probability |
| 🏥 **Hospital Dashboard** | Real-time stats, charts (donors by state, organ distribution), recent activity |
| 🔔 **Real-time Notifications** | Socket.io powered alerts for new donors and matches |
| 🔐 **JWT Authentication** | Secure login for donors, recipients, and hospital staff |
| 📍 **Location Priority** | Searches same-state donors first, falls back to national |
| 📱 **Fully Responsive** | Works on desktop, tablet, and mobile |

---

## 🧬 Organ Matching Logic

| Organ | Matching Parameters |
|---|---|
| ❤️ Heart | Blood group + Ejection Fraction (±10%) + Cardiac history |
| 🫀 Liver | Blood group + HLA Typing + MELD Score |
| 🫁 Lungs | Blood group + Total Lung Capacity (±1L) + DLCO + FEV1 |
| 🫐 Pancreas | Blood group + Dimensions + Insulin Secretion Levels |

---

## 🛠️ Tech Stack

### Frontend
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat&logo=socket.io)

### Backend
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=flat&logo=express&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat&logo=jsonwebtokens)

### AI / ML
![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-000000?style=flat&logo=flask)
![Scikit-learn](https://img.shields.io/badge/Scikit--learn-F7931E?style=flat&logo=scikit-learn&logoColor=white)

### Database & Deployment
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=mysql&logoColor=white)
![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=flat&logo=railway)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- Python 3.9+

### Installation

```bash
# Clone the repository
git clone https://github.com/ananyanair12/HopeLink-Organ-Donation-System.git
cd HopeLink-Organ-Donation-System

# Setup database
mysql -u root -p < database/schema.sql

# Install backend dependencies
cd backend
npm install

# Create environment file
cp .env.example .env
# Edit .env with your database credentials

# Start backend server
npm start
```

### Run ML Server (optional)
```bash
cd ml
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
