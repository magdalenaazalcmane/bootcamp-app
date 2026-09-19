import { useState } from 'react';
import { Link } from 'react-router-dom';
import { previewImport, commitImport } from '../api/testCases';
import SeverityBadge from '../components/SeverityBadge';
import { STATUS_LABELS } from '../constants';

function ImportTestCasesPage() {
  const [fileName, setFileName] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [preview, setPreview] = useState(null);

  const [committing, setCommitting] = useState(false);
  const [commitError, setCommitError] = useState(null);
  const [commitResult, setCommitResult] = useState(null);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setPreview(null);
    setPreviewError(null);
    setCommitResult(null);
    setCommitError(null);
    setPreviewing(true);

    try {
      const text = await file.text();
      const data = await previewImport(text);
      setPreview(data);
    } catch (err) {
      setPreviewError(err.message);
    } finally {
      setPreviewing(false);
    }
  }

  async function handleCommit() {
    if (!preview || preview.valid.length === 0) return;
    setCommitting(true);
    setCommitError(null);
    try {
      const result = await commitImport(preview.valid);
      setCommitResult(result);
    } catch (err) {
      setCommitError(err.message);
    } finally {
      setCommitting(false);
    }
  }

  return (
    <div className="page">
      <p><Link to="/test-cases">← Back to test cases</Link></p>
      <div className="page-header">
        <h1>Import test cases from CSV</h1>
      </div>

      <p className="suite-meta">
        The CSV must have <strong>title</strong>, <strong>severity</strong>, and <strong>steps</strong> columns at minimum
        (also recognized: <strong>expected_result</strong>, <strong>preconditions</strong>, <strong>status</strong>).
        For a case with multiple steps, put one step per line within that cell (e.g. Alt+Enter in Excel/Sheets).
      </p>

      <label htmlFor="csv-file"><strong>CSV file</strong></label>
      <br />
      <input id="csv-file" type="file" accept=".csv,text/csv" onChange={handleFileChange} />
      {fileName && <span className="chart-tooltip-muted"> {fileName}</span>}

      {previewing && <p>Reading and validating {fileName}…</p>}
      {previewError && <p className="form-error">{previewError}</p>}

      {preview && !commitResult && (
        <>
          <p className="suite-meta" style={{ marginTop: '1rem' }}>
            <strong>{preview.valid_count}</strong> of <strong>{preview.total_rows}</strong> row(s) are valid and will be
            imported. <strong>{preview.invalid_count}</strong> row(s) have errors and will be skipped.
          </p>

          {preview.valid.length > 0 && (
            <button className="btn-primary" onClick={handleCommit} disabled={committing}>
              {committing ? 'Importing…' : `Import ${preview.valid.length} valid row(s)`}
            </button>
          )}
          {commitError && <p className="form-error">{commitError}</p>}

          <h2 style={{ marginTop: '1.5rem' }}>Preview</h2>
          <table className="test-case-table">
            <thead>
              <tr>
                <th>Row</th>
                <th>Title</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Steps</th>
                <th>Issues</th>
              </tr>
            </thead>
            <tbody>
              {[...preview.valid.map((r) => ({ ...r, ok: true })), ...preview.invalid.map((r) => ({ ...r, ok: false }))]
                .sort((a, b) => a.row_number - b.row_number)
                .map((row) => (
                  <tr key={row.row_number} style={row.ok ? undefined : { background: '#fde2e1' }}>
                    <td>{row.row_number}</td>
                    <td>{row.title}</td>
                    <td>{row.ok ? <SeverityBadge severity={row.severity} /> : '—'}</td>
                    <td>{row.ok ? STATUS_LABELS[row.status] : '—'}</td>
                    <td>{row.ok ? row.steps.join(' | ') : '—'}</td>
                    <td>
                      {row.ok ? (
                        <span style={{ color: '#1c7c3c' }}>Valid</span>
                      ) : (
                        <span className="form-error">{row.errors.join('; ')}</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </>
      )}

      {commitResult && (
        <div style={{ marginTop: '1rem' }}>
          <p className="suite-meta">
            Imported <strong>{commitResult.imported_count}</strong> test case(s). Skipped{' '}
            <strong>{commitResult.skipped_count}</strong> row(s).
          </p>

          {commitResult.imported.length > 0 && (
            <>
              <h2>Imported</h2>
              <ul className="activity-list">
                {commitResult.imported.map((r) => (
                  <li key={r.id} className="activity-entry">
                    Row {r.row_number}: <Link to={`/test-cases`}>{r.title}</Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          {commitResult.skipped.length > 0 && (
            <>
              <h2>Skipped</h2>
              <ul className="activity-list">
                {commitResult.skipped.map((r) => (
                  <li key={r.row_number} className="activity-entry">
                    Row {r.row_number}: {r.title} — <span className="form-error">{r.errors.join('; ')}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          <p><Link to="/test-cases">View test cases →</Link></p>
        </div>
      )}
    </div>
  );
}

export default ImportTestCasesPage;
