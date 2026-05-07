/* ============================================================
   HOPELINK — Frontend JavaScript
   ============================================================ */

const API = 'http://localhost:3000/api';

// ── Nav scroll highlight ─────────────────────────────────────
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');

const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            navLinks.forEach(l => l.classList.remove('active'));
            const active = document.querySelector(`.nav-link[href="#${e.target.id}"]`);
            if (active) active.classList.add('active');
        }
    });
}, { threshold: 0.4 });

sections.forEach(s => observer.observe(s));

// Hamburger menu
document.getElementById('hamburger').addEventListener('click', () => {
    document.querySelector('.nav-links').classList.toggle('open');
});

// ── Load stats ───────────────────────────────────────────────
async function loadStats() {
    try {
        const r = await fetch(`${API}/stats`);
        if (!r.ok) return;
        const data = await r.json();
        document.getElementById('stat-total').textContent = data.total || '—';
        document.getElementById('stat-recip').textContent = data.recipients || '—';
    } catch (_) {
        // Server not running — leave dashes
    }
}
loadStats();

// ── Register tabs ────────────────────────────────────────────
let currentRole = 'donor';
document.querySelectorAll('.reg-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.reg-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentRole = tab.dataset.role;

        const organLabel = document.getElementById('organ-label');
        const btnText = document.getElementById('reg-btn-text');
        if (currentRole === 'donor') {
            organLabel.textContent = 'Donate';
            btnText.textContent = 'Register as Donor';
        } else {
            organLabel.textContent = 'Receive';
            btnText.textContent = 'Register as Recipient';
        }
    });
});

// ── Show organ-specific fields ───────────────────────────────
function showOrganFields(organ, prefix = '') {
    ['heart', 'liver', 'lungs', 'pancreas'].forEach(o => {
        const el = document.getElementById(`${prefix}${o}-fields`);
        if (el) el.style.display = 'none';
    });
    if (organ) {
        const el = document.getElementById(`${prefix}${organ.toLowerCase()}-fields`);
        if (el) el.style.display = 'block';
    }
}

document.getElementById('organ').addEventListener('change', e => showOrganFields(e.target.value));

// ── Registration form submit ─────────────────────────────────
document.getElementById('reg-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = document.getElementById('reg-submit');
    const btnText = document.getElementById('reg-btn-text');
    const spinner = document.getElementById('reg-spinner');
    const result = document.getElementById('reg-result');

    btn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';
    result.style.display = 'none';

    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());

    const endpoint = currentRole === 'donor'
        ? `${API}/register-donor`
        : `${API}/register-recipient`;

    try {
        const r = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await r.json();

        result.style.display = 'block';
        if (r.ok) {
            result.className = 'result-box success';
            result.innerHTML = `✅ ${data.message} (ID: ${data.id})`;
            e.target.reset();
            showOrganFields(null);
        } else {
            result.className = 'result-box error';
            result.innerHTML = `❌ ${data.error || 'Registration failed.'}`;
        }
    } catch (err) {
        result.style.display = 'block';
        result.className = 'result-box error';
        result.innerHTML = '❌ Could not connect to server. Make sure the backend is running.';
    } finally {
        btn.disabled = false;
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
    }
});

// ── Match form — show organ fields ───────────────────────────
document.getElementById('m_organ').addEventListener('change', function () {
    document.querySelectorAll('.match-organ-field').forEach(el => el.style.display = 'none');
    const val = this.value.toLowerCase();
    document.querySelectorAll(`.${val}-f`).forEach(el => el.style.display = 'flex');
});

