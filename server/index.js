import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import testCasesRouter from './routes/testCases.js';
import suitesRouter from './routes/suites.js';
import bugsRouter from './routes/bugs.js';
import testRunsRouter from './routes/testRuns.js';
import dashboardRouter from './routes/dashboard.js';
import reportsRouter from './routes/reports.js';
import settingsRouter from './routes/settings.js';

// Loads DISCORD_WEBHOOK_URL (and anything else) from the project's root .env.
// Uses Node's built-in loader (no extra dependency) and is silent if the file
// doesn't exist, so the app still runs fine without it.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
  process.loadEnvFile(path.join(__dirname, '..', '.env'));
} catch {
  // no .env file present — Discord alerts just won't be sent
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
// Default body-parser limit is 100kb — too small for a pasted CSV import
// (test-cases/import), so it's raised here; the import endpoint still
// enforces its own explicit, user-facing 2MB limit on top of this.
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/test-cases', testCasesRouter);
app.use('/api/suites', suitesRouter);
app.use('/api/bugs', bugsRouter);
app.use('/api/test-runs', testRunsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/settings', settingsRouter);

// Catches requests to /api paths no router above matched. Without this,
// Express falls through to its own default HTML 404 page for a bad API
// path, breaking the {success, data, error} envelope CLAUDE.md requires
// for every endpoint.
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, data: null, error: 'Not found' });
});

// Ensures every /api response — including malformed request bodies and
// unexpected errors — follows the {success, data, error} envelope from CLAUDE.md.
// Errors are logged server-side (never visible before this change), since an
// unexpected 500 with no log line is nearly impossible to debug after the fact.
app.use('/api', (err, req, res, next) => {
  console.error(`[${req.method} ${req.originalUrl}]`, err.stack || err.message);
  res.status(err.status || 400).json({
    success: false,
    data: null,
    error: err.message || 'Invalid request',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Serves the built React app (client/dist) in production. In local dev the
// client runs on its own Vite dev server instead, so this simply has
// nothing to serve — express.static and sendFile both no-op harmlessly if
// client/dist doesn't exist yet.
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
