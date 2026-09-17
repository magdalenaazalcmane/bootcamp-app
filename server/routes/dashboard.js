import { Router } from 'express';
import db from '../db.js';

const router = Router();

function ok(res, data) {
  res.json({ success: true, data, error: null });
}

function handleGetMetrics(req, res) {
  const totalTestCases = db.prepare('SELECT COUNT(*) AS count FROM test_cases').get().count;

  // Pass rate is derived from actual recorded test run results (passed vs.
  // passed+failed+skipped across all runs), not test_cases.status — that
  // field tracks authoring/lifecycle state, not execution outcomes, and this
  // dashboard is specifically about run activity.
  const passRateRow = db
    .prepare('SELECT SUM(pass_count) AS passed, SUM(pass_count + fail_count + skip_count) AS total FROM test_runs_v2')
    .get();
  const passRate =
    passRateRow.total && passRateRow.total > 0
      ? Math.round((passRateRow.passed / passRateRow.total) * 1000) / 10
      : null;

  // "Open" means not yet closed — in-progress/reopened/resolved bugs still
  // need attention; only "closed" is truly done.
  const openBugs = db.prepare("SELECT COUNT(*) AS count FROM bugs WHERE status != 'closed'").get().count;

  // duration_ms on individual results is mostly unpopulated (no UI captures
  // it), so average duration is computed from each completed run's own
  // start_time/end_time instead, which is always set once a run finishes.
  const durationRow = db
    .prepare(`
      SELECT AVG((julianday(end_time) - julianday(start_time)) * 86400) AS avg_seconds
      FROM test_runs_v2
      WHERE end_time IS NOT NULL
    `)
    .get();
  const avgRunDurationSeconds =
    durationRow.avg_seconds !== null ? Math.round(durationRow.avg_seconds) : null;

  const recentRuns = db
    .prepare(`
      SELECT r.id, r.suite_id, r.status, r.pass_count, r.fail_count, r.skip_count, r.start_time, r.end_time, s.name AS suite_name
      FROM test_runs_v2 r
      JOIN suites s ON s.id = r.suite_id
      ORDER BY r.start_time DESC
      LIMIT 10
    `)
    .all();

  const recentActivity = db
    .prepare(`
      SELECT ba.id, ba.bug_id, ba.action, ba.old_value, ba.new_value, ba.message, ba.timestamp, b.title AS bug_title
      FROM bug_activity ba
      JOIN bugs b ON b.id = ba.bug_id
      ORDER BY ba.timestamp DESC
      LIMIT 10
    `)
    .all()
    .map((row) => ({
      id: row.id,
      bug_id: row.bug_id,
      bug_title: row.bug_title,
      timestamp: row.timestamp,
      description:
        row.action === 'status_change'
          ? `Bug #${row.bug_id} marked ${row.new_value}`
          : `Comment added on bug #${row.bug_id}`,
    }));

  ok(res, {
    metrics: {
      total_test_cases: totalTestCases,
      pass_rate: passRate,
      open_bugs: openBugs,
      avg_run_duration_seconds: avgRunDurationSeconds,
    },
    recent_runs: recentRuns,
    recent_activity: recentActivity,
  });
}

router.get('/metrics', handleGetMetrics);

export default router;
