// app.js — Frontend logic (web)

const BACKEND_URL = 'https://claorusea.onrender.com';

// ─── ELEMENTS ───────────────────────────────────────────
const loginScreen = document.getElementById('loginScreen');
const editorScreen = document.getElementById('editorScreen');
const passwordInput = document.getElementById('passwordInput');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');

// ─── STATE ──────────────────────────────────────────────
const state = {
  title: '',
  color: 'none',
  texts: [],
  imageUrl: '',
  buttonLabel: '',
  buttonUrl: '',
};

let token = null;

// ─── INIT ───────────────────────────────────────────────
function init() {
  token = localStorage.getItem('auth_token');
  if (token) {
    verifyToken();
  } else {
    showLogin();
  }

  renderTextBlocks();
  renderPreview();
}

function showLogin() {
  loginScreen.classList.add('active');
  editorScreen.classList.remove('active');
}

function showEditor() {
  loginScreen.classList.remove('active');
  editorScreen.classList.add('active');
  loadChannels();
}

// ─── LOGIN ──────────────────────────────────────────────
loginBtn.addEventListener('click', doLogin);
passwordInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') doLogin();
});

async function doLogin() {
  const password = passwordInput.value.trim();
  if (!password) {
    loginError.textContent = 'Enter a password';
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = 'Logging in...';
  loginError.textContent = '';

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();

    if (!res.ok) {
      loginError.textContent = data.error || 'Login failed';
      loginBtn.disabled = false;
      loginBtn.textContent = 'Login';
      return;
    }

    token = data.token;
    localStorage.setItem('auth_token', token);
    passwordInput.value = '';
    loginBtn.disabled = false;
    loginBtn.textContent = 'Login';
    showEditor();
  } catch (err) {
    loginError.textContent = 'Network error. Is the bot awake?';
    loginBtn.disabled = false;
    loginBtn.textContent = 'Login';
  }
}

// ─── VERIFY ─────────────────────────────────────────────
async function verifyToken() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (res.ok) {
      showEditor();
    } else {
      localStorage.removeItem('auth_token');
      showLogin();
    }
  } catch {
    showLogin();
  }
}

