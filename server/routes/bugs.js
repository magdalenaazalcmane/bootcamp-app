import { Router } from 'express';
import db from '../db.js';

const router = Router();

const SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const STATUSES = ['open', 'in-progress', 'resolved', 'closed', 'reopened'];

const TRANSITIONS = {
  open: ['in-progress', 'closed'],
  'in-progress': ['resolved', 'closed'],
  resolved: ['closed', 'reopened'],
  closed: ['reopened'],
  reopened: ['in-progress', 'closed'],
};

function ok(res, data) {
  res.json({ success: true, data, error: null });
}

function fail(res, status, error) {
  res.status(status).json({ success: false, data: null, error });
}

function serializeBug(row) {
  return { ...row, steps_to_reproduce: JSON.parse(row.steps_to_reproduce) };
}

function getBugRow(id) {
  return db.prepare('SELECT * FROM bugs WHERE id = ?').get(id);
}

function getBugActivity(bugId) {
  return db
    .prepare('SELECT * FROM bug_activity WHERE bug_id = ? ORDER BY timestamp DESC, id DESC')
    .all(bugId);
}

// Distinguishes "missing", "wrong type", and "blank" so the error message
// actually matches the problem — a number or object isn't "empty", it's the
// wrong type — and validates optional text fields too, so a non-string value
// (e.g. an object) never reaches the database and throws a raw driver error.
// `null` is accepted for an optional field: it means "clear this field".
//
// mustBePresent and mustBeNonBlank are deliberately separate: on a partial
// update (PUT), a conceptually-required field like title is allowed to be
// OMITTED (mustBePresent: false), but if it IS included, it must still be
// non-blank (mustBeNonBlank: true) — omitting it and blanking it are not
// the same thing, and conflating them into one flag lets a blank slip through.
function validateTextField(errors, field, value, { mustBePresent, mustBeNonBlank }) {
  if (value === undefined) {
    if (mustBePresent) errors.push(`${field} is required`);
    return;
  }
  if (value === null) {
    if (mustBeNonBlank) errors.push(`${field} cannot be empty`);
    return;
  }
  if (typeof value !== 'string') {
    errors.push(`${field} must be text`);
    return;
  }
  if (mustBeNonBlank && !value.trim()) {
    errors.push(`${field} cannot be empty`);
  }
}

// Unlike a naive "only check required-ness on create" approach, this also
// rejects a blank/wrong-type value for a field on a partial update (PUT) —
// a field that IS provided must always be valid, whether creating or updating.
function validateBody(body, { partial = false } = {}) {
  const errors = [];

  validateTextField(errors, 'title', body.title, { mustBePresent: !partial, mustBeNonBlank: true });
  validateTextField(errors, 'expected', body.expected, { mustBePresent: !partial, mustBeNonBlank: true });
  validateTextField(errors, 'actual', body.actual, { mustBePresent: !partial, mustBeNonBlank: true });
  validateTextField(errors, 'description', body.description, { mustBePresent: false, mustBeNonBlank: false });
  validateTextField(errors, 'environment', body.environment, { mustBePresent: false, mustBeNonBlank: false });

  if (body.steps_to_reproduce !== undefined) {
    if (
      !Array.isArray(body.steps_to_reproduce) ||
      body.steps_to_reproduce.length === 0 ||
      body.steps_to_reproduce.some((s) => typeof s !== 'string' || !s.trim())
    ) {
      errors.push('steps_to_reproduce must be a non-empty array of non-empty strings');
    }
  } else if (!partial) {
    errors.push('steps_to_reproduce is required');
  }

  if (body.severity !== undefined) {
    if (!SEVERITIES.includes(body.severity)) errors.push(`severity must be one of ${SEVERITIES.join(', ')}`);
  } else if (!partial) {
    errors.push('severity is required');
  }

  if (body.priority !== undefined) {
    if (!PRIORITIES.includes(body.priority)) errors.push(`priority must be one of ${PRIORITIES.join(', ')}`);
  } else if (!partial) {
    errors.push('priority is required');
  }

  return errors;
}

// Escapes literal %, _, and \ so a search term containing them matches that
// literal text instead of being interpreted as a SQL LIKE wildcard.
function escapeLikePattern(value) {
  return value.replace(/[\\%_]/g, '\\$&');
}

