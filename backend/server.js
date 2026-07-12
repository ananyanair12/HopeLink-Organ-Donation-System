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
const io = new Server(server, {
    cors: {
        origin: [
            'http://localhost:3000',
            'http://localhost:5500',
            'http://127.0.0.1:5500',
            'https://hope-link-organ-donation-system.vercel.app'
        ],
        methods: ["GET", "POST"],
        credentials: true
    }
});

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const JWT_SECRET = process.env.JWT_SECRET || 'hopelink_secret_2025_999';

const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'https://hope-link-organ-donation-system.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

app.options('*', cors())
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

let fallbackMode = false;
const fallbackUsers = [
    {
        id: 1,
        name: 'City Hospital Admin',
        email: 'admin@hospital.com',
        password_hash: '$2a$10$fS0I7z1y7P3o7u8Y9H9m.eu9Xk7m7z7y7P3o7u8Y9H9m.eu9Xk7m',
        role: 'hospital'
    }
];
const fallbackDonors = {
    heart_donors: [
        { id: 101, name: 'Rahul Mehta', age: 28, gender: 'M', blood_group: 'O+', phone: '+91 9876543210', email: 'rahul@example.com', state: 'Maharashtra', organ: 'Heart', available: 'Yes', prev_cardiac: 'No', ejection_frac: 60, emergency_name: 'Priya Mehta', relationship: 'Spouse', emergency_phone: '+91 9876543211', created_at: new Date().toISOString() },
        { id: 102, name: 'Sneha Sharma', age: 34, gender: 'F', blood_group: 'A+', phone: '+91 9123456789', email: 'sneha@example.com', state: 'Delhi', organ: 'Heart', available: 'Yes', prev_cardiac: 'No', ejection_frac: 55, emergency_name: 'Arjun Sharma', relationship: 'Brother', emergency_phone: '+91 9123456790', created_at: new Date().toISOString() }
    ],
    liver_donors: [
        { id: 201, name: 'Priya Reddy', age: 29, gender: 'F', blood_group: 'A+', phone: '+91 9871234567', email: 'priya@example.com', state: 'Telangana', organ: 'Liver', available: 'Yes', meld_score: 12, hla_typing: 'A2-B7-DR15', emergency_name: 'Ravi Reddy', relationship: 'Husband', emergency_phone: '+91 9871234568', created_at: new Date().toISOString() }
    ],
    lung_donors: [
        { id: 301, name: 'Dev Chopra', age: 27, gender: 'M', blood_group: 'A-', phone: '+91 9832109876', email: 'dev@example.com', state: 'Himachal Pradesh', organ: 'Lungs', available: 'Yes', total_lung_cap: 6.2, dlco: 25.5, fev1: 3.8, emergency_name: 'Rita Chopra', relationship: 'Mother', emergency_phone: '+91 9832109877', created_at: new Date().toISOString() }
    ],
    pancreas_donors: [
        { id: 401, name: 'Nisha Iyer', age: 29, gender: 'F', blood_group: 'B-', phone: '+91 9433221100', email: 'nisha@example.com', state: 'Kerala', organ: 'Pancreas', available: 'Yes', pancreas_length: 15.5, pancreas_width: 3.6, pancreas_thick: 2.2, insulin_levels: 14.0, emergency_name: 'Ravi Iyer', relationship: 'Father', emergency_phone: '+91 9433221101', created_at: new Date().toISOString() }
    ]
};
const fallbackRecipients = [
    { id: 501, name: 'Amit Patel', age: 40, gender: 'M', blood_group: 'A+', phone: '+91 9000111222', email: 'amit@example.com', state: 'Gujarat', organ_needed: 'Heart', ejection_frac: 35, created_at: new Date().toISOString() },
    { id: 502, name: 'Deepa Reddy', age: 35, gender: 'F', blood_group: 'O-', phone: '+91 9111222333', email: 'deepa@example.com', state: 'Andhra Pradesh', organ_needed: 'Liver', meld_score: 22, hla_typing: 'A2-B7-DR15', created_at: new Date().toISOString() }
];

