// ============================================================
//  HOPELINK — Express.js Backend Server
//  Stack: Node.js + Express + MySQL2
// ============================================================

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve frontend static files
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend')));

// ── DB Connection ────────────────────────────────────────────
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'organ_donation',
    port: process.env.DB_PORT || 3306
});

db.connect((err) => {
    if (err) {
        console.error('❌  DB connection failed:', err.message);
        console.warn('⚠️   Server running without database. Import database/schema.sql first.');
    } else {
        console.log('✅  Connected to MySQL database.');
    }
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

    db.query(stateQuery, [...params, state], (err, stateResults) => {
        if (err) {
            console.error('Query error:', err);
            return res.status(500).json({ error: 'Database query failed.', details: err.message });
        }

        if (stateResults.length > 0) {
            return res.json({ donors: stateResults, scope: 'local' });
        }

        // fallback — search nationwide
        db.query(globalQuery, params, (err2, globalResults) => {
            if (err2) return res.status(500).json({ error: 'Database query failed.' });
            if (globalResults.length === 0) return res.status(404).json({ message: 'No matching donors found.' });
            return res.json({ donors: globalResults, scope: 'national' });
        });
    });
});

// ── POST /api/register-donor ─────────────────────────────────
app.post('/api/register-donor', (req, res) => {
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
        return d[f] ?? null;
    });
    const cols = fields.join(',');
    const qs = fields.map(() => '?').join(',');

    db.query(`INSERT INTO ${table} (${cols}) VALUES (${qs})`, values, (err, result) => {
        if (err) {
            console.error('Insert error:', err);
            return res.status(500).json({ error: 'Registration failed.', details: err.message });
        }
        return res.json({ message: 'Donor registered successfully!', id: result.insertId });
    });
});

// ── POST /api/register-recipient ─────────────────────────────
app.post('/api/register-recipient', (req, res) => {
    const d = req.body;
    const fields = ['name', 'age', 'gender', 'blood_group', 'phone', 'email', 'state', 'organ_needed',
        'emergency_name', 'relationship', 'emergency_phone',
        'prev_cardiac', 'ejection_frac', 'meld_score', 'hla_typing',
        'total_lung_cap', 'dlco', 'fev1',
        'pancreas_length', 'pancreas_width', 'pancreas_thick', 'insulin_levels'];
    const values = fields.map(f => d[f] ?? null);
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
app.listen(PORT, () => {
    console.log(`\n🫀  HopeLink server running at http://localhost:${PORT}\n`);
});
