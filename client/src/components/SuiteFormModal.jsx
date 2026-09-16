import { useState } from 'react';
import { SUITE_STATUSES, SUITE_STATUS_LABELS } from '../constants';
import { useModalA11y } from '../hooks/useModalA11y';

function SuiteFormModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(
    initial
      ? { name: initial.name, feature: initial.feature, status: initial.status }
      : { name: '', feature: '', status: 'draft' }
  );
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(initial);
  const modalRef = useModalA11y(onClose);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) return setError('Name is required.');
    if (!form.feature.trim()) return setError('Feature is required.');

    setSaving(true);
    try {
      await onSave({
        name: form.name.trim(),
        feature: form.feature.trim(),
        status: form.status,
      });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className="modal"
        onMouseDown={(e) => e.stopPropagation()}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="suite-modal-title"
      >
        <h2 id="suite-modal-title">{isEdit ? 'Edit test suite' : 'New test suite'}</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Name *
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Login regression suite"
            />
          </label>

          <label>
            Feature *
            <input
              type="text"
              value={form.feature}
              onChange={(e) => setForm({ ...form, feature: e.target.value })}
              placeholder="e.g. login"
            />
          </label>

          <label>
            Status *
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {SUITE_STATUSES.map((s) => (
                <option key={s} value={s}>{SUITE_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </label>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SuiteFormModal;
