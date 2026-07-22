const express = require('express');
const session = require('express-session');
const { getUserInfo } = require('@replit/repl-auth');
const path = require('path');
const { upsertUser, getUser, listUsers } = require('./db');

const app = express();
const PORT = 5000;

// Session middleware — used for flash messages and post-login redirects
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false },
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Make user available in all templates; persist to DB on every authed request
app.use((req, res, next) => {
  const user = getUserInfo(req);
  if (user) {
    upsertUser({
      id:           user.id,
      name:         user.name,
      profileImage: user.profileImage || null,
      bio:          user.bio || null,
    });
  }
  res.locals.user = user;
  next();
});

// Auth middleware — redirects unauthenticated users
function requireAuth(req, res, next) {
  if (!res.locals.user) {
    req.session.returnTo = req.originalUrl;
    return res.redirect('/');
  }
  next();
}

// ── Routes ──────────────────────────────────────────────────────────────────

// Login redirect — sends the browser through Replit's auth flow
app.get('/login', (req, res) => {
  const domain = req.hostname;
  const authUrl = `https://replit.com/auth_with_repl_site?domain=${encodeURIComponent(domain)}`;
  res.redirect(authUrl);
});

// Home page — public
app.get('/', (req, res) => {
  const user = res.locals.user;
  res.send(renderPage({
    title: 'Home',
    body: user ? `
      <div class="card">
        <img class="avatar" src="${escHtml(user.profileImage || '')}" alt="" onerror="this.style.display='none'">
        <h1>Welcome back, <span class="accent">${escHtml(user.name)}</span>!</h1>
        <p>You're signed in with your Replit account.</p>
        <div class="actions">
          <a class="btn btn-primary" href="/dashboard">Go to Dashboard</a>
          <a class="btn btn-secondary" href="/logout">Sign out</a>
        </div>
      </div>
    ` : `
      <div class="card">
        <h1>Welcome</h1>
        <p>Sign in with your Replit account to continue.</p>
        <div class="actions">
          <a class="btn btn-primary" href="/login">Sign in with Replit</a>
        </div>
      </div>
    `,
  }));
});

// Dashboard — protected
app.get('/dashboard', requireAuth, (req, res) => {
  const user = res.locals.user;
  const roles = (user.roles || []).join(', ') || 'none';
  const record = getUser(user.id);
  const firstSeen = record
    ? new Date(record.first_seen * 1000).toLocaleString()
    : '—';

  res.send(renderPage({
    title: 'Dashboard',
    body: `
      <div class="card">
        <img class="avatar" src="${escHtml(user.profileImage || '')}" alt="" onerror="this.style.display='none'">
        <h1>Dashboard</h1>

        <table class="info-table">
          <tr><th>Username</th><td>${escHtml(user.name)}</td></tr>
          <tr><th>User ID</th><td>${escHtml(user.id)}</td></tr>
          <tr><th>Roles</th><td>${escHtml(roles)}</td></tr>
          ${user.bio ? `<tr><th>Bio</th><td>${escHtml(user.bio)}</td></tr>` : ''}
          <tr><th>First seen</th><td>${escHtml(firstSeen)}</td></tr>
        </table>

        <div class="actions">
          <a class="btn btn-secondary" href="/">← Back home</a>
          <a class="btn btn-secondary" href="/logout">Sign out</a>
        </div>
      </div>
    `,
  }));
});

// Logout — clears the Replit auth cookie then redirects home
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    // Replit Auth doesn't expose a direct sign-out URL, so we clear the
    // session and redirect.  The user remains signed in to replit.com itself.
    res.redirect('/');
  });
});

// ── Template helpers ─────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderPage({ title, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(title)}</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <nav>
    <a class="brand" href="/">MyApp</a>
  </nav>
  <main>
    ${body}
  </main>
</body>
</html>`;
}

// ── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
