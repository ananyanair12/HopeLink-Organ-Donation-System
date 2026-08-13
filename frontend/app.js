/* ============================================================
   HOPELINK — Frontend JavaScript
   ============================================================ */

const API = 'https://hopelink-backend.onrender.com/api';

function safeQuery(selector) {
    return document.querySelector(selector);
}

console.log('API URL:', API);

// ── Auth Gate & Intro Logic ──────────────────────────────────
const introPage = document.getElementById('intro-page');
const mainSite = document.getElementById('main-site');

function checkAuth() {
    if (authToken) {
        if (introPage) introPage.style.display = 'none';
        if (mainSite) {
            mainSite.style.display = 'block';
            mainSite.classList.add('active');
        }
        updateAuthUI();
        loadStats();
        if (currentUser?.role === 'hospital') initDashboard();
    } else {
        if (introPage) introPage.style.display = 'block';
        if (mainSite) {
            mainSite.style.display = 'none';
            mainSite.classList.remove('active');
        }
        initIntroPage();
    }
}

function enterSite() {
    if (introPage) introPage.classList.add('fade-out');
    setTimeout(() => {
        if (introPage) introPage.style.display = 'none';
        if (mainSite) {
            mainSite.style.display = 'block';
            mainSite.classList.add('active', 'fade-in');
        }
        window.scrollTo(0, 0);
    }, 800);
}

function exitSite() {
    if (mainSite) mainSite.classList.remove('fade-in');
    if (mainSite) mainSite.style.display = 'none';
    if (introPage) {
        introPage.style.display = 'block';
        introPage.classList.remove('fade-out');
    }
    window.scrollTo(0, 0);
    initIntroPage();
}

function initIntroPage() {
    // Reveal text on scroll
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.reveal-text').forEach(el => revealObserver.observe(el));

    // Counter animation
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.dataset.target);
                animateCounter(entry.target, target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.counter').forEach(el => counterObserver.observe(el));
}

function animateCounter(el, target) {
    let current = 0;
    const duration = 2000;
    const step = target / (duration / 16);
    
    function update() {
        current += step;
        if (current < target) {
            el.textContent = Math.floor(current).toLocaleString();
            requestAnimationFrame(update);
        } else {
            el.textContent = target.toLocaleString();
        }
    }
    update();
}

// Intro CTA handlers
document.querySelector('.intro-login-btn')?.addEventListener('click', () => {
    document.querySelector('.auth-tab[data-tab="login"]')?.click();
    authModal?.classList.add('open');
});

document.querySelector('.intro-signup-btn')?.addEventListener('click', () => {
    document.querySelector('.auth-tab[data-tab="signup"]')?.click();
    authModal?.classList.add('open');
});

// ── Nav scroll highlight ─────────────────────────────────────
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');

if ('IntersectionObserver' in window) {
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
}

// Hamburger menu
const hamburger = document.getElementById('hamburger');
const navMenu = document.querySelector('.nav-links');

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('open');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('open');
        });
    });
}

