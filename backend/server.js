// ============================================================
//  HOPELINK — Express.js Backend Server
//  Stack: Node.js + Express + MySQL2
// ============================================================

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, { cors: { origin: "*" } });

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const JWT_SECRET = process.env.JWT_SECRET || 'hopelink_secret_2025_999';

const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────────────
app.use(cors({
    origin: [
        'http://localhost:5500',
        'http://localhost:3000',
        'https://hope-link-organ-donation-system.vercel.app'
    ],
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve frontend static files
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend')));

// ── Authentication Middleware ───────────────────────────────
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied. Please login.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
        req.user = user;
        next();
    });
}

function authorizeRole(role) {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.status(403).json({ error: `Access denied. Requires ${role} role.` });
        }
        next();
    };
}

// ── DB Connection (Using Pool for Stability) ─────────────────
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'organ_donation',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log('✅  MySQL Connection Pool initialized.');

// ── Auth Endpoints ───────────────────────────────────────────
app.post('/api/auth/signup', async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        const hash = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)';
        db.query(query, [name, email, hash, role], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Email already exists.' });
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'User created successfully!' });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(401).json({ error: 'Invalid email or password.' });

        const user = results[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ error: 'Invalid email or password.' });

        const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '2h' });
        res.json({ token, user: { name: user.name, role: user.role } });
    });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
    res.json(req.user);
});

// ── Helper: blood group compatibility ────────────────────────
function compatibleBloodGroups(recipientBG) {
    const compatibility = {
        'O-': ['O-'],
        'O+': ['O-', 'O+'],
        'A-': ['O-', 'A-'],
        'A+': ['O-', 'O+', 'A-', 'A+'],
        'B-': ['O-', 'B-'],
        'B+': ['O-', 'O+', 'B-', 'B+'],
        'AB-': ['O-', 'A-', 'B-', 'AB-'],
        'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']
    };
    return compatibility[recipientBG] || [recipientBG];
}

const axios = require('axios');

// ── Helper: Attach ML Scores ─────────────────────────────────
async function attachMLScores(donors, recipient) {
    const promises = donors.map(async (donor) => {
        try {
            // Get Compatibility Score
            const compRes = await axios.post('http://localhost:5001/predict', {
                donor: donor,
                recipient: recipient
            });
            donor.compatibility_score = compRes.data.compatibility_score;

            // Get Survival Probability
            const survRes = await axios.post('http://localhost:5001/predict-survival', {
                donor: donor,
                recipient: recipient,
                compatibility_score: donor.compatibility_score
            });
            donor.survival_probability = survRes.data.survival_probability;

        } catch (error) {
            console.error('ML API Error:', error.message);
            donor.compatibility_score = null;
            donor.survival_probability = null;
        }
    });
    await Promise.all(promises);
    return donors;
}

// ── Helper: Calculate Urgency Score ──────────────────────────
function calculateUrgency(r) {
    let score = 0;
    const organPoints = { 'Heart': 40, 'Liver': 35, 'Lungs': 25, 'Pancreas': 15 };
    score += (organPoints[r.organ_needed] || 0);

    if (r.organ_needed === 'Liver' && r.meld_score) {
        score += (r.meld_score * 1.2);
    }
    if (r.organ_needed === 'Heart' && r.ejection_frac) {
        if (r.ejection_frac < 40) score += 30;
        else if (r.ejection_frac < 50) score += 15;
    }
    if (r.age > 60 || r.age < 12) score += 10;

    if (score > 80) return "Critical";
    if (score > 60) return "High";
    if (score > 40) return "Moderate";
    return "Stable";
}

