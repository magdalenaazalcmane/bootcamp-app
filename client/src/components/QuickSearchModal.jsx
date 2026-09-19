import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModalA11y } from '../hooks/useModalA11y';
import { listTestCases } from '../api/testCases';
import { listBugs } from '../api/bugs';
import { listSuites } from '../api/suites';

const MAX_RESULTS_PER_GROUP = 5;
const DEBOUNCE_MS = 200;

const emptyResults = { testCases: [], bugs: [], suites: [] };

function QuickSearchModal({ onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(emptyResults);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const modalRef = useModalA11y(onClose);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setResults(emptyResults);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      const lowerTerm = term.toLowerCase();
      Promise.all([
        listTestCases({ search: term, sortBy: 'updated_at', order: 'desc' }),
        listBugs({ search: term, sortBy: 'updated_at', order: 'desc' }),
        listSuites(),
      ])
        .then(([tcData, bugData, suiteData]) => {
          setResults({
            testCases: tcData.items.slice(0, MAX_RESULTS_PER_GROUP),
            bugs: bugData.items.slice(0, MAX_RESULTS_PER_GROUP),
            suites: suiteData.items
              .filter(
                (s) => s.name.toLowerCase().includes(lowerTerm) || s.feature.toLowerCase().includes(lowerTerm)
              )
              .slice(0, MAX_RESULTS_PER_GROUP),
          });
        })
        .catch(() => setResults(emptyResults))
        .finally(() => setLoading(false));
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  function goToTestCases() {
    onClose();
    navigate('/test-cases');
  }

  function goToBug(id) {
    onClose();
    navigate(`/bugs/${id}`);
  }

  function goToSuite(id) {
    onClose();
    navigate(`/test-suites/${id}`);
  }

  function handleInputKeyDown(e) {
    if (e.key !== 'Enter') return;
    if (results.testCases.length) {
      goToTestCases();
    } else if (results.bugs.length) {
      goToBug(results.bugs[0].id);
    } else if (results.suites.length) {
      goToSuite(results.suites[0].id);
    }
  }

  const hasResults = results.testCases.length || results.bugs.length || results.suites.length;
  const term = query.trim();

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className="modal quick-search-modal"
        onMouseDown={(e) => e.stopPropagation()}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Quick search"
      >
        <input
          ref={inputRef}
          type="text"
          className="quick-search-input"
          aria-label="Search test cases, bugs, and suites"
          placeholder="Search test cases, bugs, and suites…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleInputKeyDown}
        />

        {!term && <p className="quick-search-hint">Start typing to search across the app.</p>}
        {term && loading && <p className="quick-search-hint">Searching…</p>}
        {term && !loading && !hasResults && <p className="quick-search-hint">No results for &quot;{term}&quot;.</p>}

        {results.testCases.length > 0 && (
          <div className="quick-search-group">
            <h3>Test cases</h3>
            <ul>
              {results.testCases.map((tc) => (
                <li key={`tc-${tc.id}`}>
                  <button type="button" className="link-btn" onClick={goToTestCases}>
                    {tc.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {results.bugs.length > 0 && (
          <div className="quick-search-group">
            <h3>Bugs</h3>
            <ul>
              {results.bugs.map((bug) => (
                <li key={`bug-${bug.id}`}>
                  <button type="button" className="link-btn" onClick={() => goToBug(bug.id)}>
                    {bug.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {results.suites.length > 0 && (
          <div className="quick-search-group">
            <h3>Test suites</h3>
            <ul>
              {results.suites.map((suite) => (
                <li key={`suite-${suite.id}`}>
                  <button type="button" className="link-btn" onClick={() => goToSuite(suite.id)}>
                    {suite.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuickSearchModal;
