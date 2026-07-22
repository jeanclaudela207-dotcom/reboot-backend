# MyApp

A Node.js + Express app with Replit Auth for user authentication.

## Stack

- **Runtime:** Node.js 20
- **Framework:** Express
- **Auth:** Replit Auth (`@replit/repl-auth`)
- **Sessions:** `express-session`

## Running the app

```bash
node server.js
```

The server starts on port 5000.

## How Replit Auth works

Replit Auth injects HTTP headers into every request when a user is signed in to Replit:

| Header | Description |
|---|---|
| `x-replit-user-id` | Unique user ID |
| `x-replit-user-name` | Username |
| `x-replit-user-roles` | Comma-separated roles |
| `x-replit-user-profile-image` | Profile image URL |
| `x-replit-user-bio` | User bio |

`getUserInfo(req)` from `@replit/repl-auth` reads these headers and returns a user object (or `null` if not signed in).

The sign-in button is rendered by including the Replit Auth script:

```html
<script authed="location.reload()" src="https://auth.util.repl.co/script.js"></script>
```

## Routes

| Route | Access | Description |
|---|---|---|
| `GET /` | Public | Home page — shows sign-in button or welcome message |
| `GET /dashboard` | Auth required | Shows user profile info from Replit Auth headers |
| `GET /logout` | Auth required | Clears session and redirects home |

## Database

SQLite via `better-sqlite3`. Path is controlled by the `DB_PATH` env var (default `./data/store.db`). The `data/` directory is created automatically on first run.

On each authenticated request the user is upserted into the `users` table, so the database always reflects who has visited and when.

Schema lives in `db.js`.

## Environment secrets

| Secret | Required | Description |
|---|---|---|
| `SESSION_SECRET` | Yes (in production) | Secret for signing session cookies |
| `DB_PATH` | No | SQLite file path (default `./data/store.db`) |

## User preferences

- Keep the existing file structure
