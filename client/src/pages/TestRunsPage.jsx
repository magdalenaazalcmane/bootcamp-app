import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { listRuns } from '../api/testRuns';
import { RUN_STATUS_LABELS } from '../constants';

function formatDate(iso) {
  return new Date(iso).toLocaleString();
}

function TestRunsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listRuns()
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
        <h1>Test runs</h1>
      </div>

      {error && <p className="form-error">{error}</p>}

      <table className="test-case-table">
        <thead>
          <tr>
            <th>Suite</th>
            <th>Status</th>
            <th>Passed</th>
            <th>Failed</th>
            <th>Skipped</th>
            <th>Started</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={6}>Loading…</td></tr>
          ) : items.length === 0 ? (
            <tr><td colSpan={6}>No test runs yet. Start one from a suite's page.</td></tr>
          ) : (
            items.map((run) => (
              <tr key={run.id}>
                <td><Link to={`/test-runs/${run.id}`}>{run.suite_name}</Link></td>
                <td>{RUN_STATUS_LABELS[run.status]}</td>
                <td>{run.pass_count}</td>
                <td>{run.fail_count}</td>
                <td>{run.skip_count}</td>
                <td>{formatDate(run.start_time)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default TestRunsPage;