// ── POST /api/match — find compatible donors ─────────────────
app.post('/api/match', (req, res) => {
    const data = req.body;
    const {
        organ_needed, blood_group, state,
        // Heart
        prev_cardiac, ejection_frac,
        // Liver
        meld_score, hla_typing,
        // Lungs
        total_lung_cap, dlco, fev1,
        // Pancreas
        pancreas_length, pancreas_width, pancreas_thick, insulin_levels
    } = data;

    if (!organ_needed || !blood_group) {
        return res.status(400).json({ error: 'organ_needed and blood_group are required.' });
    }

    const urgency = calculateUrgency(data);

    const tableMap = {
        'Heart': 'heart_donors',
        'Liver': 'liver_donors',
        'Lungs': 'lung_donors',
        'Pancreas': 'pancreas_donors'
    };

    const table = tableMap[organ_needed];
    if (!table) return res.status(400).json({ error: 'Invalid organ type.' });

    const compatBG = compatibleBloodGroups(blood_group);
    const placeholders = compatBG.map(() => '?').join(',');

    let query = `SELECT * FROM ${table} WHERE available = 'Yes' AND blood_group IN (${placeholders})`;
    let params = [...compatBG];

    // Organ-specific matching conditions
    if (organ_needed === 'Heart') {
        if (prev_cardiac) { query += ` AND prev_cardiac = ?`; params.push(prev_cardiac); }
        if (ejection_frac) { query += ` AND ejection_frac >= ?`; params.push(parseFloat(ejection_frac) - 10); }
    }
    if (organ_needed === 'Liver') {
        if (hla_typing) { query += ` AND hla_typing = ?`; params.push(hla_typing); }
    }
    if (organ_needed === 'Lungs') {
        if (total_lung_cap) { query += ` AND total_lung_cap BETWEEN ? AND ?`; params.push(parseFloat(total_lung_cap) - 1, parseFloat(total_lung_cap) + 1); }
    }

    // Prefer same state, fall back to all states
    const stateQuery = query + ` AND state = ? LIMIT 10`;
    const globalQuery = query + ` LIMIT 10`;

    db.query(stateQuery, [...params, state], async (err, stateResults) => {
        if (err) {
            console.error('Query error:', err);
            return res.status(500).json({ error: 'Database query failed.', details: err.message });
        }

        if (stateResults.length > 0) {
            io.emit('new_match', { organ: organ_needed });
            const donorsWithScores = await attachMLScores(stateResults, data);
            return res.json({ donors: donorsWithScores, scope: 'local', urgency: urgency });
        }

        // fallback — search nationwide
        db.query(globalQuery, params, async (err2, globalResults) => {
            if (err2) return res.status(500).json({ error: 'Database query failed.' });
            if (globalResults.length === 0) return res.status(404).json({ message: 'No matching donors found.', urgency: urgency });
            
            io.emit('new_match', { organ: organ_needed });
            const donorsWithScores = await attachMLScores(globalResults, data);
            return res.json({ donors: donorsWithScores, scope: 'national', urgency: urgency });
        });
    });
});

// ── POST /api/register-donor ─────────────────────────────────
app.post('/api/register-donor', authenticateToken, authorizeRole('donor'), (req, res) => {
    const d = req.body;
    const organ = d.organ;

    const tableMap = {
        'Heart': 'heart_donors',
        'Liver': 'liver_donors',
        'Lungs': 'lung_donors',
        'Pancreas': 'pancreas_donors'
    };

    const table = tableMap[organ];
    if (!table) return res.status(400).json({ error: 'Invalid organ type.' });

    const baseFields = ['name', 'age', 'gender', 'blood_group', 'phone', 'email', 'state', 'available', 'emergency_name', 'relationship', 'emergency_phone'];
    const organFields = {
        'Heart': ['prev_cardiac', 'ejection_frac'],
        'Liver': ['meld_score', 'hla_typing'],
        'Lungs': ['total_lung_cap', 'dlco', 'fev1'],
        'Pancreas': ['pancreas_length', 'pancreas_width', 'pancreas_thick', 'insulin_levels']
    };

    const fields = [...baseFields, ...organFields[organ]];
    const values = fields.map(f => {
        if (f === 'available' && !d[f]) return 'Yes';
        const val = d[f];
        return (val === '' || val === undefined) ? null : val;
    });
    const cols = fields.join(',');
    const qs = fields.map(() => '?').join(',');

    db.query(`INSERT INTO ${table} (${cols}) VALUES (${qs})`, values, (err, result) => {
        if (err) {
            console.error('Insert error:', err);
            return res.status(500).json({ error: 'Registration failed.', details: err.message });
        }
        io.emit('new_donor', { organ: organ, state: d.state });
        return res.json({ message: 'Donor registered successfully!', id: result.insertId });
    });
});

