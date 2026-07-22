const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './data/store.db';

// Ensure the parent directory exists
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(dbPath);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema ────────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    profile_image TEXT,
    bio         TEXT,
    first_seen  INTEGER NOT NULL DEFAULT (unixepoch()),
    last_seen   INTEGER NOT NULL DEFAULT (unixepoch())
  );
`);

// ── Queries ───────────────────────────────────────────────────────────────────

const upsertUser = db.prepare(`
  INSERT INTO users (id, name, profile_image, bio, first_seen, last_seen)
    VALUES (@id, @name, @profileImage, @bio, unixepoch(), unixepoch())
  ON CONFLICT(id) DO UPDATE SET
    name          = excluded.name,
    profile_image = excluded.profile_image,
    bio           = excluded.bio,
    last_seen     = unixepoch()
`);

const getUser = db.prepare(`
  SELECT * FROM users WHERE id = ?
`);

const listUsers = db.prepare(`
  SELECT * FROM users ORDER BY last_seen DESC
`);

module.exports = { db, upsertUser, getUser, listUsers };
