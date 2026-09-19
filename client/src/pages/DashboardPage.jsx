import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardMetrics, getDashboardTrends } from '../api/dashboard';
import { RUN_STATUS_LABELS } from '../constants';
import PassRateTrendChart from '../components/charts/PassRateTrendChart';
import BugsPerWeekChart from '../components/charts/BugsPerWeekChart';
import CoverageDonutChart from '../components/charts/CoverageDonutChart';

const REFRESH_INTERVAL_MS = 30000;

function formatDate(iso) {
  return new Date(iso).toLocaleString();
}

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return '—';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining}s`;
}

function MetricCard({ label, value, hint }) {
  return (
    <div className="metric-card">
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>
      {hint && <div className="metric-hint">{hint}</div>}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="page">
      <h1>Dashboard</h1>
      <div className="metrics-grid">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="metric-card skeleton-block" style={{ height: '5.5rem' }} />
        ))}
      </div>
      <div className="skeleton-block" style={{ height: '12rem', marginTop: '1.5rem' }} />
      <div className="skeleton-block" style={{ height: '12rem', marginTop: '1.5rem' }} />
    </div>
  );
}

function DashboardPage() {
  const [data, setData] = useState(null);
  const [trends, setTrends] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  const load = useCallback(() => {
    if (!hasLoadedOnce.current) setLoading(true);
    Promise.all([getDashboardMetrics(), getDashboardTrends()])
      .then(([metricsResult, trendsResult]) => {
        setData(metricsResult);
        setTrends(trendsResult);
        setError(null);
        hasLoadedOnce.current = true;
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  if (loading && !data) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="page">
      <h1>Dashboard</h1>

      {error && <p className="form-error">{error}</p>}

      {data && (
        <>
          <div className="metrics-grid">
            <MetricCard
              label="Total test cases"
              value={data.metrics.total_test_cases}
              hint={data.metrics.total_test_cases === 0 && <Link to="/test-cases">Add your first test case →</Link>}
            />
            <MetricCard
              label="Pass rate"
              value={data.metrics.pass_rate === null ? 'No runs yet' : `${data.metrics.pass_rate}%`}
              hint={data.metrics.pass_rate === null && <Link to="/test-suites">Start a test run →</Link>}
            />
            <MetricCard label="Open bugs" value={data.metrics.open_bugs} />
            <MetricCard
              label="Avg. run duration"
              value={
                data.metrics.avg_run_duration_seconds === null
                  ? 'No runs yet'
                  : formatDuration(data.metrics.avg_run_duration_seconds)
              }
              hint={data.metrics.avg_run_duration_seconds === null && <Link to="/test-suites">Start a test run →</Link>}
            />
          </div>

          {trends && (
            <div className="charts-grid">
              <PassRateTrendChart data={trends.pass_rate_trend} />
              <BugsPerWeekChart data={trends.bugs_per_week} />
              <CoverageDonutChart data={trends.coverage_by_status} />
            </div>
          )}

          <h2>Recent test runs</h2>
          {data.recent_runs.length === 0 ? (
            <div className="empty-state">
              <p>No test runs yet.</p>
              <p><Link to="/test-suites">Start a test run</Link> from one of your suites to see it here.</p>
            </div>
          ) : (
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
                {data.recent_runs.map((run) => (
                  <tr key={run.id}>
                    <td><Link to={`/test-runs/${run.id}`}>{run.suite_name}</Link></td>
                    <td>{RUN_STATUS_LABELS[run.status]}</td>
                    <td>{run.pass_count}</td>
                    <td>{run.fail_count}</td>
                    <td>{run.skip_count}</td>
                    <td>{formatDate(run.start_time)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h2>Recent activity</h2>
          {data.recent_activity.length === 0 ? (
            <div className="empty-state">
              <p>No activity yet.</p>
              <p><Link to="/bugs">Open a bug</Link> and change its status or add a comment to see it here.</p>
            </div>
          ) : (
            <ul className="activity-list">
              {data.recent_activity.map((item) => (
                <li key={item.id} className="activity-entry">
                  <div className="activity-meta">
                    <Link to={`/bugs/${item.bug_id}`}>{item.description}</Link>
                    <span className="activity-timestamp">{formatDate(item.timestamp)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export default DashboardPage;