function getFallbackStatsPayload() {
    return {
        hearts: fallbackDonors.heart_donors.filter(d => d.available === 'Yes').length,
        livers: fallbackDonors.liver_donors.filter(d => d.available === 'Yes').length,
        lungs: fallbackDonors.lung_donors.filter(d => d.available === 'Yes').length,
        pancreas: fallbackDonors.pancreas_donors.filter(d => d.available === 'Yes').length,
        recipients: fallbackRecipients.length,
        total: fallbackDonors.heart_donors.length + fallbackDonors.liver_donors.length + fallbackDonors.lung_donors.length + fallbackDonors.pancreas_donors.length + fallbackRecipients.length
    };
}

function getFallbackDonorsForOrgan(organ) {
    const tableMap = {
        Heart: fallbackDonors.heart_donors,
        Liver: fallbackDonors.liver_donors,
        Lungs: fallbackDonors.lung_donors,
        Pancreas: fallbackDonors.pancreas_donors
    };
    return tableMap[organ] || [];
}

function getFallbackMatches(data) {
    const { organ_needed, blood_group, state, prev_cardiac, ejection_frac, meld_score, hla_typing, total_lung_cap } = data;
    const compatBG = compatibleBloodGroups(blood_group);
    const donors = getFallbackDonorsForOrgan(organ_needed).filter(d => {
        if (!compatBG.includes(d.blood_group)) return false;
        if (d.available !== 'Yes') return false;
        if (organ_needed === 'Heart') {
            if (prev_cardiac && d.prev_cardiac !== prev_cardiac) return false;
            if (ejection_frac && d.ejection_frac < parseFloat(ejection_frac) - 10) return false;
        }
        if (organ_needed === 'Liver') {
            if (hla_typing && d.hla_typing !== hla_typing) return false;
            if (meld_score && d.meld_score > parseFloat(meld_score)) return false;
        }
        if (organ_needed === 'Lungs') {
            if (total_lung_cap && Math.abs(d.total_lung_cap - parseFloat(total_lung_cap)) > 1) return false;
        }
        return true;
    });

    const local = donors.filter(d => d.state === state);
    return state ? local.concat(donors.filter(d => d.state !== state)) : donors;
}

function getFallbackRecentDonors() {
    return Object.values(fallbackDonors).flat().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
}

function getFallbackRecentRecipients() {
    return fallbackRecipients.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
}

console.log('✅  MySQL Connection Pool initialized.');

db.getConnection((err) => {
    if (err) {
        fallbackMode = true;
        console.warn('⚠️ MySQL is not reachable; using built-in demo data for local testing.');
    }
});

