import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getReport, getReportDownloadUrl, getReportPrintUrl } from '../api/reports';
import SeverityBadge from '../components/SeverityBadge';
import { RESULT_LABELS } from '../constants';

function formatDate(iso) {
  return new Date(iso).toLocaleString();
}

function ReportDetailPage() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getReport(id)
      .then(setReport)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  function handlePrint() {
    window.open(getReportPrintUrl(id), '_blank');
  }

  if (loading) return <div className="page">Loading…</div>;
  if (error) return <div className="page"><p className="form-error">{error}</p></div>;
  if (!report) return null;

  return (
    <div className="page">
      <p><Link to="/reports">← Back to reports</Link></p>
      <div className="page-header">
        <h1>Report: {report.suite_name}</h1>
        <div className="page-header-actions">
          <a className="btn-secondary" href={getReportDownloadUrl(id)} download>
            Download HTML
          </a>
          <button className="btn-primary" onClick={handlePrint}>
            Print / Save as PDF
          </button>
        </div>
      </div>

      <p className="suite-meta">
        Run date: {formatDate(report.run_date)} · Generated: {formatDate(report.generated_at)}
      </p>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-value">{report.total_count}</div>
          <div className="metric-label">Total</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{report.passed_count}</div>
          <div className="metric-label">Passed</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{report.failed_count}</div>
          <div className="metric-label">Failed</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{report.skipped_count}</div>
          <div className="metric-label">Skipped</div>
        </div>
      </div>

      {report.narrative && (
        <div className="report-narrative">
          <h2>Summary</h2>
          <p>{report.narrative}</p>
        </div>
      )}

      <h2>Results</h2>
      <table className="test-case-table">
        <thead>
          <tr>
            <th>Test case</th>
            <th>Severity</th>
            <th>Result</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {report.results.map((r) => (
            <tr key={r.test_case_id}>
              <td>{r.title}</td>
              <td><SeverityBadge severity={r.severity} /></td>
              <td>{r.result ? RESULT_LABELS[r.result] : 'Pending'}</td>
              <td>{r.notes || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ReportDetailPage;
