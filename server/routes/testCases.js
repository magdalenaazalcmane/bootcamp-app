import { Router } from 'express';
import db from '../db.js';

const router = Router();

const SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial'];
const STATUSES = ['draft', 'ready', 'passed', 'failed', 'skipped'];
const SEVERITY_RANK = { Critical: 0, Major: 1, Minor: 2, Trivial: 3 };

function ok(res, data) {
  res.json({ success: true, data, error: null });
}

function fail(res, status, error) {
  res.status(status).json({ success: false, data: null, error });
}

function serializeRow(row) {
  return { ...row, steps: JSON.parse(row.steps) };
}

function validateBody(body, { partial = false } = {}) {
  const errors = [];
  const fields = ['title', 'steps', 'expected_result', 'severity', 'status'];

  for (const field of fields) {
    if (!partial && (body[field] === undefined || body[field] === null || body[field] === '')) {
      errors.push(`${field} is required`);
    }
  }

  if (body.steps !== undefined) {
    if (!Array.isArray(body.steps) || body.steps.length === 0 || body.steps.some((s) => typeof s !== 'string' || !s.trim())) {
      errors.push('steps must be a non-empty array of non-empty strings');
    }
  }

  if (body.severity !== undefined && !SEVERITIES.includes(body.severity)) {
    errors.push(`severity must be one of ${SEVERITIES.join(', ')}`);
  }

  if (body.status !== undefined && !STATUSES.includes(body.status)) {
    errors.push(`status must be one of ${STATUSES.join(', ')}`);
  }

  return errors;
}

function handleListTestCases(req, res) {
  const { search = '', status = '', sortBy = 'updated_at', order = 'desc' } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = 20;

  const where = [];
  const params = {};

  if (search) {
    where.push('title LIKE @search');
    params.search = `%${search}%`;
  }

  if (status && STATUSES.includes(status)) {
    where.push('status = @status');
    params.status = status;
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  let orderClause;
  const direction = order === 'asc' ? 'ASC' : 'DESC';
  if (sortBy === 'severity') {
    orderClause = `ORDER BY CASE severity
      WHEN 'Critical' THEN 0
      WHEN 'Major' THEN 1
      WHEN 'Minor' THEN 2
      WHEN 'Trivial' THEN 3
    END ${direction}`;
  } else if (sortBy === 'title') {
    orderClause = `ORDER BY title COLLATE NOCASE ${direction}`;
  } else if (sortBy === 'status') {
    orderClause = `ORDER BY status ${direction}`;
  } else {
    orderClause = `ORDER BY updated_at ${direction}`;
  }

  const total = db.prepare(`SELECT COUNT(*) AS count FROM test_cases ${whereClause}`).get(params).count;

  const rows = db
    .prepare(`SELECT * FROM test_cases ${whereClause} ${orderClause} LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit: pageSize, offset: (page - 1) * pageSize });

  ok(res, {
    items: rows.map(serializeRow),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}

function handleGetTestCase(req, res) {
  const row = db.prepare('SELECT * FROM test_cases WHERE id = ?').get(req.params.id);
  if (!row) return fail(res, 404, 'Test case not found');
  ok(res, serializeRow(row));
}

function handleCreateTestCase(req, res) {
  const body = req.body || {};
  const errors = validateBody(body);
  if (errors.length) return fail(res, 400, errors.join('; '));

  const now = new Date().toISOString();
  const result = db
    .prepare(`
      INSERT INTO test_cases (title, preconditions, steps, expected_result, severity, status, created_at, updated_at)
      VALUES (@title, @preconditions, @steps, @expected_result, @severity, @status, @created_at, @updated_at)
    `)
    .run({
      title: body.title,
      preconditions: body.preconditions || null,
      steps: JSON.stringify(body.steps),
      expected_result: body.expected_result,
      severity: body.severity,
      status: body.status || 'draft',
      created_at: now,
      updated_at: now,
    });

  const row = db.prepare('SELECT * FROM test_cases WHERE id = ?').get(result.lastInsertRowid);
  ok(res, serializeRow(row));
}

function handleUpdateTestCase(req, res) {
  const existing = db.prepare('SELECT * FROM test_cases WHERE id = ?').get(req.params.id);
  if (!existing) return fail(res, 404, 'Test case not found');

  const body = req.body || {};
  const errors = validateBody(body, { partial: true });
  if (errors.length) return fail(res, 400, errors.join('; '));

  const merged = {
    title: body.title ?? existing.title,
    preconditions: body.preconditions !== undefined ? body.preconditions : existing.preconditions,
    steps: body.steps !== undefined ? JSON.stringify(body.steps) : existing.steps,
    expected_result: body.expected_result ?? existing.expected_result,
    severity: body.severity ?? existing.severity,
    status: body.status ?? existing.status,
    updated_at: new Date().toISOString(),
  };

  db.prepare(`
    UPDATE test_cases
    SET title = @title, preconditions = @preconditions, steps = @steps,
        expected_result = @expected_result, severity = @severity, status = @status, updated_at = @updated_at
    WHERE id = @id
  `).run({ ...merged, id: req.params.id });

  const row = db.prepare('SELECT * FROM test_cases WHERE id = ?').get(req.params.id);
  ok(res, serializeRow(row));
}

function handleDeleteTestCase(req, res) {
  const existing = db.prepare('SELECT * FROM test_cases WHERE id = ?').get(req.params.id);
  if (!existing) return fail(res, 404, 'Test case not found');

  db.prepare('DELETE FROM test_cases WHERE id = ?').run(req.params.id);
  ok(res, { id: Number(req.params.id) });
}

function handleGetTestCaseSuites(req, res) {
  const existing = db.prepare('SELECT id FROM test_cases WHERE id = ?').get(req.params.id);
  if (!existing) return fail(res, 404, 'Test case not found');

  const suites = db
    .prepare(`
      SELECT s.id, s.name
      FROM suite_test_cases stc
      JOIN suites s ON s.id = stc.suite_id
      WHERE stc.test_case_id = ?
      ORDER BY s.name
    `)
    .all(req.params.id);

  ok(res, { suites });
}

router.get('/', handleListTestCases);
router.get('/:id', handleGetTestCase);
router.get('/:id/suites', handleGetTestCaseSuites);
router.post('/', handleCreateTestCase);
router.put('/:id', handleUpdateTestCase);
router.delete('/:id', handleDeleteTestCase);

export default router;
