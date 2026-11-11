# Itera — Front End

A React + Vite front end for Itera: log in, register, set up an accessibility
profile, and land on a dashboard. Ships with a working **mock backend** so you
can run it immediately, and is structured so a real backend is a one-file swap.

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL. Try registering an account, filling in the
accessibility profile, logging out, and logging back in — the mock backend
persists to your browser's localStorage, so your data is still there.

## Project structure

```
src/
  api.js                     ← the ONLY file to change to connect a real backend
  main.jsx                   ← entry point, sets up routing
  App.jsx                    ← routes + auth guarding
  styles.css                 ← all design tokens & component styles
  context/
    AuthContext.jsx           ← shared user/session state, calls api.js
  components/
    AuthLayout.jsx            ← split-screen image/form layout
    SwitchToggle.jsx          ← the login/register slider
  pages/
    Login.jsx
    Register.jsx
    AccessibilityProfile.jsx
    Dashboard.jsx
```

## Connecting a real backend

Everything else in the app depends only on the `{ ok, user }` / `{ ok, error }`
shape returned by `src/api.js` — so that's the only file to touch. Replace the
body of each exported function with a real call, e.g.:

```javascript
const API_BASE = 'https://your-api.com'

export async function login({ email, password }) {
  const res = await fetch(`${API_BASE}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) return { ok: false, error: data.error || 'Login failed' }
  return { ok: true, user: data.user }
}
```

Do the same for `register` and `saveProfile`. Your backend needs three
endpoints returning JSON in that shape:

- `POST /api/register` — `{ username, email, phone, password }` → `{ user }`
- `POST /api/login` — `{ email, password }` → `{ user }`
- `PUT /api/profile` — `{ email, profile }` → `{ user }`

A few things worth handling server-side before going live:

- **Password hashing** (bcrypt/argon2) — never store or compare plain text.
- **CORS** enabled for whatever domain this front end is hosted on.
- **Sessions** — right now there's no token. A real backend usually returns a
  JWT or sets an httpOnly cookie on login, which you'd then send with
  subsequent requests (e.g. attach `Authorization: Bearer <token>` in
  `api.js`, or rely on the cookie automatically).

## Build for production

```bash
npm run build
```

Outputs a static `dist/` folder you can deploy anywhere (Vercel, Netlify,
your own server, etc.).
