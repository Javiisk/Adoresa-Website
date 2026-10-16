// app.js — Frontend logic

const BACKEND_URL = 'https://claorusea.onrender.com';
const CLIENT_ID = '1513249538318532749';
const REDIRECT_URI = 'https://javiisk.github.io/Adoresa-Website/';

// ─── ELEMENTS ───────────────────────────────────────────
const loginScreen = document.getElementById('loginScreen');
const editorScreen = document.getElementById('editorScreen');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const userTag = document.getElementById('userTag');

// ─── INIT ───────────────────────────────────────────────
function init() {
  // Check if we have a code in the URL (returning from Discord)
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');

  if (code) {
    // Clean the URL
    window.history.replaceState({}, document.title, window.location.pathname);
    // Exchange code for token
    handleLoginCallback(code);
    return;
  }

  // Check if we have a saved token
  const token = localStorage.getItem('auth_token');
  if (token) {
    verifyToken(token);
  } else {
    showLogin();
  }
}

// ─── LOGIN ──────────────────────────────────────────────
function showLogin() {
  loginScreen.classList.add('active');
  editorScreen.classList.remove('active');
}

function showEditor(user) {
  loginScreen.classList.remove('active');
  editorScreen.classList.add('active');
  userTag.textContent = user ? `@${user.username}` : '';
}

loginBtn.addEventListener('click', () => {
  loginBtn.disabled = true;
  loginBtn.textContent = 'Redirecting...';

  const oauthUrl = new URL('https://discord.com/oauth2/authorize');
  oauthUrl.searchParams.set('client_id', CLIENT_ID);
  oauthUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  oauthUrl.searchParams.set('response_type', 'code');
  oauthUrl.searchParams.set('scope', 'identify');

  window.location.href = oauthUrl.toString();
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  showLogin();
});

// ─── EXCHANGE CODE FOR TOKEN ────────────────────────────
async function handleLoginCallback(code) {
  loginScreen.classList.add('active');

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    const data = await res.json();

    if (!res.ok) {
      loginError.textContent = data.error || 'Login failed';
      loginBtn.disabled = false;
      loginBtn.innerHTML = 'Login with Discord';
      return;
    }

    // Save session
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));

    showEditor(data.user);
  } catch (err) {
    loginError.textContent = 'Network error: ' + err.message;
    loginBtn.disabled = false;
  }
}

// ─── VERIFY SAVED TOKEN ─────────────────────────────────
async function verifyToken(token) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (!res.ok) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      showLogin();
      return;
    }

    const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
    showEditor(user);
  } catch (err) {
    showLogin();
  }
}

// ─── START ──────────────────────────────────────────────
init();