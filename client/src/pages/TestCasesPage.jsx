import { useEffect, useState, useCallback } from 'react';
import { listTestCases, createTestCase, updateTestCase, deleteTestCase, getTestCaseSuites } from '../api/testCases';
import SeverityBadge from '../components/SeverityBadge';
import TestCaseFormModal from '../components/TestCaseFormModal';
import { STATUSES, STATUS_LABELS } from '../constants';

function formatDate(iso) {
  return new Date(iso).toLocaleString();
}

function TestCasesPage() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('updated_at');
  const [order, setOrder] = useState('desc');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalState, setModalState] = useState(null); // null | { mode: 'create' } | { mode: 'edit', item }

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listTestCases({ search, status: statusFilter, sortBy, order, page })
      .then((data) => {
        setItems(data.items);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [search, statusFilter, sortBy, order, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  function toggleSort(column) {
    if (sortBy === column) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setOrder('asc');
    }
    setPage(1);
  }

  function sortIndicator(column) {
    if (sortBy !== column) return '';
    return order === 'asc' ? ' ▲' : ' ▼';
  }

  async function handleSave(payload) {
    if (modalState.mode === 'create') {
      await createTestCase(payload);
    } else {
      await updateTestCase(modalState.item.id, payload);
    }
    setModalState(null);
    load();
  }

  async function handleDelete(item) {
    let suites = [];
    try {
      ({ suites } = await getTestCaseSuites(item.id));
    } catch {
      // If this lookup fails, fall back to the plain confirmation below
      // rather than blocking deletion on an unrelated request failure.
    }

    const suiteWarning = suites.length
      ? ` It is used in ${suites.length} suite${suites.length === 1 ? '' : 's'} (${suites.map((s) => s.name).join(', ')}), and will be removed from ${suites.length === 1 ? 'it' : 'all of them'} too.`
      : '';

    if (!window.confirm(`Delete "${item.title}"?${suiteWarning} This cannot be undone.`)) return;
    try {
      await deleteTestCase(item.id);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Test cases</h1>
        <button className="btn-primary" onClick={() => setModalState({ mode: 'create' })}>
          + New test case
        </button>
      </div>

      <div className="toolbar">
        <input
          type="text"
          placeholder="Search by title…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="search-input"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {error && <p className="form-error">{error}</p>}

      <table className="test-case-table">
        <thead>
          <tr>
            <th className="sortable" onClick={() => toggleSort('title')}>
              Title{sortIndicator('title')}
            </th>
            <th className="sortable" onClick={() => toggleSort('severity')}>
              Severity{sortIndicator('severity')}
            </th>
            <th className="sortable" onClick={() => toggleSort('status')}>
              Status{sortIndicator('status')}
            </th>
            <th className="sortable" onClick={() => toggleSort('updated_at')}>
              Updated{sortIndicator('updated_at')}
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={5}>Loading…</td></tr>
          ) : items.length === 0 ? (
            <tr><td colSpan={5}>No test cases found.</td></tr>
          ) : (
            items.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td><SeverityBadge severity={item.severity} /></td>
                <td>{STATUS_LABELS[item.status]}</td>
                <td>{formatDate(item.updated_at)}</td>
                <td className="row-actions">
                  <button className="link-btn" onClick={() => setModalState({ mode: 'edit', item })}>
                    Edit
                  </button>
                  <button className="link-btn danger" onClick={() => handleDelete(item)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="pagination">
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Previous
        </button>
        <span>
          Page {page} of {totalPages} ({total} total)
        </span>
        <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
          Next
        </button>
      </div>

      {modalState && (
        <TestCaseFormModal
          initial={modalState.mode === 'edit' ? modalState.item : null}
          onSave={handleSave}
          onClose={() => setModalState(null)}
        />
      )}
    </div>
  );
}

export default TestCasesPage;