function handleListBugs(req, res) {
  const { search = '', status = '', severity = '', priority = '' } = req.query;
  const where = [];
  const params = {};

  if (search) {
    where.push("(title LIKE @search ESCAPE '\\' OR description LIKE @search ESCAPE '\\')");
    params.search = `%${escapeLikePattern(search)}%`;
  }
  if (status && STATUSES.includes(status)) {
    where.push('status = @status');
    params.status = status;
  }
  if (severity && SEVERITIES.includes(severity)) {
    where.push('severity = @severity');
    params.severity = severity;
  }
  if (priority && PRIORITIES.includes(priority)) {
    where.push('priority = @priority');
    params.priority = priority;
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const { sortBy = 'updated_at', order = 'desc' } = req.query;
  const direction = order === 'asc' ? 'ASC' : 'DESC';
  let orderClause;
  if (sortBy === 'severity') {
    orderClause = `ORDER BY CASE severity WHEN 'Critical' THEN 0 WHEN 'Major' THEN 1 WHEN 'Minor' THEN 2 WHEN 'Trivial' THEN 3 END ${direction}`;
  } else if (sortBy === 'priority') {
    orderClause = `ORDER BY CASE priority WHEN 'Urgent' THEN 0 WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 3 END ${direction}`;
  } else if (sortBy === 'title') {
    orderClause = `ORDER BY title COLLATE NOCASE ${direction}`;
  } else if (sortBy === 'status') {
    orderClause = `ORDER BY status ${direction}`;
  } else {
    orderClause = `ORDER BY updated_at ${direction}`;
  }

  const rows = db.prepare(`SELECT * FROM bugs ${whereClause} ${orderClause}`).all(params);
  ok(res, { items: rows.map(serializeBug) });
}

function handleGetBug(req, res) {
  const bug = getBugRow(req.params.id);
  if (!bug) return fail(res, 404, 'Bug not found');
  ok(res, { ...serializeBug(bug), activity: getBugActivity(bug.id) });
}

function handleCreateBug(req, res) {
  const body = req.body || {};
  const errors = validateBody(body);
  if (errors.length) return fail(res, 400, errors.join('; '));

  const now = new Date().toISOString();
  const result = db
    .prepare(`
      INSERT INTO bugs (title, description, steps_to_reproduce, expected, actual, environment, severity, priority, status, created_at, updated_at)
      VALUES (@title, @description, @steps_to_reproduce, @expected, @actual, @environment, @severity, @priority, 'open', @created_at, @updated_at)
    `)
    .run({
      title: body.title,
      description: body.description || null,
      steps_to_reproduce: JSON.stringify(body.steps_to_reproduce),
      expected: body.expected,
      actual: body.actual,
      environment: body.environment || null,
      severity: body.severity,
      priority: body.priority,
      created_at: now,
      updated_at: now,
    });

  const bug = getBugRow(result.lastInsertRowid);
  ok(res, { ...serializeBug(bug), activity: [] });
}

function handleUpdateBug(req, res) {
  const existing = getBugRow(req.params.id);
  if (!existing) return fail(res, 404, 'Bug not found');

  const body = req.body || {};
  if (body.status !== undefined) {
    return fail(res, 400, 'status can only be changed via PATCH /api/bugs/:id/status');
  }

  const errors = validateBody(body, { partial: true });
  if (errors.length) return fail(res, 400, errors.join('; '));

  const merged = {
    title: body.title !== undefined ? body.title : existing.title,
    description: body.description !== undefined ? body.description : existing.description,
    steps_to_reproduce:
      body.steps_to_reproduce !== undefined ? JSON.stringify(body.steps_to_reproduce) : existing.steps_to_reproduce,
    expected: body.expected !== undefined ? body.expected : existing.expected,
    actual: body.actual !== undefined ? body.actual : existing.actual,
    environment: body.environment !== undefined ? body.environment : existing.environment,
    severity: body.severity ?? existing.severity,
    priority: body.priority ?? existing.priority,
    updated_at: new Date().toISOString(),
  };

  db.prepare(`
    UPDATE bugs
    SET title = @title, description = @description, steps_to_reproduce = @steps_to_reproduce,
        expected = @expected, actual = @actual, environment = @environment,
        severity = @severity, priority = @priority, updated_at = @updated_at
    WHERE id = @id
  `).run({ ...merged, id: req.params.id });

  const bug = getBugRow(req.params.id);
  ok(res, { ...serializeBug(bug), activity: getBugActivity(bug.id) });
}

function handleDeleteBug(req, res) {
  const existing = getBugRow(req.params.id);
  if (!existing) return fail(res, 404, 'Bug not found');

  db.prepare('DELETE FROM bugs WHERE id = ?').run(req.params.id);
  ok(res, { id: Number(req.params.id) });
}

function handleChangeBugStatus(req, res) {
  const existing = getBugRow(req.params.id);
  if (!existing) return fail(res, 404, 'Bug not found');

  const newStatus = req.body?.status;
  if (!newStatus || !STATUSES.includes(newStatus)) {
    return fail(res, 400, `status must be one of ${STATUSES.join(', ')}`);
  }

  const allowed = TRANSITIONS[existing.status] || [];
  if (!allowed.includes(newStatus)) {
    return fail(res, 400, `Cannot change status from "${existing.status}" to "${newStatus}". Allowed: ${allowed.join(', ') || 'none'}`);
  }

  const now = new Date().toISOString();
  const message = req.body?.message || null;

  const tx = db.transaction(() => {
    db.prepare('UPDATE bugs SET status = ?, updated_at = ? WHERE id = ?').run(newStatus, now, existing.id);
    db.prepare(`
      INSERT INTO bug_activity (bug_id, action, old_value, new_value, message, timestamp)
      VALUES (?, 'status_change', ?, ?, ?, ?)
    `).run(existing.id, existing.status, newStatus, message, now);
  });
  tx();

  const bug = getBugRow(existing.id);
  ok(res, { ...serializeBug(bug), activity: getBugActivity(bug.id) });
}

function handleAddBugComment(req, res) {
  const existing = getBugRow(req.params.id);
  if (!existing) return fail(res, 404, 'Bug not found');

  const message = req.body?.message?.trim();
  if (!message) return fail(res, 400, 'message is required');

  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO bug_activity (bug_id, action, old_value, new_value, message, timestamp)
    VALUES (?, 'comment', NULL, NULL, ?, ?)
  `).run(existing.id, message, now);

  const bug = getBugRow(existing.id);
  ok(res, { ...serializeBug(bug), activity: getBugActivity(bug.id) });
}

router.get('/', handleListBugs);
router.get('/:id', handleGetBug);
router.post('/', handleCreateBug);
router.put('/:id', handleUpdateBug);
router.delete('/:id', handleDeleteBug);
router.patch('/:id/status', handleChangeBugStatus);
router.post('/:id/comments', handleAddBugComment);

export default router;
