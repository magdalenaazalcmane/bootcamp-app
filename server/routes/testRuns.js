import { Router } from 'express';
import db from '../db.js';
import { checkNewlyFlaky } from '../lib/flakiness.js';

const router = Router();

const RESULTS = ['passed', 'failed', 'skipped'];
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:5173';

function ok(res, data) {
  res.json({ success: true, data, error: null });
}

function fail(res, status, error) {
  res.status(status).json({ success: false, data: null, error });
}

function getRunRow(id) {
  return db
    .prepare(`
      SELECT r.*, s.name AS suite_name
      FROM test_runs_v2 r
      JOIN suites s ON s.id = r.suite_id
      WHERE r.id = ?
    `)
    .get(id);
}

function getRunResults(runId) {
  return db
    .prepare(`
      SELECT rr.*, tc.title, tc.severity
      FROM test_run_results rr
      JOIN test_cases tc ON tc.id = rr.test_case_id
      WHERE rr.run_id = ?
      ORDER BY rr.id ASC
    `)
    .all(runId);
}

// Recomputes pass/fail/skip counts and overall status from the actual result
// rows, rather than trusting incremental counters that could drift out of sync.
function recomputeRunAggregates(runId) {
  const results = db.prepare('SELECT result FROM test_run_results WHERE run_id = ?').all(runId);
  const passCount = results.filter((r) => r.result === 'passed').length;
  const failCount = results.filter((r) => r.result === 'failed').length;
  const skipCount = results.filter((r) => r.result === 'skipped').length;
  const allRecorded = results.every((r) => r.result !== null);
  const status = allRecorded ? 'completed' : 'in-progress';

  const existing = db.prepare('SELECT end_time FROM test_runs_v2 WHERE id = ?').get(runId);
  const endTime = allRecorded ? existing.end_time || new Date().toISOString() : null;

  db.prepare(`
    UPDATE test_runs_v2
    SET pass_count = ?, fail_count = ?, skip_count = ?, status = ?, end_time = ?
    WHERE id = ?
  `).run(passCount, failCount, skipCount, status, endTime, runId);
}

// Posts a Discord alert for a newly-failed result. Never throws — a Discord
// outage or missing webhook config should never block the actual QA action
// of recording a failure. Returns true only if Discord accepted the message.
async function sendFailureAlert({ runId, testCaseTitle, notes }) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return false;

  const runLink = `${APP_BASE_URL}/test-runs/${runId}`;
  const content = [
    `**Test failed:** ${testCaseTitle}`,
    `**Notes:** ${notes && notes.trim() ? notes.trim() : '(no notes provided)'}`,
    `**Run:** ${runLink}`,
  ].join('\n');

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    return res.ok;
  } catch (err) {
    console.error('[Discord alert] failed to send:', err.message);
    return false;
  }
}

// Posts a Discord alert the moment a test case first becomes flaky (see
// isNewlyFlaky in lib/flakiness.js — it only fires once, not on every
// subsequent flip). Never throws, same contract as sendFailureAlert.
async function sendFlakeAlert({ testCaseTitle, flipCount }) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return false;

  const content = [
    `**New flaky test detected:** ${testCaseTitle}`,
    `This test has flipped between passed and failed ${flipCount} time(s) across its run history.`,
  ].join('\n');

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    return res.ok;
  } catch (err) {
    console.error('[Discord alert] failed to send:', err.message);
    return false;
  }
}

function handleListRuns(req, res) {
  const rows = db
    .prepare(`
      SELECT r.*, s.name AS suite_name
      FROM test_runs_v2 r
      JOIN suites s ON s.id = r.suite_id
      ORDER BY r.start_time DESC
    `)
    .all();
  ok(res, { items: rows });
}

function handleGetRun(req, res) {
  const run = getRunRow(req.params.id);
  if (!run) return fail(res, 404, 'Run not found');
  ok(res, { ...run, results: getRunResults(run.id) });
}

