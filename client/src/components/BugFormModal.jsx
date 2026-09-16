import { useState } from 'react';
import { SEVERITIES, BUG_PRIORITIES } from '../constants';
import { useModalA11y } from '../hooks/useModalA11y';

function emptyForm() {
  return {
    title: '',
    description: '',
    steps_to_reproduce: [''],
    expected: '',
    actual: '',
    environment: '',
    severity: 'Major',
    priority: 'Medium',
  };
}

function BugFormModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(
    initial
      ? {
          title: initial.title,
          description: initial.description || '',
          steps_to_reproduce: initial.steps_to_reproduce.length ? initial.steps_to_reproduce : [''],
          expected: initial.expected,
          actual: initial.actual,
          environment: initial.environment || '',
          severity: initial.severity,
          priority: initial.priority,
        }
      : emptyForm()
  );
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(initial);
  const modalRef = useModalA11y(onClose);

  function updateStep(index, value) {
    const steps = [...form.steps_to_reproduce];
    steps[index] = value;
    setForm({ ...form, steps_to_reproduce: steps });
  }

  function addStep() {
    setForm({ ...form, steps_to_reproduce: [...form.steps_to_reproduce, ''] });
  }

  function removeStep(index) {
    const steps = form.steps_to_reproduce.filter((_, i) => i !== index);
    setForm({ ...form, steps_to_reproduce: steps.length ? steps : [''] });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const cleanedSteps = form.steps_to_reproduce.map((s) => s.trim()).filter(Boolean);
    if (!form.title.trim()) return setError('Title is required.');
    if (!cleanedSteps.length) return setError('At least one step to reproduce is required.');
    if (!form.expected.trim()) return setError('Expected result is required.');
    if (!form.actual.trim()) return setError('Actual result is required.');

    setSaving(true);
    try {
      await onSave({
        title: form.title.trim(),
        description: form.description.trim() || null,
        steps_to_reproduce: cleanedSteps,
        expected: form.expected.trim(),
        actual: form.actual.trim(),
        environment: form.environment.trim() || null,
        severity: form.severity,
        priority: form.priority,
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
        aria-labelledby="bug-modal-title"
      >
        <h2 id="bug-modal-title">{isEdit ? 'Edit bug' : 'New bug'}</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Title *
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Login button unresponsive on mobile Safari"
            />
          </label>

          <label>
            Description
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>

          <div className="steps-field">
            <span>Steps to reproduce *</span>
            {form.steps_to_reproduce.map((step, i) => (
              <div className="step-row" key={i}>
                <span className="step-number">{i + 1}.</span>
                <input
                  type="text"
                  value={step}
                  onChange={(e) => updateStep(i, e.target.value)}
                  aria-label={`Step ${i + 1}`}
                />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => removeStep(i)}
                  aria-label={`Remove step ${i + 1}`}
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
            Expected *
            <textarea
              rows={2}
              value={form.expected}
              onChange={(e) => setForm({ ...form, expected: e.target.value })}
            />
          </label>

          <label>
            Actual *
            <textarea
              rows={2}
              value={form.actual}
              onChange={(e) => setForm({ ...form, actual: e.target.value })}
            />
          </label>

          <label>
            Environment
            <input
              type="text"
              value={form.environment}
              onChange={(e) => setForm({ ...form, environment: e.target.value })}
              placeholder="e.g. Chrome 128, macOS"
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
              Priority *
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                {BUG_PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
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

export default BugFormModal;