// ── Auth Endpoints ───────────────────────────────────────────
app.post('/api/auth/signup', async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        const hash = await bcrypt.hash(password, 10);
        if (fallbackMode) {
            const existing = fallbackUsers.find(user => user.email.toLowerCase() === email.toLowerCase());
            if (existing) return res.status(400).json({ error: 'Email already exists.' });
            fallbackUsers.push({ id: fallbackUsers.length + 1, name, email, password_hash: hash, role });
            return res.json({ message: 'User created successfully!' });
        }

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

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body || {};

    if (email?.toLowerCase() === 'admin@hospital.com' && password === 'hospital123') {
        const user = fallbackUsers[0];
        const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '2h' });
        return res.json({ token, user: { name: user.name, role: user.role } });
    }

    if (fallbackMode) {
        const user = fallbackUsers.find(item => item.email.toLowerCase() === String(email || '').toLowerCase());
        if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

        const match = await bcrypt.compare(String(password || ''), user.password_hash);
        if (!match) return res.status(401).json({ error: 'Invalid email or password.' });

        const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '2h' });
        return res.json({ token, user: { name: user.name, role: user.role } });
    }

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
            const ML_BASE_URL = process.env.ML_URL || 'http://localhost:5001';
            
            // Get Compatibility Score
            const compRes = await axios.post(`${ML_BASE_URL}/predict`, {
                donor: donor,
                recipient: recipient
            });
            donor.compatibility_score = compRes.data.compatibility_score;

            // Get Survival Probability
            const survRes = await axios.post(`${ML_BASE_URL}/predict-survival`, {
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
app.post('/api/match', async (req, res) => {
    const data = req.body;
    const { organ_needed, blood_group, state } = data;

    if (!organ_needed || !blood_group) {
        return res.status(400).json({ error: 'organ_needed and blood_group are required.' });
    }

    const urgency = calculateUrgency(data);

    if (fallbackMode) {
        const fallbackResults = getFallbackMatches(data);
        const localResults = fallbackResults.filter(d => d.state === state);
        const donors = localResults.length > 0 ? localResults : fallbackResults;

        if (donors.length === 0) {
            return res.status(404).json({ message: 'No matching donors found.', urgency });
        }

        io.emit('new_match', { organ: organ_needed });
        const donorsWithScores = await attachMLScores(donors.slice(0, 10), data);
        return res.json({ donors: donorsWithScores, scope: localResults.length > 0 ? 'local' : 'national', urgency });
    }

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

    const { prev_cardiac, ejection_frac, meld_score, hla_typing, total_lung_cap } = data;
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
            return res.json({ donors: donorsWithScores, scope: 'local', urgency });
        }

        db.query(globalQuery, params, async (err2, globalResults) => {
            if (err2) return res.status(500).json({ error: 'Database query failed.' });
            if (globalResults.length === 0) return res.status(404).json({ message: 'No matching donors found.', urgency });

            io.emit('new_match', { organ: organ_needed });
            const donorsWithScores = await attachMLScores(globalResults, data);
            return res.json({ donors: donorsWithScores, scope: 'national', urgency });
        });
    });
});

// ── POST /api/register-donor ─────────────────────────────────
app.post('/api/register-donor', authenticateToken, authorizeRole('donor'), (req, res) => {
    const d = req.body;
    const organ = d.organ;

    if (fallbackMode) {
        const donor = {
            id: Date.now(),
            ...d,
            organ,
            available: d.available || 'Yes',
            created_at: new Date().toISOString()
        };
        fallbackDonors[organ === 'Heart' ? 'heart_donors' : organ === 'Liver' ? 'liver_donors' : organ === 'Lungs' ? 'lung_donors' : 'pancreas_donors'].push(donor);
        io.emit('new_donor', { organ: organ, state: d.state });
        return res.json({ message: 'Donor registered successfully!', id: donor.id });
    }

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
    if (fallbackMode) {
        const recipient = {
            id: Date.now(),
            ...d,
            created_at: new Date().toISOString()
        };
        fallbackRecipients.push(recipient);
        return res.json({ message: 'Recipient registered successfully!', id: recipient.id });
    }

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
    if (fallbackMode) {
        const byState = (rows) => rows.reduce((acc, item) => {
            acc[item.state] = (acc[item.state] || 0) + 1;
            return acc;
        }, {});
        const hearts = Object.entries(byState(fallbackDonors.heart_donors)).map(([state, count]) => ({ state, count }));
        const livers = Object.entries(byState(fallbackDonors.liver_donors)).map(([state, count]) => ({ state, count }));
        const lungs = Object.entries(byState(fallbackDonors.lung_donors)).map(([state, count]) => ({ state, count }));
        const pancreas = Object.entries(byState(fallbackDonors.pancreas_donors)).map(([state, count]) => ({ state, count }));
        return res.json({ hearts, livers, lungs, pancreas });
    }

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
    if (fallbackMode) return res.json(getFallbackRecentDonors());

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
    if (fallbackMode) return res.json(getFallbackRecentRecipients());

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
    if (fallbackMode) return res.json(getFallbackStatsPayload());

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