// ── Match form submit ────────────────────────────────────────
document.getElementById('match-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = document.getElementById('match-submit');
    const btnText = document.getElementById('match-btn-text');
    const spinner = document.getElementById('match-spinner');
    const results = document.getElementById('match-results');

    btn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';
    results.innerHTML = '';

    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());
    // Remove empty fields
    Object.keys(payload).forEach(k => { if (!payload[k]) delete payload[k]; });

    try {
        const r = await fetch(`${API}/match`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await r.json();

        if (r.ok && data.donors && data.donors.length > 0) {
            const scope = data.scope === 'local'
                ? `<span class="match-scope-badge scope-local">📍 Showing donors from your state</span>`
                : `<span class="match-scope-badge scope-national">🌐 No local donors found — showing national results</span>`;

            const cards = data.donors.map((d, i) => buildDonorCard(d, payload.organ_needed, i)).join('');
            results.innerHTML = `${scope}<div class="donor-cards">${cards}</div>`;
        } else if (r.status === 404) {
            results.innerHTML = `<div class="no-match">
                <h3>No Matches Found</h3>
                <p>No compatible donors are currently registered. Please check back later or reach out to NOTTO (1800-11-4770).</p>
            </div>`;
        } else {
            results.innerHTML = `<div class="result-box error">❌ ${data.error || 'Search failed.'}</div>`;
        }
    } catch (err) {
        results.innerHTML = `<div class="result-box error">❌ Could not connect to server. Make sure the backend is running on port 3000.</div>`;
    } finally {
        btn.disabled = false;
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
    }
});

function buildDonorCard(d, organ, idx) {
    const organSpecific = buildOrganDetails(d, organ);
    return `
    <div class="donor-card" style="animation-delay:${idx * 0.07}s">
      <div class="donor-card-header">
        <div class="donor-name">${d.name}</div>
        <span class="donor-organ-badge badge-${organ}">${organ}</span>
      </div>
      <div class="donor-details">
        <span><span class="donor-detail-label">Age:</span>${d.age} &nbsp;|&nbsp; ${d.gender === 'M' ? 'Male' : d.gender === 'F' ? 'Female' : d.gender}</span>
        <span><span class="donor-detail-label">Blood Group:</span>${d.blood_group}</span>
        <span><span class="donor-detail-label">State:</span>${d.state}</span>
        <span><span class="donor-detail-label">Phone:</span>${d.phone}</span>
        <span><span class="donor-detail-label">Email:</span>${d.email}</span>
        ${organSpecific}
        ${d.emergency_name ? `<span><span class="donor-detail-label">Emergency:</span>${d.emergency_name} (${d.relationship})</span>` : ''}
        ${d.emergency_phone ? `<span><span class="donor-detail-label">Emrg. Ph:</span>${d.emergency_phone}</span>` : ''}
      </div>
    </div>`;
}

function buildOrganDetails(d, organ) {
    const rows = [];
    if (organ === 'Heart') {
        if (d.prev_cardiac !== undefined) rows.push(`<span><span class="donor-detail-label">Prev Cardiac:</span>${d.prev_cardiac}</span>`);
        if (d.ejection_frac) rows.push(`<span><span class="donor-detail-label">Ejection Fr:</span>${d.ejection_frac}%</span>`);
    }
    if (organ === 'Liver') {
        if (d.meld_score) rows.push(`<span><span class="donor-detail-label">MELD Score:</span>${d.meld_score}</span>`);
        if (d.hla_typing) rows.push(`<span><span class="donor-detail-label">HLA Typing:</span>${d.hla_typing}</span>`);
    }
    if (organ === 'Lungs') {
        if (d.total_lung_cap) rows.push(`<span><span class="donor-detail-label">Lung Cap:</span>${d.total_lung_cap} L</span>`);
        if (d.dlco) rows.push(`<span><span class="donor-detail-label">DLCO:</span>${d.dlco}</span>`);
        if (d.fev1) rows.push(`<span><span class="donor-detail-label">FEV1:</span>${d.fev1} L</span>`);
    }
    if (organ === 'Pancreas') {
        if (d.pancreas_length) rows.push(`<span><span class="donor-detail-label">P. Length:</span>${d.pancreas_length} cm</span>`);
        if (d.pancreas_width) rows.push(`<span><span class="donor-detail-label">P. Width:</span>${d.pancreas_width} cm</span>`);
        if (d.insulin_levels) rows.push(`<span><span class="donor-detail-label">Insulin:</span>${d.insulin_levels} µU/mL</span>`);
    }
    return rows.join('');
}
