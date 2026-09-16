import express from 'express';
import cors from 'cors';
import testCasesRouter from './routes/testCases.js';
import suitesRouter from './routes/suites.js';
import bugsRouter from './routes/bugs.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/test-cases', testCasesRouter);
app.use('/api/suites', suitesRouter);
app.use('/api/bugs', bugsRouter);

// Ensures every /api response — including malformed request bodies and
// unexpected errors — follows the {success, data, error} envelope from CLAUDE.md.
app.use('/api', (err, req, res, next) => {
  res.status(err.status || 400).json({ success: false, data: null, error: err.message || 'Invalid request' });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
