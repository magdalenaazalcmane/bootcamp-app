# My App

Minimal skeleton: Express API (`server/`) + React app (`client/`, built with Vite).

## Setup (one time)

```bash
npm install
```

## Run

```bash
npm run dev
```

This starts both the server (http://localhost:3001) and the client (http://localhost:5173) together. Open http://localhost:5173 in your browser — it will show a "Server status: ok" message once both are running, proving the client can talk to the server.

## Layout

- `server/index.js` — Express server entry point, currently exposes `GET /api/health`.
- `client/src/` — React source code (`App.jsx` is the main page).
