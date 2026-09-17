import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getRun, updateRunResult } from '../api/testRuns';
import { createReport } from '../api/reports';
import SeverityBadge from '../components/SeverityBadge';
import { RUN_STATUS_LABELS, RESULT_LABELS } from '../constants';

function formatDate(iso) {
  return iso ? new Date(iso).toLocaleString() : '—';
}

function TestRunDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notesDraft, setNotesDraft] = useState({});
  const [savingCaseId, setSavingCaseId] = useState(null);
  const [rowErrors, setRowErrors] = useState({});
  const [generatingReport, setGeneratingReport] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getRun(id)
      .then((data) => {
        setRun(data);
        setNotesDraft(Object.fromEntries(data.results.map((r) => [r.test_case_id, r.notes || ''])));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSetResult(testCaseId, result) {
    setSavingCaseId(testCaseId);
    setRowErrors((prev) => ({ ...prev, [testCaseId]: null }));
    try {
      const data = await updateRunResult(id, testCaseId, result, notesDraft[testCaseId] || '');
      setRun(data);
    } catch (err) {
      setRowErrors((prev) => ({ ...prev, [testCaseId]: err.message }));
    } finally {
      setSavingCaseId(null);
    }
  }

  async function handleGenerateReport() {
    setGeneratingReport(true);
    try {
      const report = await createReport(id);
      navigate(`/reports/${report.id}`);
    } catch (err) {
      alert(err.message);
      setGeneratingReport(false);
    }
  }

  if (loading) return <div className="page">Loading…</div>;
  if (error) return <div className="page"><p className="form-error">{error}</p></div>;
  if (!run) return null;

  return (
    <div className="page">
      <p><Link to="/test-runs">← Back to test runs</Link></p>
      <div className="page-header">
        <h1>Run: {run.suite_name}</h1>
        <button className="btn-primary" onClick={handleGenerateReport} disabled={generatingReport}>
          {generatingReport ? 'Generating…' : 'Generate report'}
        </button>
      </div>
      <p className="suite-meta">
        Status: <strong>{RUN_STATUS_LABELS[run.status]}</strong> · Passed: <strong>{run.pass_count}</strong> · Failed: <strong>{run.fail_count}</strong> · Skipped: <strong>{run.skip_count}</strong>
      </p>
      <p className="suite-meta">
        Started: {formatDate(run.start_time)} · Ended: {formatDate(run.end_time)}
      </p>

      <h2>Cases</h2>
      <ul className="suite-case-list">
        {run.results.map((r) => (
          <li key={r.test_case_id} className="run-result-row">
            <div className="run-result-header">
              <span className="suite-case-title">{r.title}</span>
              <SeverityBadge severity={r.severity} />
              <span className="run-result-status">
                {r.result ? RESULT_LABELS[r.result] : 'Pending'}
                {r.alert_sent_at && ' · Alert sent'}
              </span>
            </div>

            <label className="visually-hidden" htmlFor={`notes-${r.test_case_id}`}>
              Notes for {r.title}
            </label>
            <textarea
              id={`notes-${r.test_case_id}`}
              rows={2}
              value={notesDraft[r.test_case_id] || ''}
              onChange={(e) => setNotesDraft((prev) => ({ ...prev, [r.test_case_id]: e.target.value }))}
              placeholder="Notes (optional, included in failure alerts)"
            />

            {rowErrors[r.test_case_id] && <p className="form-error">{rowErrors[r.test_case_id]}</p>}

            <div className="run-result-actions">
              <button
                className="btn-secondary"
                disabled={savingCaseId === r.test_case_id}
                onClick={() => handleSetResult(r.test_case_id, 'passed')}
              >
                Pass
              </button>
              <button
                className="btn-secondary"
                disabled={savingCaseId === r.test_case_id}
                onClick={() => handleSetResult(r.test_case_id, 'failed')}
              >
                Fail
              </button>
              <button
                className="btn-secondary"
                disabled={savingCaseId === r.test_case_id}
                onClick={() => handleSetResult(r.test_case_id, 'skipped')}
              >
                Skip
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TestRunDetailPage;
