import { Router } from 'express';
import db from '../db.js';

const router = Router();

const THEMES = ['light', 'dark', 'system'];
const SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial'];
const PAGE_SIZES = [10, 20, 50, 100];

function validTimezone(tz) {
  try {
    return Intl.supportedValuesOf('timeZone').includes(tz);
  } catch {
    // Intl.supportedValuesOf unsupported on this runtime — fall back to
    // just confirming the string is a timezone Intl itself accepts.
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }
}

function ok(res, data) {
  res.json({ success: true, data, error: null });
}

function fail(res, status, error) {
  res.status(status).json({ success: false, data: null, error });
}

function serializeSettings(row) {
  return {
    theme: row.theme,
    default_severity_for_new_bugs: row.default_severity_for_new_bugs,
    default_page_size: row.default_page_size,
    timezone: row.timezone,
    auto_generate_report_after_run: Boolean(row.auto_generate_report_after_run),
    updated_at: row.updated_at,
  };
}

function getSettingsRow() {
  return db.prepare('SELECT * FROM user_preferences WHERE id = 1').get();
}

function handleGetSettings(req, res) {
  ok(res, serializeSettings(getSettingsRow()));
}

function handleUpdateSettings(req, res) {
  const body = req.body || {};
  const errors = [];

  if (body.theme !== undefined && !THEMES.includes(body.theme)) {
    errors.push(`theme must be one of ${THEMES.join(', ')}`);
  }
  if (body.default_severity_for_new_bugs !== undefined && !SEVERITIES.includes(body.default_severity_for_new_bugs)) {
    errors.push(`default_severity_for_new_bugs must be one of ${SEVERITIES.join(', ')}`);
  }
  if (body.default_page_size !== undefined && !PAGE_SIZES.includes(Number(body.default_page_size))) {
    errors.push(`default_page_size must be one of ${PAGE_SIZES.join(', ')}`);
  }
  if (body.timezone !== undefined && body.timezone !== null && !validTimezone(body.timezone)) {
    errors.push('timezone must be a valid IANA time zone name');
  }
  if (body.auto_generate_report_after_run !== undefined && typeof body.auto_generate_report_after_run !== 'boolean') {
    errors.push('auto_generate_report_after_run must be a boolean');
  }

  if (errors.length) return fail(res, 400, errors.join('; '));

  const existing = getSettingsRow();
  const merged = {
    theme: body.theme ?? existing.theme,
    default_severity_for_new_bugs: body.default_severity_for_new_bugs ?? existing.default_severity_for_new_bugs,
    default_page_size: body.default_page_size !== undefined ? Number(body.default_page_size) : existing.default_page_size,
    timezone: body.timezone !== undefined ? body.timezone : existing.timezone,
    auto_generate_report_after_run:
      body.auto_generate_report_after_run !== undefined
        ? (body.auto_generate_report_after_run ? 1 : 0)
        : existing.auto_generate_report_after_run,
    updated_at: new Date().toISOString(),
  };

  db.prepare(`
    UPDATE user_preferences
    SET theme = @theme, default_severity_for_new_bugs = @default_severity_for_new_bugs,
        default_page_size = @default_page_size, timezone = @timezone,
        auto_generate_report_after_run = @auto_generate_report_after_run, updated_at = @updated_at
    WHERE id = 1
  `).run(merged);

  ok(res, serializeSettings(getSettingsRow()));
}

router.get('/', handleGetSettings);
router.put('/', handleUpdateSettings);

export default router;
