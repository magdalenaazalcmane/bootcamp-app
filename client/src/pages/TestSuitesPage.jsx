import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { listSuites, createSuite, deleteSuite } from '../api/suites';
import SuiteFormModal from '../components/SuiteFormModal';
import { SUITE_STATUSES, SUITE_STATUS_LABELS } from '../constants';

function formatDate(iso) {
  return new Date(iso).toLocaleString();
}

function TestSuitesPage() {
  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listSuites({ status: statusFilter })
      .then((data) => setItems(data.items))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(payload) {
    await createSuite(payload);
    setShowForm(false);
    load();
  }

  async function handleDelete(suite) {
    if (!window.confirm(`Delete "${suite.name}"? This cannot be undone.`)) return;
    try {
      await deleteSuite(suite.id);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Test suites</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + New suite
        </button>
      </div>

      <div className="toolbar">
        <label className="visually-hidden" htmlFor="suite-status-filter">Filter by status</label>
        <select id="suite-status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {SUITE_STATUSES.map((s) => (
            <option key={s} value={s}>{SUITE_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="table-scroll">
      <table className="test-case-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Feature</th>
            <th>Status</th>
            <th>Cases</th>
            <th>Updated</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={6}>Loading…</td></tr>
          ) : items.length === 0 ? (
            <tr><td colSpan={6}>No suites found.</td></tr>
          ) : (
            items.map((suite) => (
              <tr key={suite.id}>
                <td><Link to={`/test-suites/${suite.id}`}>{suite.name}</Link></td>
                <td className="feature-value">{suite.feature}</td>
                <td>{SUITE_STATUS_LABELS[suite.status]}</td>
                <td>{suite.case_count}</td>
                <td>{formatDate(suite.updated_at)}</td>
                <td>
                  <div className="row-actions">
                    <button className="link-btn danger" onClick={() => handleDelete(suite)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>

      {showForm && (
        <SuiteFormModal onSave={handleCreate} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}

export default TestSuitesPage;