// ── POST /api/register-recipient ─────────────────────────────
app.post('/api/register-recipient', authenticateToken, authorizeRole('recipient'), (req, res) => {
    const d = req.body;
    const fields = ['name', 'age', 'gender', 'blood_group', 'phone', 'email', 'state', 'organ_needed',
        'emergency_name', 'relationship', 'emergency_phone',
        'prev_cardiac', 'ejection_frac', 'meld_score', 'hla_typing',
        'total_lung_cap', 'dlco', 'fev1',
        'pancreas_length', 'pancreas_width', 'pancreas_thick', 'insulin_levels'];
    const values = fields.map(f => {
        const val = d[f];
        return (val === '' || val === undefined) ? null : val;
    });
    const cols = fields.join(',');
    const qs = fields.map(() => '?').join(',');

    db.query(`INSERT INTO recipients (${cols}) VALUES (${qs})`, values, (err, result) => {
        if (err) {
            console.error('Insert error:', err);
            return res.status(500).json({ error: 'Registration failed.', details: err.message });
        }
        return res.json({ message: 'Recipient registered successfully!', id: result.insertId });
    });
});

// ── Dashboard API: Organ Counts per State ────────────────────
app.get('/api/dashboard/organ-counts', authenticateToken, authorizeRole('hospital'), (req, res) => {
    const queries = [
        "SELECT state, COUNT(*) as count FROM heart_donors GROUP BY state",
        "SELECT state, COUNT(*) as count FROM liver_donors GROUP BY state",
        "SELECT state, COUNT(*) as count FROM lung_donors GROUP BY state",
        "SELECT state, COUNT(*) as count FROM pancreas_donors GROUP BY state"
    ];

    Promise.all(queries.map(q => new Promise((resolve, reject) => {
        db.query(q, (err, rows) => err ? reject(err) : resolve(rows));
    })))
    .then(([hearts, livers, lungs, pancreas]) => {
        res.json({ hearts, livers, lungs, pancreas });
    })
    .catch(err => res.status(500).json({ error: err.message }));
});

// ── Dashboard API: Recent Donors ─────────────────────────────
app.get('/api/dashboard/recent-donors', authenticateToken, authorizeRole('hospital'), (req, res) => {
    // We combine all donors and sort by created_at. Since they are in separate tables, we UNION.
    const query = `
        (SELECT name, organ, state, created_at FROM heart_donors)
        UNION ALL
        (SELECT name, organ, state, created_at FROM liver_donors)
        UNION ALL
        (SELECT name, organ, state, created_at FROM lung_donors)
        UNION ALL
        (SELECT name, organ, state, created_at FROM pancreas_donors)
        ORDER BY created_at DESC LIMIT 5
    `;
    db.query(query, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ── Dashboard API: Recent Recipients ──────────────────────────
app.get('/api/dashboard/recent-recipients', authenticateToken, authorizeRole('hospital'), (req, res) => {
    db.query("SELECT name, organ_needed, state, created_at FROM recipients ORDER BY created_at DESC LIMIT 5", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ── Health Check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: "ok", timestamp: new Date() });
});

// ── GET /api/stats — dashboard numbers ───────────────────────
app.get('/api/stats', (req, res) => {
    const queries = [
        "SELECT COUNT(*) AS cnt FROM heart_donors   WHERE available='Yes'",
        "SELECT COUNT(*) AS cnt FROM liver_donors   WHERE available='Yes'",
        "SELECT COUNT(*) AS cnt FROM lung_donors    WHERE available='Yes'",
        "SELECT COUNT(*) AS cnt FROM pancreas_donors WHERE available='Yes'",
        "SELECT COUNT(*) AS cnt FROM recipients"
    ];

    Promise.all(queries.map(q => new Promise((resolve, reject) => {
        db.query(q, (err, rows) => err ? reject(err) : resolve(rows[0].cnt));
    })))
        .then(([hearts, livers, lungs, pancreas, recipients]) => {
            res.json({ hearts, livers, lungs, pancreas, recipients, total: hearts + livers + lungs + pancreas });
        })
        .catch(err => {
            console.error('Stats error:', err);
            // Return zeros if DB not connected
            res.json({ hearts: 0, livers: 0, lungs: 0, pancreas: 0, recipients: 0, total: 0 });
        });
});

// ── Fallback to index.html ────────────────────────────────────
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ── Start server ─────────────────────────────────────────────
server.listen(PORT, () => {
    console.log(`\n🫀  HopeLink server running at http://localhost:${PORT}\n`);
});