function handleCreateRun(req, res) {
  const suiteId = Number(req.body?.suite_id);
  if (!suiteId) return fail(res, 400, 'suite_id is required');

  const suite = db.prepare('SELECT id FROM suites WHERE id = ?').get(suiteId);
  if (!suite) return fail(res, 404, 'Suite not found');

  const caseIds = db
    .prepare('SELECT test_case_id FROM suite_test_cases WHERE suite_id = ? ORDER BY sort_order ASC')
    .all(suiteId)
    .map((r) => r.test_case_id);

  if (caseIds.length === 0) {
    return fail(res, 400, 'Cannot start a run: this suite has no test cases');
  }

  const now = new Date().toISOString();
  const createdBy = req.body?.created_by || null;

  const insertRun = db.prepare(`
    INSERT INTO test_runs_v2 (suite_id, status, pass_count, fail_count, skip_count, start_time, end_time, created_by)
    VALUES (?, 'in-progress', 0, 0, 0, ?, NULL, ?)
  `);
  const insertResult = db.prepare(`
    INSERT INTO test_run_results (run_id, test_case_id, result, duration_ms, notes, failed_at, alert_sent_at)
    VALUES (?, ?, NULL, NULL, NULL, NULL, NULL)
  `);

  const createTx = db.transaction(() => {
    const runResult = insertRun.run(suiteId, now, createdBy);
    const runId = runResult.lastInsertRowid;
    caseIds.forEach((testCaseId) => insertResult.run(runId, testCaseId));
    return runId;
  });

  const runId = createTx();
  const run = getRunRow(runId);
  ok(res, { ...run, results: getRunResults(runId) });
}

async function handleUpdateResult(req, res) {
  const run = getRunRow(req.params.id);
  if (!run) return fail(res, 404, 'Run not found');

  const testCaseId = Number(req.params.testCaseId);
  const existingResult = db
    .prepare('SELECT * FROM test_run_results WHERE run_id = ? AND test_case_id = ?')
    .get(run.id, testCaseId);
  if (!existingResult) return fail(res, 404, 'This test case is not part of the run');

  const newResult = req.body?.result;
  if (!RESULTS.includes(newResult)) {
    return fail(res, 400, `result must be one of ${RESULTS.join(', ')}`);
  }

  const notes = req.body?.notes !== undefined ? req.body.notes : existingResult.notes;
  const now = new Date().toISOString();
  const isNewlyFailed = newResult === 'failed' && existingResult.result !== 'failed';

  db.prepare(`
    UPDATE test_run_results
    SET result = ?, notes = ?, failed_at = ?
    WHERE run_id = ? AND test_case_id = ?
  `).run(newResult, notes, newResult === 'failed' ? now : existingResult.failed_at, run.id, testCaseId);

  recomputeRunAggregates(run.id);

  const testCase = db.prepare('SELECT title FROM test_cases WHERE id = ?').get(testCaseId);

  if (isNewlyFailed) {
    const alertSent = await sendFailureAlert({ runId: run.id, testCaseTitle: testCase?.title, notes });
    if (alertSent) {
      db.prepare('UPDATE test_run_results SET alert_sent_at = ? WHERE run_id = ? AND test_case_id = ?').run(
        now,
        run.id,
        testCaseId
      );
    }
  }

  const flakeCheck = checkNewlyFlaky(db, testCaseId);
  if (flakeCheck.isNewlyFlaky) {
    await sendFlakeAlert({ testCaseTitle: testCase?.title, flipCount: flakeCheck.flipCount });
  }

  const updatedRun = getRunRow(run.id);
  ok(res, { ...updatedRun, results: getRunResults(run.id) });
}

router.get('/', handleListRuns);
router.get('/:id', handleGetRun);
router.post('/', handleCreateRun);
router.put('/:id/cases/:testCaseId', handleUpdateResult);

export default router;
