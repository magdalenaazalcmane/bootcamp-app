# CLAUDE.md

## Stack

Express API (`server/`) + React/Vite client (`client/`), run together via npm workspaces (`npm run dev`).

## Severity levels

- **Critical** — the app crashes, data is lost or corrupted, or a core flow is completely unusable.
- **Major** — a significant feature is broken with no workaround.
- **Minor** — a feature is broken but a workaround exists, or the impact is limited.
- **Trivial** — a cosmetic or wording issue with no functional impact.

## Test case fields

- **Title**
- **Preconditions**
- **Steps** (numbered)
- **Expected result**
- **Severity** — Critical / Major / Minor / Trivial
- **Status** — draft / ready / passed / failed / skipped

Always end test case titles with the feature area in brackets, e.g. "User can log in with valid credentials [Login]".

## Bug report fields

- **Title**
- **Steps to reproduce**
- **Expected**
- **Actual**
- **Severity** — Critical / Major / Minor / Trivial
- **Status** — open / in-progress / resolved / closed / reopened

## API response shape

Every endpoint returns:

```json
{ "success": boolean, "data": any, "error": string | null }
```

## File naming

- Files: `kebab-case` (e.g. `user-profile.js`)
- React components: `PascalCase` (e.g. `UserProfile.jsx`)
- API handlers: `handleVerbNoun` (e.g. `handleCreateUser`)

## Voice

Write test cases and bug reports in clear, direct English. No buzzwords, no filler, no hedging. State what happened and what should happen — nothing else.