// ── Load stats ───────────────────────────────────────────────
async function loadStats() {
    try {
        const r = await fetch(`${API}/stats`);
        if (!r.ok) return;
        const data = await r.json();
        const totalEl = document.getElementById('stat-total');
        const recipEl = document.getElementById('stat-recip');
        if (totalEl) totalEl.textContent = data.total !== undefined ? data.total : '0';
        if (recipEl) recipEl.textContent = data.recipients !== undefined ? data.recipients : '0';
    } catch (err) {
        console.error('Failed to load stats:', err);
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

const organSelect = document.getElementById('organ');
if (organSelect) organSelect.addEventListener('change', e => showOrganFields(e.target.value));

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
        const r = await authedFetch(endpoint, {
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
const matchOrgan = document.getElementById('m_organ');
if (matchOrgan) {
    matchOrgan.addEventListener('change', function () {
        document.querySelectorAll('.match-organ-field').forEach(el => el.style.display = 'none');
        const val = this.value.toLowerCase();
        document.querySelectorAll(`.${val}-f`).forEach(el => el.style.display = 'flex');
    });
}

// ── Match form submit ────────────────────────────────────────
const matchForm = document.getElementById('match-form');
if (matchForm) {
    matchForm.addEventListener('submit', async (e) => {
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
        const r = await authedFetch(`${API}/match`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await r.json();

        if (r.ok && data.donors && data.donors.length > 0) {
            const urgencyHtml = data.urgency
                ? `<span class="urgency-badge urgency-${data.urgency}">Status: ${data.urgency}</span>`
                : '';

            const scope = data.scope === 'local'
                ? `<span class="match-scope-badge scope-local">📍 Showing donors from your state</span>`
                : `<span class="match-scope-badge scope-national">🌐 No local donors found — showing national results</span>`;

            const cards = data.donors.map((d, i) => buildDonorCard(d, payload.organ_needed, i)).join('');
            results.innerHTML = `${urgencyHtml}<br>${scope}<div class="donor-cards">${cards}</div>`;
        } else if (r.status === 404) {
            const urgencyHtml = data.urgency
                ? `<span class="urgency-badge urgency-${data.urgency}">Status: ${data.urgency}</span>`
                : '';
            results.innerHTML = `${urgencyHtml}<div class="no-match">
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
}

function buildDonorCard(d, organ, idx) {
    const organSpecific = buildOrganDetails(d, organ);

    // ML Score UI
    let mlHtml = '';
    if (d.compatibility_score !== undefined && d.compatibility_score !== null) {
        const score = d.compatibility_score;
        const colorClass = score >= 80 ? 'comp-high' : score >= 50 ? 'comp-med' : 'comp-low';

        const survivalHtml = (d.survival_probability !== undefined && d.survival_probability !== null)
            ? `<div class="survival-rate">Estimated Success Rate: <strong>${d.survival_probability}%</strong></div>`
            : '';

        mlHtml = `
        <div class="donor-compatibility">
          <div class="comp-label">
            <span>AI Compatibility Match</span>
            <span class="comp-score-val">${score}%</span>
          </div>
          <div class="comp-bar-bg">
            <div class="comp-bar-fill ${colorClass}" style="width: ${score}%"></div>
          </div>
          ${survivalHtml}
        </div>`;
    }

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
      ${mlHtml}
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

// ── Dashboard Logic ──────────────────────────────────────────
let stateChart = null;
let organChart = null;

async function initDashboard() {
    if (!authToken || currentUser?.role !== 'hospital') return;

    try {
        // Fetch stats
        const statsRes = await authedFetch(`${API}/stats`);
        const stats = await statsRes.json();
        document.getElementById('ds-heart').textContent = stats.hearts;
        document.getElementById('ds-liver').textContent = stats.livers;
        document.getElementById('ds-lung').textContent = stats.lungs;
        document.getElementById('ds-pancreas').textContent = stats.pancreas;
        document.getElementById('ds-recip').textContent = stats.recipients;

        // Fetch Organ Counts per State
        const countsRes = await authedFetch(`${API}/dashboard/organ-counts`);
        let counts = await countsRes.json();


        renderStateChart(counts);
        renderOrganPieChart(stats);

        // Fetch Recent Activity
        const donorsRes = await authedFetch(`${API}/dashboard/recent-donors`);
        const recentDonors = await donorsRes.json();
        const dTable = document.querySelector('#recent-donors-table tbody');
        dTable.innerHTML = recentDonors.map(d => `
            <tr>
                <td>${d.name}</td>
                <td><span class="donor-organ-badge badge-${d.organ}">${d.organ}</span></td>
                <td>${d.state}</td>
            </tr>
        `).join('');

        const recipientsRes = await authedFetch(`${API}/dashboard/recent-recipients`);
        const recentRecipients = await recipientsRes.json();
        const rTable = document.querySelector('#recent-recipients-table tbody');
        rTable.innerHTML = recentRecipients.map(r => `
            <tr>
                <td>${r.name}</td>
                <td><span class="donor-organ-badge badge-${r.organ_needed}">${r.organ_needed}</span></td>
                <td>${r.state}</td>
            </tr>
        `).join('');

    } catch (err) {
        console.error('Dashboard Error:', err);
    }
}

function renderStateChart(counts) {
    const states = new Set();
    [counts.hearts || [], counts.livers || [], counts.lungs || [], counts.pancreas || []].forEach(arr => {
        arr.forEach(item => states.add(item.state));
    });
    const stateList = Array.from(states);

    const getData = (arr) => stateList.map(s => {
        const found = arr.find(item => item.state === s);
        return found ? found.count : 0;
    });

    if (stateChart) stateChart.destroy();
    const ctx = document.getElementById('stateChart').getContext('2d');
    stateChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: stateList,
            datasets: [
                { label: 'Hearts', data: getData(counts.hearts), backgroundColor: '#e05c6a' },
                { label: 'Livers', data: getData(counts.livers), backgroundColor: '#e8a44a' },
                { label: 'Lungs', data: getData(counts.lungs), backgroundColor: '#4ab8a0' },
                { label: 'Pancreas', data: getData(counts.pancreas), backgroundColor: '#9b72e0' }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: { stacked: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#7a8499' } },
                y: { stacked: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#7a8499' } }
            },
            plugins: { legend: { labels: { color: '#e8eaf0' } } }
        }
    });
}

function renderOrganPieChart(stats) {
    if (organChart) organChart.destroy();

    const dataValues = [stats.hearts || 0, stats.livers || 0, stats.lungs || 0, stats.pancreas || 0];

    const ctx = document.getElementById('organChart').getContext('2d');
    organChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Hearts', 'Livers', 'Lungs', 'Pancreas'],
            datasets: [{
                data: dataValues,
                backgroundColor: ['#e05c6a', '#e8a44a', '#4ab8a0', '#9b72e0'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom', labels: { color: '#e8eaf0' } } }
        }
    });
}

// Observe dashboard section to load data when visible
if ('IntersectionObserver' in window) {
    const dashObserver = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting) {
            initDashboard();
            dashObserver.disconnect();
        }
    }, { threshold: 0.1 });
    const dashSection = document.getElementById('dashboard');
    if (dashSection) dashObserver.observe(dashSection);
}

// ── Notifications Logic ──────────────────────────────────────
const BACKEND_URL = 'https://hopelink-backend.onrender.com';

let socket;
try {
    socket = io(BACKEND_URL, { 
        transports: ['polling'],
        reconnection: true 
    });

    if (socket) {
        socket.on('new_donor', (data) => {
            const msg = `🫀 A new ${data.organ} donor just registered in ${data.state}!`;
            addNotification(msg, 'donor');
            showToast(msg, 'donor');
        });

        socket.on('new_match', (data) => {
            const msg = `✅ A new ${data.organ} donor-recipient match was just made!`;
            addNotification(msg, 'match');
            showToast(msg, 'match');
        });
    }
} catch (e) {
    console.warn('Socket.io not available:', e);
}

let notifCount = 0;
const notifications = [];

function addNotification(msg, type) {
    notifCount++;
    const badge = document.getElementById('notif-count');
    badge.textContent = notifCount;
    badge.style.display = 'block';

    notifications.unshift({ msg, type, time: new Date() });
    if (notifications.length > 5) notifications.pop();
    updateNotifList();
}

function updateNotifList() {
    const list = document.getElementById('notif-list');
    if (notifications.length === 0) {
        list.innerHTML = '<div class="notif-empty">No new notifications</div>';
        return;
    }
    list.innerHTML = notifications.map(n => `
        <div class="notif-item">
            <strong>${n.type === 'match' ? 'New Match' : 'New Donor'}</strong>
            ${n.msg}
        </div>
    `).join('');
}

function showToast(msg, type) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastOut 0.5s ease forwards';
        setTimeout(() => toast.remove(), 500);
    }, 5000);
}

// Bell toggle
const bell = document.getElementById('notif-bell');
const dropdown = document.getElementById('notif-dropdown');
if (bell) {
    bell.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
        if (dropdown.classList.contains('open')) {
            notifCount = 0;
            document.getElementById('notif-count').style.display = 'none';
        }
    });
}
document.addEventListener('click', () => dropdown.classList.remove('open'));

// ── Authentication Logic ─────────────────────────────────────
let authToken = localStorage.getItem('hopelink_token') || null;
let currentUser = JSON.parse(localStorage.getItem('hopelink_user')) || null;

if (authToken) {
    setTimeout(() => {
        checkAuth();
    }, 100);
} else {
    checkAuth();
}

const authModal = document.getElementById('auth-modal');
const authForm = document.getElementById('auth-form');
const authTabs = document.querySelectorAll('.auth-tab');
const signupFields = document.getElementById('signup-fields');
const authSubmit = document.getElementById('auth-submit');
const authError = document.getElementById('auth-error');

// UI Toggles
document.getElementById('login-trigger')?.addEventListener('click', () => {
    authModal.classList.add('open');
});
document.getElementById('auth-close')?.addEventListener('click', () => {
    authModal.classList.remove('open');
});

authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        authTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const isSignup = tab.dataset.tab === 'signup';
        signupFields.style.display = isSignup ? 'block' : 'none';
        authSubmit.textContent = isSignup ? 'Sign Up' : 'Login';
        authError.textContent = '';
        
        const demoHint = document.getElementById('demo-login-hint');
        if (demoHint) demoHint.style.display = isSignup ? 'none' : 'block';
    });
});

authForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(authForm);
    const data = Object.fromEntries(formData.entries());
    const isSignup = document.querySelector('.auth-tab.active').dataset.tab === 'signup';

    const endpoint = isSignup ? '/auth/signup' : '/auth/login';

    try {
        const res = await fetch(`${API}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();

        if (!res.ok) throw new Error(result.error || 'Auth failed');

        if (isSignup) {
            alert('Signup successful! Please login.');
            document.querySelector('.auth-tab[data-tab="login"]').click();
        } else {
            authToken = result.token;
            currentUser = result.user;
            localStorage.setItem('hopelink_token', authToken);
            localStorage.setItem('hopelink_user', JSON.stringify(currentUser));
            updateAuthUI();
            authModal.classList.remove('open');
            enterSite();
            // Refresh stats/dashboard if needed
            loadStats();
            if (currentUser.role === 'hospital') {
                initDashboard();
            }
        }
    } catch (err) {
        authError.textContent = err.message;
    }
});

function updateAuthUI() {
    const navAuth = document.getElementById('nav-auth');
    const navUser = document.getElementById('nav-user');
    const userDisplay = document.getElementById('user-display');

    if (authToken) {
        navAuth.style.display = 'none';
        navUser.style.display = 'flex';
        userDisplay.textContent = `Hi, ${currentUser.name} (${currentUser.role})`;
    } else {
        navAuth.style.display = 'block';
        navUser.style.display = 'none';
    }
}

document.getElementById('logout-btn')?.addEventListener('click', () => {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('hopelink_token');
    localStorage.removeItem('hopelink_user');
    updateAuthUI();
    exitSite();
});

// Update existing fetch calls to use authToken
async function authedFetch(url, options = {}) {
    if (authToken) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${authToken}`
        };
    }
    return fetch(url, options);
}
