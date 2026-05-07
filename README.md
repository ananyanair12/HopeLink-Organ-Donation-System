# 🫀 HopeLink — Organ Donation System



---

## Project Structure

```
organ-donation-system/
├── frontend/
│   ├── index.html      ← Main website (single-page)
│   ├── style.css       ← All styles
│   └── app.js          ← Frontend logic (API calls, form handling)
├── backend/
│   ├── server.js       ← Express.js server
│   └── package.json    ← Node dependencies
├── database/
│   └── schema.sql      ← MySQL schema + seed data
└── README.md
```

---

## Tech Stack

| Layer    | Technology                   |
|----------|------------------------------|
| Frontend | HTML5, CSS3, Vanilla JS      |
| Backend  | Node.js + Express.js         |
| Database | MySQL 8.0                    |
| Middleware | body-parser, cors, mysql2  |

---

## Setup Instructions

### 1. Database

```bash
# Log into MySQL
mysql -u root -p

# Run the schema (creates DB, tables, and seed data)
source /path/to/database/schema.sql
```

### 2. Backend

```bash
cd backend

# Install dependencies
npm install

# Start the server (production)
npm start

# OR with hot-reload (development)
npm run dev
```

The server runs on **http://localhost:3000**

**Environment variables** (optional — defaults shown):
```
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=organ_donation
DB_PORT=3306
PORT=3000
```

### 3. Frontend

The frontend is automatically served by the Express server at **http://localhost:3000**.

To develop the frontend standalone, open `frontend/index.html` directly in a browser — note that API calls will still require the backend to be running.

---

## API Endpoints

| Method | Path                      | Description                     |
|--------|---------------------------|---------------------------------|
| GET    | `/api/stats`              | Dashboard statistics             |
| POST   | `/api/register-donor`     | Register a new organ donor       |
| POST   | `/api/register-recipient` | Register a new recipient         |
| POST   | `/api/match`              | Find compatible donors           |

### POST `/api/match` — Body example (Heart)
```json
{
  "organ_needed": "Heart",
  "blood_group": "O+",
  "state": "Maharashtra",
  "prev_cardiac": "No",
  "ejection_frac": 50
}
```

### POST `/api/register-donor` — Body example
```json
{
  "name": "Rahul Mehta",
  "age": 28,
  "gender": "M",
  "blood_group": "O+",
  "phone": "+91 9876543210",
  "email": "rahul@example.com",
  "state": "Maharashtra",
  "organ": "Heart",
  "available": "Yes",
  "prev_cardiac": "No",
  "ejection_frac": 60,
  "emergency_name": "Priya Mehta",
  "relationship": "Spouse",
  "emergency_phone": "+91 9876543211"
}
```

---

## Matching Algorithm

1. **Blood Group Compatibility** — Uses full ABO/Rh compatibility table (e.g. O- can donate to all; AB+ can receive from all).
2. **Organ-Specific Matching** —
   - **Heart**: Ejection Fraction ± 10, cardiac history filter
   - **Liver**: HLA typing match
   - **Lungs**: Total Lung Capacity ± 1L
   - **Pancreas**: Direct blood group match
3. **Geographic Priority** — Searches same-state donors first, falls back to national search.

---

## Future Scope

- React.js / Vue.js modern frontend rebuild
- JWT authentication & role-based access
- Real-time notifications (WebSockets)
- Geolocation-based radius search
- Mobile application (React Native)
- EMR system integration
- Machine learning for compatibility scoring

---

## References

1. NOTTO — National Organ & Tissue Transplant Organisation
2. Drishti IAS — Organ Donation in India statistics
3. TandFOnline — IJGM.S393240 (organ donation challenges)
