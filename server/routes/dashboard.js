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

const COVERAGE_STATUSES = ['draft', 'ready', 'passed', 'failed', 'skipped'];
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function handleGetTrends(req, res) {
  // 1. Pass-rate trend: last 10 runs that actually have recorded results,
  // oldest first (left-to-right on a line chart). Runs with zero recorded
  // results (freshly created, nothing marked yet) carry no trend information
  // and are excluded rather than plotted as a misleading 0%.
  const passRateTrend = db
    .prepare(`
      SELECT id, start_time, pass_count, fail_count, skip_count
      FROM test_runs_v2
      WHERE (pass_count + fail_count + skip_count) > 0
      ORDER BY start_time DESC
      LIMIT 10
    `)
    .all()
    .reverse()
    .map((r) => {
      const total = r.pass_count + r.fail_count + r.skip_count;
      return {
        run_id: r.id,
        date: r.start_time,
        pass_rate: Math.round((r.pass_count / total) * 1000) / 10,
      };
    });

  // 2. Bugs opened vs. closed per week, last 8 weeks (oldest first). "Closed"
  // counts actual close events from bug_activity (a bug can be closed,
  // reopened, and closed again), not a snapshot of bugs currently closed.
  const bugsPerWeek = [];
  const now = Date.now();
  const openedStmt = db.prepare('SELECT COUNT(*) AS count FROM bugs WHERE created_at >= ? AND created_at < ?');
  const closedStmt = db.prepare(`
    SELECT COUNT(*) AS count FROM bug_activity
    WHERE action = 'status_change' AND new_value = 'closed' AND timestamp >= ? AND timestamp < ?
  `);
  for (let i = 7; i >= 0; i--) {
    const weekEnd = new Date(now - i * WEEK_MS);
    const weekStart = new Date(weekEnd.getTime() - WEEK_MS);
    const opened = openedStmt.get(weekStart.toISOString(), weekEnd.toISOString()).count;
    const closed = closedStmt.get(weekStart.toISOString(), weekEnd.toISOString()).count;
    bugsPerWeek.push({ week_start: weekStart.toISOString(), opened, closed });
  }

  // 3. Test coverage by status — every status always represented (0 if none),
  // so the chart's category set never shifts based on what data happens to exist.
  const statusCounts = Object.fromEntries(
    db.prepare('SELECT status, COUNT(*) AS count FROM test_cases GROUP BY status').all().map((r) => [r.status, r.count])
  );
  const coverageByStatus = COVERAGE_STATUSES.map((status) => ({ status, count: statusCounts[status] || 0 }));

  ok(res, {
    pass_rate_trend: passRateTrend,
    bugs_per_week: bugsPerWeek,
    coverage_by_status: coverageByStatus,
  });
}

router.get('/metrics', handleGetMetrics);
router.get('/trends', handleGetTrends);

export default router;
