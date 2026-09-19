# bootcamp-app

Live demo: https://bootcamp-app-643q.onrender.com

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

## Deploy

Deployed on **Render** (free "Web Service" tier), not Vercel/Netlify/Cloudflare
Pages. Those three are serverless/edge platforms with no persistent
filesystem, and this app stores data in a local SQLite file
(`better-sqlite3`) via a normal long-running Express process — Render is the
one of the four that runs exactly that kind of process for free, so the app
ships as-is with no database migration.

**Free tier reality, so there are no surprises:** Render's free web services
spin down after 15 minutes of no traffic (the next request wakes it back up,
which takes up to ~1 minute), and the free tier has no *persistent* disk —
the SQLite file survives normal use and sleep/wake cycles, but resets to
empty on every redeploy. Fine for a demo/practice app; not a place to keep
data you care about long-term. (750 free instance-hours/month, 512MB RAM,
single instance — plenty for this app.)

### One-time setup

1. Install the Render CLI: `brew install render-oss/render/render` (or see
   [render.com/docs/cli](https://render.com/docs/cli) for other platforms).
2. Make sure your latest work is pushed to `origin/main` — Render builds
   from the git remote, not your local working copy.

### Deploy

```bash
render services create --name bootcamp-app --repo https://code.tdlbox.com/magdalena.a.zalcmane/bootcamp-app.git --branch main --type web_service --runtime node --build-command "npm install && npm run build" --start-command "npm start" --plan free --confirm
```

First run opens your browser to sign in and pick a workspace, then creates
and deploys the service. It prints the live URL
(`https://bootcamp-app.onrender.com`, or a suffixed variant if that name's
taken) when the deploy finishes.

`render.yaml` documents the same configuration as infrastructure-as-code —
useful if you ever connect this repo through the Render Dashboard's "New
Blueprint" flow instead of the CLI.

### Environment variables (all optional)

See `.env.example`. `DISCORD_WEBHOOK_URL`, `APP_BASE_URL`, and
`ANTHROPIC_API_KEY` are only used for the bug-tracker's Discord alerts and
the AI-written report narrative; the app runs fine with none of them set.
After your first deploy, set `APP_BASE_URL` to your real `onrender.com` URL
in the Render dashboard (Environment tab) so Discord alert links point at
the live app instead of `localhost`.

## The qa-plugin

This repo also bundles a portable Claude Code plugin (`.claude-plugin/`,
`agents/`, `commands/`, `skills/`, `hooks/`) — see the top-level `README.md`
for that; it's a separate, self-contained thing from the app itself.
