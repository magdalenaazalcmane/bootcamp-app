import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBug, updateBug, changeBugStatus, addBugComment } from '../api/bugs';
import SeverityBadge from '../components/SeverityBadge';
import BugFormModal from '../components/BugFormModal';
import { BUG_STATUS_LABELS, BUG_STATUS_TRANSITIONS } from '../constants';

function formatDate(iso) {
  return new Date(iso).toLocaleString();
}

function ActivityEntry({ entry }) {
  if (entry.action === 'status_change') {
    return (
      <li className="activity-entry">
        <div className="activity-meta">
          <strong>{BUG_STATUS_LABELS[entry.old_value]} → {BUG_STATUS_LABELS[entry.new_value]}</strong>
          <span className="activity-timestamp">{formatDate(entry.timestamp)}</span>
        </div>
        {entry.message && <p className="activity-message">{entry.message}</p>}
      </li>
    );
  }
  return (
    <li className="activity-entry">
      <div className="activity-meta">
        <strong>Comment</strong>
        <span className="activity-timestamp">{formatDate(entry.timestamp)}</span>
      </div>
      <p className="activity-message">{entry.message}</p>
    </li>
  );
}

function BugDetailPage() {
  const { id } = useParams();
  const [bug, setBug] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showEditForm, setShowEditForm] = useState(false);

  const [nextStatus, setNextStatus] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [changingStatus, setChangingStatus] = useState(false);
  const [statusError, setStatusError] = useState(null);

  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [commentError, setCommentError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getBug(id)
      .then((data) => {
        setBug(data);
        setNextStatus('');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleEditSave(payload) {
    const data = await updateBug(id, payload);
    setBug(data);
    setShowEditForm(false);
  }

  async function handleStatusChange(e) {
    e.preventDefault();
    if (!nextStatus) return;
    setStatusError(null);
    setChangingStatus(true);
    try {
      const data = await changeBugStatus(id, nextStatus, statusMessage.trim() || undefined);
      setBug(data);
      setNextStatus('');
      setStatusMessage('');
    } catch (err) {
      setStatusError(err.message);
    } finally {
      setChangingStatus(false);
    }
  }

  async function handleAddComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommentError(null);
    setPostingComment(true);
    try {
      const data = await addBugComment(id, commentText.trim());
      setBug(data);
      setCommentText('');
    } catch (err) {
      setCommentError(err.message);
    } finally {
      setPostingComment(false);
    }
  }

  if (loading) return <div className="page">Loading…</div>;
  if (error) return <div className="page"><p className="form-error">{error}</p></div>;
  if (!bug) return null;

  const allowedNextStatuses = BUG_STATUS_TRANSITIONS[bug.status] || [];

  return (
    <div className="page">
      <p><Link to="/bugs">← Back to bugs</Link></p>
      <div className="page-header">
        <h1>{bug.title}</h1>
        <button className="btn-secondary" onClick={() => setShowEditForm(true)}>
          Edit bug
        </button>
      </div>

      <p className="suite-meta">
        <SeverityBadge severity={bug.severity} /> · Priority: <strong>{bug.priority}</strong> · Status: <strong>{BUG_STATUS_LABELS[bug.status]}</strong>
      </p>

      {bug.description && (
        <>
          <h2>Description</h2>
          <p>{bug.description}</p>
        </>
      )}

      <h2>Steps to reproduce</h2>
      <ol>
        {bug.steps_to_reproduce.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>

      <h2>Expected</h2>
      <p>{bug.expected}</p>

      <h2>Actual</h2>
      <p>{bug.actual}</p>

      {bug.environment && (
        <>
          <h2>Environment</h2>
          <p>{bug.environment}</p>
        </>
      )}

      <h2>Change status</h2>
      {allowedNextStatuses.length === 0 ? (
        <p>No further status changes are possible from "{BUG_STATUS_LABELS[bug.status]}".</p>
      ) : (
        <form onSubmit={handleStatusChange} className="status-change-form">
          <label>
            New status
            <select value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
              <option value="">Select a status…</option>
              {allowedNextStatuses.map((s) => (
                <option key={s} value={s}>{BUG_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </label>
          <label>
            Note (optional)
            <input
              type="text"
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              placeholder="e.g. Verified fix locally"
            />
          </label>
          {statusError && <p className="form-error">{statusError}</p>}
          <button type="submit" className="btn-primary" disabled={!nextStatus || changingStatus}>
            {changingStatus ? 'Updating…' : 'Change status'}
          </button>
        </form>
      )}

      <h2>Activity</h2>
      <form onSubmit={handleAddComment} className="comment-form">
        <label className="visually-hidden" htmlFor="bug-comment">Add a comment</label>
        <textarea
          id="bug-comment"
          rows={2}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Add a comment…"
        />
        {commentError && <p className="form-error">{commentError}</p>}
        <button type="submit" className="btn-secondary" disabled={!commentText.trim() || postingComment}>
          {postingComment ? 'Posting…' : 'Add comment'}
        </button>
      </form>

      {bug.activity.length === 0 ? (
        <p>No activity yet.</p>
      ) : (
        <ul className="activity-list">
          {bug.activity.map((entry) => (
            <ActivityEntry key={entry.id} entry={entry} />
          ))}
        </ul>
      )}

      {showEditForm && (
        <BugFormModal
          initial={bug}
          onSave={handleEditSave}
          onClose={() => setShowEditForm(false)}
        />
      )}
    </div>
  );
}

export default BugDetailPage;
