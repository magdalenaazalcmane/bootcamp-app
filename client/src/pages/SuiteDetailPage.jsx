import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getSuite, updateSuite, addCaseToSuite, removeCaseFromSuite, reorderSuiteCases } from '../api/suites';
import { listTestCases } from '../api/testCases';
import { createRun } from '../api/testRuns';
import SeverityBadge from '../components/SeverityBadge';
import SuiteFormModal from '../components/SuiteFormModal';
import { STATUS_LABELS, SUITE_STATUS_LABELS } from '../constants';

function SuiteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [startingRun, setStartingRun] = useState(false);
  const [suite, setSuite] = useState(null);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [showEditForm, setShowEditForm] = useState(false);

  const dragIndexRef = useRef(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getSuite(id)
      .then((data) => {
        setSuite(data);
        setCases(data.cases);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!searchInput.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      listTestCases({ search: searchInput })
        .then((data) => setSearchResults(data.items))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  async function handleNewRun() {
    setStartingRun(true);
    try {
      const run = await createRun(id);
      navigate(`/test-runs/${run.id}`);
    } catch (err) {
      alert(err.message);
      setStartingRun(false);
    }
  }

  async function handleEditSave(payload) {
    const data = await updateSuite(id, payload);
    setSuite(data);
    setCases(data.cases);
    setShowEditForm(false);
  }

  async function handleAddCase(testCaseId) {
    try {
      const data = await addCaseToSuite(id, testCaseId);
      setSuite(data);
      setCases(data.cases);
      setSearchInput('');
      setSearchResults([]);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleRemoveCase(testCaseId) {
    try {
      const data = await removeCaseFromSuite(id, testCaseId);
      setSuite(data);
      setCases(data.cases);
    } catch (err) {
      alert(err.message);
    }
  }

  function handleDragStart(index) {
    dragIndexRef.current = index;
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  async function handleDrop(index) {
    const from = dragIndexRef.current;
    dragIndexRef.current = null;
    if (from === null || from === index) return;

    const reordered = [...cases];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(index, 0, moved);

    const previous = cases;
    setCases(reordered);

    try {
      const data = await reorderSuiteCases(id, reordered.map((c) => c.test_case_id));
      setSuite(data);
      setCases(data.cases);
    } catch (err) {
      setCases(previous);
      alert(err.message);
    }
  }

  if (loading) return <div className="page">Loading…</div>;
  if (error) return <div className="page"><p className="form-error">{error}</p></div>;
  if (!suite) return null;

  const caseIdsInSuite = new Set(cases.map((c) => c.test_case_id));
  const addableResults = searchResults.filter((r) => !caseIdsInSuite.has(r.id));

  return (
    <div className="page">
      <p><Link to="/test-suites">← Back to suites</Link></p>
      <div className="page-header">
        <h1>{suite.name}</h1>
        <div className="page-header-actions">
          <button
            className="btn-primary"
            onClick={handleNewRun}
            disabled={cases.length === 0 || startingRun}
            title={cases.length === 0 ? 'Add at least one case before starting a run' : undefined}
          >
            {startingRun ? 'Starting…' : 'New Run'}
          </button>
          <button className="btn-secondary" onClick={() => setShowEditForm(true)}>
            Edit suite
          </button>
        </div>
      </div>
      <p className="suite-meta">
        Feature: <strong className="feature-value">{suite.feature}</strong> · Status: <strong>{SUITE_STATUS_LABELS[suite.status]}</strong>
      </p>

      <h2>Cases</h2>
      {cases.length === 0 ? (
        <p>No cases in this suite yet. Add one below.</p>
      ) : (
        <table className="test-case-table">
          <thead>
            <tr>
              <th></th>
              <th>Title</th>
              <th>Severity</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c, index) => (
              <tr
                key={c.test_case_id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(index)}
              >
                <td className="drag-handle-cell" aria-hidden="true">⠿</td>
                <td>{c.title}</td>
                <td><SeverityBadge severity={c.severity} /></td>
                <td>{STATUS_LABELS[c.status]}</td>
                <td>
                  <div className="row-actions">
                    <button className="link-btn danger" onClick={() => handleRemoveCase(c.test_case_id)}>
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Add a case</h2>
      <label className="visually-hidden" htmlFor="add-case-search">Search test cases by title</label>
      <input
        id="add-case-search"
        type="text"
        placeholder="Search test cases by title…"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        className="search-input suite-add-case-search"
      />
      {searching && <p>Searching…</p>}
      {searchInput.trim() && !searching && (
        addableResults.length === 0 ? (
          <p>No matching test cases to add.</p>
        ) : (
          <ul className="suite-case-list">
            {addableResults.map((r) => (
              <li key={r.id} className="suite-case-row">
                <span className="suite-case-title">{r.title}</span>
                <SeverityBadge severity={r.severity} />
                <button className="link-btn" onClick={() => handleAddCase(r.id)}>
                  Add
                </button>
              </li>
            ))}
          </ul>
        )
      )}

      {showEditForm && (
        <SuiteFormModal
          initial={suite}
          onSave={handleEditSave}
          onClose={() => setShowEditForm(false)}
        />
      )}
    </div>
  );
}

export default SuiteDetailPage;
