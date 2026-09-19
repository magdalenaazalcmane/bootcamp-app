import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { listReports } from '../api/reports';

function formatDate(iso) {
  return new Date(iso).toLocaleString();
}

function ReportsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listReports()
      .then((data) => setItems(data.items))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Reports</h1>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="table-scroll">
      <table className="test-case-table">
        <thead>
          <tr>
            <th>Suite</th>
            <th>Run date</th>
            <th>Passed</th>
            <th>Failed</th>
            <th>Skipped</th>
            <th>Generated</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={6}>Loading…</td></tr>
          ) : items.length === 0 ? (
            <tr><td colSpan={6}>No reports yet. Generate one from a test run's page.</td></tr>
          ) : (
            items.map((report) => (
              <tr key={report.id}>
                <td><Link to={`/reports/${report.id}`}>{report.suite_name}</Link></td>
                <td>{formatDate(report.run_date)}</td>
                <td>{report.passed_count}</td>
                <td>{report.failed_count}</td>
                <td>{report.skipped_count}</td>
                <td>{formatDate(report.generated_at)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}

export default ReportsPage;
