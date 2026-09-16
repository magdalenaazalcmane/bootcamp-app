import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { listBugs, createBug, deleteBug } from '../api/bugs';
import SeverityBadge from '../components/SeverityBadge';
import BugFormModal from '../components/BugFormModal';
import { SEVERITIES, BUG_STATUSES, BUG_STATUS_LABELS } from '../constants';

function formatDate(iso) {
  return new Date(iso).toLocaleString();
}

function BugsPage() {
  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState('updated_at');
  const [order, setOrder] = useState('desc');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listBugs({ status: statusFilter, severity: severityFilter, search, sortBy, order })
      .then((data) => setItems(data.items))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [statusFilter, severityFilter, search, sortBy, order]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  function toggleSort(column) {
    if (sortBy === column) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setOrder('asc');
    }
  }

  function sortIndicator(column) {
    if (sortBy !== column) return '';
    return order === 'asc' ? ' ▲' : ' ▼';
  }

  function ariaSortFor(column) {
    if (sortBy !== column) return 'none';
    return order === 'asc' ? 'ascending' : 'descending';
  }

  function handleSortKeyDown(e, column) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleSort(column);
    }
  }

  async function handleCreate(payload) {
    await createBug(payload);
    setShowForm(false);
    load();
  }

  async function handleDelete(bug) {
    if (!window.confirm(`Delete "${bug.title}"? This cannot be undone.`)) return;
    try {
      await deleteBug(bug.id);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Bugs</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + New bug
        </button>
      </div>

      <div className="toolbar">
        <label className="visually-hidden" htmlFor="bug-search">Search by title or description</label>
        <input
          id="bug-search"
          type="text"
          placeholder="Search by title or description…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="search-input"
        />
        <label className="visually-hidden" htmlFor="bug-status-filter">Filter by status</label>
        <select id="bug-status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {BUG_STATUSES.map((s) => (
            <option key={s} value={s}>{BUG_STATUS_LABELS[s]}</option>
          ))}
        </select>
        <label className="visually-hidden" htmlFor="bug-severity-filter">Filter by severity</label>
        <select id="bug-severity-filter" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
          <option value="">All severities</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {error && <p className="form-error">{error}</p>}

      <table className="test-case-table">
        <thead>
          <tr>
            <th
              className="sortable"
              role="button"
              tabIndex={0}
              aria-sort={ariaSortFor('title')}
              onClick={() => toggleSort('title')}
              onKeyDown={(e) => handleSortKeyDown(e, 'title')}
            >
              Title{sortIndicator('title')}
            </th>
            <th
              className="sortable"
              role="button"
              tabIndex={0}
              aria-sort={ariaSortFor('severity')}
              onClick={() => toggleSort('severity')}
              onKeyDown={(e) => handleSortKeyDown(e, 'severity')}
            >
              Severity{sortIndicator('severity')}
            </th>
            <th
              className="sortable"
              role="button"
              tabIndex={0}
              aria-sort={ariaSortFor('priority')}
              onClick={() => toggleSort('priority')}
              onKeyDown={(e) => handleSortKeyDown(e, 'priority')}
            >
              Priority{sortIndicator('priority')}
            </th>
            <th
              className="sortable"
              role="button"
              tabIndex={0}
              aria-sort={ariaSortFor('status')}
              onClick={() => toggleSort('status')}
              onKeyDown={(e) => handleSortKeyDown(e, 'status')}
            >
              Status{sortIndicator('status')}
            </th>
            <th
              className="sortable"
              role="button"
              tabIndex={0}
              aria-sort={ariaSortFor('updated_at')}
              onClick={() => toggleSort('updated_at')}
              onKeyDown={(e) => handleSortKeyDown(e, 'updated_at')}
            >
              Updated{sortIndicator('updated_at')}
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={6}>Loading…</td></tr>
          ) : items.length === 0 ? (
            <tr><td colSpan={6}>No bugs found.</td></tr>
          ) : (
            items.map((bug) => (
              <tr key={bug.id}>
                <td><Link to={`/bugs/${bug.id}`}>{bug.title}</Link></td>
                <td><SeverityBadge severity={bug.severity} /></td>
                <td>{bug.priority}</td>
                <td>{BUG_STATUS_LABELS[bug.status]}</td>
                <td>{formatDate(bug.updated_at)}</td>
                <td className="row-actions">
                  <button className="link-btn danger" onClick={() => handleDelete(bug)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {showForm && (
        <BugFormModal onSave={handleCreate} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}

export default BugsPage;
