import { useEffect, useState, useRef } from 'react';
import { updateSettings } from '../api/settings';
import { useSettings } from '../context/SettingsContext';
import { SEVERITIES } from '../constants';

const PAGE_SIZES = [10, 20, 50, 100];

function getBrowserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

function getTimezoneOptions() {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    return [getBrowserTimezone()];
  }
}

function SettingsPage() {
  const { settings, loading, error, refresh } = useSettings();
  const [form, setForm] = useState(null);
  const [fieldError, setFieldError] = useState(null);
  const [savedVisible, setSavedVisible] = useState(false);
  const savedTimeoutRef = useRef(null);

  useEffect(() => {
    if (settings) {
      setForm({
        theme: settings.theme,
        default_severity_for_new_bugs: settings.default_severity_for_new_bugs,
        default_page_size: settings.default_page_size,
        timezone: settings.timezone || getBrowserTimezone(),
        auto_generate_report_after_run: settings.auto_generate_report_after_run,
      });
    }
  }, [settings]);

  useEffect(() => () => clearTimeout(savedTimeoutRef.current), []);

  // Applies a single field immediately on change — no separate Save step.
  // Updates the control right away (optimistic), then persists it; on
  // success a brief "Saved" indicator appears, and on failure the form
  // re-syncs to whatever's actually stored server-side.
  async function applyChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldError(null);
    try {
      await updateSettings({ [field]: value });
      await refresh();
      setSavedVisible(true);
      clearTimeout(savedTimeoutRef.current);
      savedTimeoutRef.current = setTimeout(() => setSavedVisible(false), 2000);
    } catch (err) {
      setFieldError(err.message);
      await refresh();
    }
  }

  if (loading || !form) return <div className="page">Loading…</div>;
  if (error) return <div className="page"><p className="form-error">{error}</p></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Settings</h1>
        <span className={`settings-saved${savedVisible ? ' visible' : ''}`}>Saved</span>
      </div>

      {fieldError && <p className="form-error">{fieldError}</p>}

      <form>
        <h2>Appearance</h2>
        <label>
          Theme
          <select value={form.theme} onChange={(e) => applyChange('theme', e.target.value)}>
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>

        <h2>Bugs</h2>
        <label>
          Default severity for new bugs
          <select
            value={form.default_severity_for_new_bugs}
            onChange={(e) => applyChange('default_severity_for_new_bugs', e.target.value)}
          >
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        <h2>Test cases</h2>
        <label>
          Default page size
          <select
            value={form.default_page_size}
            onChange={(e) => applyChange('default_page_size', Number(e.target.value))}
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        <h2>General</h2>
        <label>
          Timezone
          <select value={form.timezone} onChange={(e) => applyChange('timezone', e.target.value)}>
            {getTimezoneOptions().map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </label>

        <label style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={form.auto_generate_report_after_run}
            onChange={(e) => applyChange('auto_generate_report_after_run', e.target.checked)}
          />
          Automatically generate a report after a test run finishes
        </label>
      </form>
    </div>
  );
}

export default SettingsPage;
