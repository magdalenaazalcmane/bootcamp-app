import { useState } from 'react';
import { SEVERITIES, STATUSES, STATUS_LABELS } from '../constants';
import { useModalA11y } from '../hooks/useModalA11y';

function emptyForm() {
  return {
    title: '',
    preconditions: '',
    steps: [''],
    expected_result: '',
    severity: 'Major',
    status: 'draft',
  };
}

function TestCaseFormModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(
    initial
      ? { ...initial, steps: initial.steps.length ? initial.steps : [''] }
      : emptyForm()
  );
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(initial);
  const modalRef = useModalA11y(onClose);

  function updateStep(index, value) {
    const steps = [...form.steps];
    steps[index] = value;
    setForm({ ...form, steps });
  }

  function addStep() {
    setForm({ ...form, steps: [...form.steps, ''] });
  }

  function removeStep(index) {
    const steps = form.steps.filter((_, i) => i !== index);
    setForm({ ...form, steps: steps.length ? steps : [''] });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const cleanedSteps = form.steps.map((s) => s.trim()).filter(Boolean);
    if (!form.title.trim()) return setError('Title is required.');
    if (!cleanedSteps.length) return setError('At least one step is required.');
    if (!form.expected_result.trim()) return setError('Expected result is required.');

    setSaving(true);
    try {
      await onSave({
        title: form.title.trim(),
        preconditions: form.preconditions.trim() || null,
        steps: cleanedSteps,
        expected_result: form.expected_result.trim(),
        severity: form.severity,
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
        aria-labelledby="test-case-modal-title"
      >
        <h2 id="test-case-modal-title">{isEdit ? 'Edit test case' : 'New test case'}</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Title *
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder='e.g. User can log in with valid credentials [Login]'
            />
          </label>

          <label>
            Preconditions
            <textarea
              rows={2}
              value={form.preconditions}
              onChange={(e) => setForm({ ...form, preconditions: e.target.value })}
            />
          </label>

          <div className="steps-field">
            <span>Steps *</span>
            {form.steps.map((step, i) => (
              <div className="step-row" key={i}>
                <span className="step-number">{i + 1}.</span>
                <input
                  type="text"
                  value={step}
                  onChange={(e) => updateStep(i, e.target.value)}
                />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => removeStep(i)}
                  aria-label="Remove step"
                >
                  ✕
                </button>
              </div>
            ))}
            <button type="button" className="link-btn" onClick={addStep}>
              + Add step
            </button>
          </div>

          <label>
            Expected result *
            <textarea
              rows={2}
              value={form.expected_result}
              onChange={(e) => setForm({ ...form, expected_result: e.target.value })}
            />
          </label>

          <div className="form-row">
            <label>
              Severity *
              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>

            <label>
              Status *
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </label>
          </div>

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

export default TestCaseFormModal;
