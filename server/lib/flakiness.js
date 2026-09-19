// Shared by server/routes/testRuns.js (which needs to know when a single
// write just made a test case newly flaky, to fire a Discord alert) and
// server/routes/dashboard.js (which needs the full ranked leaderboard) —
// kept in one place so the definition of "flaky" can't drift between them.

// A flip is an adjacent pair of results that changes between passed and
// failed. `skipped` carries no signal either way and is ignored. `results`
// must already be in chronological order.
export function countFlips(results) {
  const relevant = results.filter((r) => r.result === 'passed' || r.result === 'failed');
  let flips = 0;
  for (let i = 1; i < relevant.length; i++) {
    if (relevant[i].result !== relevant[i - 1].result) flips++;
  }
  return flips;
}

// Every test case's full result history across all runs, chronological.
function getAllResultHistoriesByTestCase(db) {
  const rows = db
    .prepare(`
      SELECT rr.test_case_id, rr.result, tc.title, tc.severity, r.start_time
      FROM test_run_results rr
      JOIN test_runs_v2 r ON r.id = rr.run_id
      JOIN test_cases tc ON tc.id = rr.test_case_id
      WHERE rr.result IS NOT NULL
      ORDER BY rr.test_case_id ASC, r.start_time ASC, rr.id ASC
    `)
    .all();

  const byTestCase = new Map();
  for (const row of rows) {
    if (!byTestCase.has(row.test_case_id)) {
      byTestCase.set(row.test_case_id, { title: row.title, severity: row.severity, results: [] });
    }
    byTestCase.get(row.test_case_id).results.push({ result: row.result });
  }
  return byTestCase;
}

// The full leaderboard: every test case with at least one flip, ranked
// highest-first. Computed fresh on every call — data volumes here are small
// enough that this needs no caching or a stored/persisted table.
export function getFlakeLeaderboard(db) {
  const byTestCase = getAllResultHistoriesByTestCase(db);
  const leaderboard = [];

  for (const [testCaseId, { title, severity, results }] of byTestCase) {
    const flipCount = countFlips(results);
    if (flipCount > 0) {
      leaderboard.push({
        test_case_id: testCaseId,
        title,
        severity,
        flip_count: flipCount,
        last_result: results[results.length - 1].result,
      });
    }
  }

  leaderboard.sort((a, b) => b.flip_count - a.flip_count);
  return leaderboard;
}

// Did this test case just cross from "not flaky" to "flaky" for the first
// time? Compares flip count with vs. without the most recent result in its
// history, so a test that's already flaky doesn't re-alert on every
// subsequent flip. Returns the new flip count alongside the answer so a
// caller that wants to alert doesn't have to query this again.
export function checkNewlyFlaky(db, testCaseId) {
  const results = db
    .prepare(`
      SELECT rr.result
      FROM test_run_results rr
      JOIN test_runs_v2 r ON r.id = rr.run_id
      WHERE rr.test_case_id = ? AND rr.result IS NOT NULL
      ORDER BY r.start_time ASC, rr.id ASC
    `)
    .all(testCaseId);

  if (results.length < 2) return { isNewlyFlaky: false, flipCount: 0 };

  const flipsWithLatest = countFlips(results);
  const flipsWithoutLatest = countFlips(results.slice(0, -1));
  return { isNewlyFlaky: flipsWithoutLatest === 0 && flipsWithLatest > 0, flipCount: flipsWithLatest };
}