// ─── LOGOUT ─────────────────────────────────────────────
logoutBtn.addEventListener('click', async () => {
  try {
    await fetch(`${BACKEND_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
  } catch {}
  localStorage.removeItem('auth_token');
  token = null;
  showLogin();
});

// ─── LOAD CHANNELS ──────────────────────────────────────
async function loadChannels() {
  const select = document.getElementById('channelSelect');
  select.innerHTML = '<option value="">Loading channels...</option>';

  try {
    const res = await fetch(`${BACKEND_URL}/api/get-channels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    select.innerHTML = '<option value="">Select a channel...</option>';

    for (const [category, channels] of Object.entries(data.categories)) {
      const group = document.createElement('optgroup');
      group.label = category;
      for (const ch of channels) {
        const opt = document.createElement('option');
        opt.value = ch.id;
        opt.textContent = '# ' + ch.name;
        group.appendChild(opt);
      }
      select.appendChild(group);
    }

    select.addEventListener('change', () => {
      document.getElementById('sendBtn').disabled = !select.value;
    });
  } catch (err) {
    select.innerHTML = '<option value="">Error loading channels</option>';
  }
}

// ─── TEXT BLOCKS ────────────────────────────────────────
function addTextBlock() {
  state.texts.push('');
  renderTextBlocks();
  renderPreview();
}
function removeTextBlock(i) {
  state.texts.splice(i, 1);
  renderTextBlocks();
  renderPreview();
}
function updateTextBlock(i, value) {
  state.texts[i] = value;
  renderPreview();
}

function renderTextBlocks() {
  const container = document.getElementById('textBlocks');
  container.innerHTML = '';
  state.texts.forEach((text, i) => {
    const wrap = document.createElement('div');
    wrap.style.marginBottom = '10px';
    wrap.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px">
        <label>Block ${i + 1}</label>
        <button class="btn-danger" onclick="removeTextBlock(${i})">Remove</button>
      </div>
      <textarea placeholder="Texto..." oninput="updateTextBlock(${i}, this.value)">${escapeHtml(text)}</textarea>
    `;
    container.appendChild(wrap);
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── LISTENERS ──────────────────────────────────────────
document.querySelectorAll('.color-dot').forEach(dot => {
  dot.addEventListener('click', () => {
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
    dot.classList.add('selected');
    state.color = dot.dataset.color;
    renderPreview();
  });
});

document.getElementById('title').addEventListener('input', e => { state.title = e.target.value; renderPreview(); });
document.getElementById('imageUrl').addEventListener('input', e => { state.imageUrl = e.target.value; renderPreview(); });
document.getElementById('buttonLabel').addEventListener('input', e => { state.buttonLabel = e.target.value; renderPreview(); });
document.getElementById('buttonUrl').addEventListener('input', e => { state.buttonUrl = e.target.value; renderPreview(); });

// ─── PREVIEW ────────────────────────────────────────────
function renderPreview() {
  const container = document.getElementById('previewContainer');

  if (state.color === 'none') {
    container.style.setProperty('--accent', 'transparent');
    container.classList.remove('accent');
  } else {
    container.style.setProperty('--accent', state.color);
    container.classList.add('accent');
  }

  let html = '';
  if (state.title.trim()) {
    html += `<div class="preview-title">${escapeHtml(state.title)}</div>`;
    html += `<div class="preview-divider"></div>`;
  }
  if (state.imageUrl.trim()) {
    html += `<img class="preview-image" src="${escapeHtml(state.imageUrl)}" onerror="this.style.display='none'">`;
    html += `<div class="preview-divider"></div>`;
  }
  state.texts.forEach((text, i) => {
    if (!text.trim()) return;
    html += `<div class="preview-text">${escapeHtml(text)}</div>`;
    if (i < state.texts.length - 1) html += `<div class="preview-divider"></div>`;
  });
  if (state.buttonLabel.trim() && state.buttonUrl.trim()) {
    html += `<div class="preview-divider"></div>`;
    html += `<a class="preview-button" href="${escapeHtml(state.buttonUrl)}" target="_blank">${escapeHtml(state.buttonLabel)} ↗</a>`;
  }

  container.innerHTML = html || '<div class="empty-preview">Escribe algo para ver el preview...</div>';
}

// ─── SEND ───────────────────────────────────────────────
document.getElementById('sendBtn').addEventListener('click', async () => {
  const channelId = document.getElementById('channelSelect').value;
  const status = document.getElementById('sendStatus');
  if (!channelId) return;

  status.textContent = 'Sending...';
  status.className = 'status';

  // Build JSON payload
  const components = [];
  if (state.title.trim()) {
    components.push({ type: 10, content: `## ${state.title}` });
    components.push({ type: 14, spacing: 2 });
  }
  if (state.imageUrl.trim()) {
    components.push({ type: 12, items: [{ media: { url: state.imageUrl } }] });
    components.push({ type: 14, spacing: 2 });
  }
  state.texts.forEach(text => {
    if (text.trim()) {
      components.push({ type: 10, content: text });
      components.push({ type: 14, spacing: 2 });
    }
  });
  if (state.buttonLabel.trim() && state.buttonUrl.trim()) {
    components.push({
      type: 1,
      components: [{ type: 2, style: 5, label: state.buttonLabel, url: state.buttonUrl }],
    });
  }

  const payload = {
    accent_color: state.color === 'none' ? null : state.color,
    components: [{ type: 17, components }],
  };

  try {
    const res = await fetch(`${BACKEND_URL}/api/send-container`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, channelId, payload }),
    });
    const data = await res.json();

    if (!res.ok) {
      status.textContent = '❌ ' + (data.error || 'Failed');
      status.className = 'status err';
      return;
    }

    status.textContent = '✅ Container sent!';
    status.className = 'status ok';
  } catch (err) {
    status.textContent = '❌ Network error';
    status.className = 'status err';
  }
});

// ─── START ──────────────────────────────────────────────
init();