import { Router } from 'express';
import db from '../db.js';

const router = Router();

function ok(res, data) {
  res.json({ success: true, data, error: null });
}

function fail(res, status, error) {
  res.status(status).json({ success: false, data: null, error });
}

function serializeReport(row) {
  return { ...row, results: JSON.parse(row.results) };
}

function getReportRow(id) {
  return db.prepare('SELECT * FROM reports WHERE id = ?').get(id);
}

function handleListReports(req, res) {
  const rows = db
    .prepare(`
      SELECT id, run_id, suite_name, run_date, total_count, passed_count, failed_count, skipped_count, generated_at
      FROM reports
      ORDER BY generated_at DESC
    `)
    .all();
  ok(res, { items: rows });
}

function handleGetReport(req, res) {
  const row = getReportRow(req.params.id);
  if (!row) return fail(res, 404, 'Report not found');
  ok(res, serializeReport(row));
}

function handleCreateReport(req, res) {
  const runId = Number(req.body?.run_id);
  if (!runId) return fail(res, 400, 'run_id is required');

  const run = db
    .prepare(`
      SELECT r.*, s.name AS suite_name
      FROM test_runs_v2 r
      JOIN suites s ON s.id = r.suite_id
      WHERE r.id = ?
    `)
    .get(runId);
  if (!run) return fail(res, 404, 'Test run not found');

  const results = db
    .prepare(`
      SELECT rr.test_case_id, rr.result, rr.notes, rr.failed_at, tc.title, tc.severity
      FROM test_run_results rr
      JOIN test_cases tc ON tc.id = rr.test_case_id
      WHERE rr.run_id = ?
      ORDER BY rr.id ASC
    `)
    .all(runId);

  const now = new Date().toISOString();
  const insert = db
    .prepare(`
      INSERT INTO reports (run_id, suite_name, run_date, total_count, passed_count, failed_count, skipped_count, results, generated_at)
      VALUES (@run_id, @suite_name, @run_date, @total_count, @passed_count, @failed_count, @skipped_count, @results, @generated_at)
    `)
    .run({
      run_id: run.id,
      suite_name: run.suite_name,
      run_date: run.start_time,
      total_count: results.length,
      passed_count: run.pass_count,
      failed_count: run.fail_count,
      skipped_count: run.skip_count,
      results: JSON.stringify(results),
      generated_at: now,
    });

  ok(res, serializeReport(getReportRow(insert.lastInsertRowid)));
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

const PROJECT_NAME = 'Bootcamp App';

const RESULT_LABEL = { passed: 'Passed', failed: 'Failed', skipped: 'Skipped' };

// Same palette used on-screen: a tinted background + matching dark text,
// rendered as a pill, not just colored text — same treatment for severity,
// reusing the exact colors from client/src/components/SeverityBadge.jsx so
// the emailed report visually matches the app.
const RESULT_BADGE = {
  passed: { bg: '#dcf5e3', fg: '#1c7c3c' },
  failed: { bg: '#fde2e1', fg: '#b3261e' },
  skipped: { bg: '#fdf3c6', fg: '#8a6d00' },
};
const PENDING_BADGE = { bg: '#e3e8ee', fg: '#4a5568' };

const SEVERITY_BADGE = {
  Critical: { bg: '#fde2e1', fg: '#8a1c14' },
  Major: { bg: '#fde8cc', fg: '#8a4a10' },
  Minor: { bg: '#fdf3c6', fg: '#7a6206' },
  Trivial: { bg: '#e3e8ee', fg: '#3d4a5c' },
};

const SUMMARY_ACCENT = { total: '#4a5568', passed: '#1c7c3c', failed: '#b3261e', skipped: '#8a6d00' };

function badge(bg, fg, label) {
  return `<span style="display:inline-block; padding:0.2rem 0.7rem; border-radius:999px; font-size:0.8rem; font-weight:600; background:${bg}; color:${fg}; white-space:nowrap;">${escapeHtml(label)}</span>`;
}

function renderReportHtml(report, { autoprint }) {
  const rows = report.results
    .map((r) => {
      const resultBadge = r.result ? RESULT_BADGE[r.result] : PENDING_BADGE;
      const resultLabel = r.result ? RESULT_LABEL[r.result] : 'Pending';
      const severityColors = SEVERITY_BADGE[r.severity] || SEVERITY_BADGE.Trivial;
      return `
        <tr>
          <td>${escapeHtml(r.title)}</td>
          <td>${badge(severityColors.bg, severityColors.fg, r.severity)}</td>
          <td>${badge(resultBadge.bg, resultBadge.fg, resultLabel)}</td>
          <td class="notes">${escapeHtml(r.notes || '')}</td>
        </tr>`;
    })
    .join('');

  function summaryCard(label, value, accent) {
    return `
      <div class="summary-card" style="border-top-color:${accent};">
        <div class="summary-value" style="color:${accent};">${value}</div>
        <div class="summary-label">${escapeHtml(label)}</div>
      </div>`;
  }

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Test report — ${escapeHtml(report.suite_name)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
    color: #1a1a1a;
    margin: 0;
    padding: 2.5rem 2rem;
    background: #f4f6f8;
  }
  .sheet {
    max-width: 860px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 12px;
    padding: 2.5rem 3rem 2rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }
  .brand {
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-size: 0.8rem;
    font-weight: 700;
    color: #0b63c5;
    margin-bottom: 0.5rem;
  }
  h1 { margin: 0 0 0.4rem; font-size: 1.7rem; }
  .header-meta { color: #555; font-size: 0.95rem; margin-bottom: 1.75rem; }
  .header-meta strong { color: #1a1a1a; }
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 2rem;
  }
  .summary-card {
    border: 1px solid #e3e8ee;
    border-top: 4px solid #ccc;
    border-radius: 10px;
    padding: 1rem 0.5rem;
    text-align: center;
    background: #fafbfc;
  }
  .summary-value { font-size: 1.9rem; font-weight: 700; line-height: 1.2; }
  .summary-label { font-size: 0.85rem; color: #6b7684; margin-top: 0.25rem; }
  h2 { font-size: 1.1rem; margin: 0 0 0.75rem; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; }
  th, td { text-align: left; padding: 0.6rem 0.75rem; border-bottom: 1px solid #eef1f5; vertical-align: top; }
  th { background: #f5f7f9; font-size: 0.85rem; color: #4a5568; text-transform: uppercase; letter-spacing: 0.03em; }
  td.notes { color: #4a5568; font-size: 0.9rem; }
  .footer {
    border-top: 1px solid #eef1f5;
    padding-top: 1rem;
    color: #8a94a3;
    font-size: 0.8rem;
    display: flex;
    justify-content: space-between;
  }
  @media print {
    body { background: #fff; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .sheet { box-shadow: none; border-radius: 0; max-width: 100%; padding: 0.4in 0.5in; }
    tr, .summary-card { page-break-inside: avoid; }
    thead { display: table-header-group; }
  }
</style>
</head>
<body>
  <div class="sheet">
    <div class="brand">${escapeHtml(PROJECT_NAME)}</div>
    <h1>Test Report: ${escapeHtml(report.suite_name)}</h1>
    <p class="header-meta">
      Run date: <strong>${new Date(report.run_date).toLocaleString()}</strong>
    </p>

    <div class="summary-grid">
      ${summaryCard('Total', report.total_count, SUMMARY_ACCENT.total)}
      ${summaryCard('Passed', report.passed_count, SUMMARY_ACCENT.passed)}
      ${summaryCard('Failed', report.failed_count, SUMMARY_ACCENT.failed)}
      ${summaryCard('Skipped', report.skipped_count, SUMMARY_ACCENT.skipped)}
    </div>

    <h2>Results</h2>
    <table>
      <thead><tr><th>Test case</th><th>Severity</th><th>Result</th><th>Notes</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
      <span>Generated by ${escapeHtml(PROJECT_NAME)}</span>
      <span>Generated at ${new Date(report.generated_at).toLocaleString()}</span>
    </div>
  </div>
  ${autoprint ? '<script>window.onload = function () { window.print(); };</script>' : ''}
</body>
</html>`;
}

// This one endpoint deliberately does NOT use the {success, data, error}
// envelope from CLAUDE.md — its whole purpose is to serve a real, downloadable
// and printable HTML document. Wrapping that in a JSON envelope would break
// exactly what it's for: the browser needs to download/render actual HTML,
// not a JSON blob containing an HTML string. Every other endpoint in this
// file follows the envelope normally.
function handleExportHtml(req, res) {
  const report = getReportRow(req.params.id);
  if (!report) return fail(res, 404, 'Report not found');

  const mode = req.query.mode === 'print' ? 'print' : 'download';
  const html = renderReportHtml(serializeReport(report), { autoprint: mode === 'print' });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    mode === 'download' ? `attachment; filename="report-${report.id}.html"` : 'inline'
  );
  res.send(html);
}

router.get('/', handleListReports);
router.get('/:id', handleGetReport);
router.post('/', handleCreateReport);
router.get('/:id/export/html', handleExportHtml);

export default router;
