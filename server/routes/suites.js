import { Router } from 'express';
import db from '../db.js';

const router = Router();

const STATUSES = ['draft', 'ready', 'in-progress', 'passed', 'failed'];

function ok(res, data) {
  res.json({ success: true, data, error: null });
}

function fail(res, status, error) {
  res.status(status).json({ success: false, data: null, error });
}

function getSuiteRow(id) {
  return db.prepare('SELECT * FROM suites WHERE id = ?').get(id);
}

function getSuiteCases(suiteId) {
  return db
    .prepare(`
      SELECT stc.test_case_id, stc.sort_order, tc.title, tc.severity, tc.status
      FROM suite_test_cases stc
      JOIN test_cases tc ON tc.id = stc.test_case_id
      WHERE stc.suite_id = ?
      ORDER BY stc.sort_order ASC
    `)
    .all(suiteId);
}

function handleListSuites(req, res) {
  const { status = '' } = req.query;
  const where = [];
  const params = {};

  if (status && STATUSES.includes(status)) {
    where.push('s.status = @status');
    params.status = status;
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const rows = db
    .prepare(`
      SELECT s.*, COUNT(stc.id) AS case_count
      FROM suites s
      LEFT JOIN suite_test_cases stc ON stc.suite_id = s.id
      ${whereClause}
      GROUP BY s.id
      ORDER BY s.updated_at DESC
    `)
    .all(params);

  ok(res, { items: rows });
}

function handleGetSuite(req, res) {
  const suite = getSuiteRow(req.params.id);
  if (!suite) return fail(res, 404, 'Suite not found');
  ok(res, { ...suite, cases: getSuiteCases(suite.id) });
}

function handleCreateSuite(req, res) {
  const body = req.body || {};
  const errors = [];
  if (!body.name || !body.name.trim()) errors.push('name is required');
  if (!body.feature || !body.feature.trim()) errors.push('feature is required');
  if (body.status !== undefined && !STATUSES.includes(body.status)) {
    errors.push(`status must be one of ${STATUSES.join(', ')}`);
  }
  if (errors.length) return fail(res, 400, errors.join('; '));

  const now = new Date().toISOString();
  const result = db
    .prepare(`
      INSERT INTO suites (name, feature, status, created_at, updated_at)
      VALUES (@name, @feature, @status, @created_at, @updated_at)
    `)
    .run({
      name: body.name.trim(),
      feature: body.feature.trim(),
      status: body.status || 'draft',
      created_at: now,
      updated_at: now,
    });

  ok(res, { ...getSuiteRow(result.lastInsertRowid), cases: [] });
}

function handleUpdateSuite(req, res) {
  const existing = getSuiteRow(req.params.id);
  if (!existing) return fail(res, 404, 'Suite not found');

  const body = req.body || {};
  const errors = [];
  if (body.name !== undefined && !body.name.trim()) errors.push('name cannot be empty');
  if (body.feature !== undefined && !body.feature.trim()) errors.push('feature cannot be empty');
  if (body.status !== undefined && !STATUSES.includes(body.status)) {
    errors.push(`status must be one of ${STATUSES.join(', ')}`);
  }
  if (errors.length) return fail(res, 400, errors.join('; '));

  const merged = {
    name: body.name !== undefined ? body.name.trim() : existing.name,
    feature: body.feature !== undefined ? body.feature.trim() : existing.feature,
    status: body.status ?? existing.status,
    updated_at: new Date().toISOString(),
  };

  db.prepare(`
    UPDATE suites SET name = @name, feature = @feature, status = @status, updated_at = @updated_at
    WHERE id = @id
  `).run({ ...merged, id: req.params.id });

  ok(res, { ...getSuiteRow(req.params.id), cases: getSuiteCases(req.params.id) });
}

function handleDeleteSuite(req, res) {
  const existing = getSuiteRow(req.params.id);
  if (!existing) return fail(res, 404, 'Suite not found');

  db.prepare('DELETE FROM suites WHERE id = ?').run(req.params.id);
  ok(res, { id: Number(req.params.id) });
}

function handleAddCaseToSuite(req, res) {
  const suite = getSuiteRow(req.params.id);
  if (!suite) return fail(res, 404, 'Suite not found');

  const testCaseId = Number(req.body?.test_case_id);
  if (!testCaseId) return fail(res, 400, 'test_case_id is required');

  const testCase = db.prepare('SELECT id FROM test_cases WHERE id = ?').get(testCaseId);
  if (!testCase) return fail(res, 404, 'Test case not found');

  const alreadyIn = db
    .prepare('SELECT id FROM suite_test_cases WHERE suite_id = ? AND test_case_id = ?')
    .get(suite.id, testCaseId);
  if (alreadyIn) return fail(res, 400, 'This test case is already in the suite');

  const { maxOrder } = db
    .prepare('SELECT COALESCE(MAX(sort_order), -1) AS maxOrder FROM suite_test_cases WHERE suite_id = ?')
    .get(suite.id);

  db.prepare(`
    INSERT INTO suite_test_cases (suite_id, test_case_id, sort_order)
    VALUES (@suite_id, @test_case_id, @sort_order)
  `).run({ suite_id: suite.id, test_case_id: testCaseId, sort_order: maxOrder + 1 });

  db.prepare('UPDATE suites SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), suite.id);

  ok(res, { ...getSuiteRow(suite.id), cases: getSuiteCases(suite.id) });
}

function handleRemoveCaseFromSuite(req, res) {
  const suite = getSuiteRow(req.params.id);
  if (!suite) return fail(res, 404, 'Suite not found');

  const testCaseId = Number(req.params.testCaseId);
  const existing = db
    .prepare('SELECT id FROM suite_test_cases WHERE suite_id = ? AND test_case_id = ?')
    .get(suite.id, testCaseId);
  if (!existing) return fail(res, 404, 'This test case is not in the suite');

  db.prepare('DELETE FROM suite_test_cases WHERE suite_id = ? AND test_case_id = ?').run(suite.id, testCaseId);
  db.prepare('UPDATE suites SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), suite.id);

  ok(res, { ...getSuiteRow(suite.id), cases: getSuiteCases(suite.id) });
}

function handleReorderSuiteCases(req, res) {
  const suite = getSuiteRow(req.params.id);
  if (!suite) return fail(res, 404, 'Suite not found');

  const order = req.body?.order;
  if (!Array.isArray(order) || order.length === 0) {
    return fail(res, 400, 'order must be a non-empty array of test case ids');
  }

  const currentIds = getSuiteCases(suite.id).map((c) => c.test_case_id);
  const sameSet =
    currentIds.length === order.length &&
    [...currentIds].sort().join(',') === [...order].map(Number).sort().join(',');
  if (!sameSet) {
    return fail(res, 400, 'order must contain exactly the test case ids currently in the suite');
  }

  const update = db.prepare('UPDATE suite_test_cases SET sort_order = ? WHERE suite_id = ? AND test_case_id = ?');
  const reorderTx = db.transaction((ids) => {
    ids.forEach((testCaseId, index) => {
      update.run(index, suite.id, Number(testCaseId));
    });
  });
  reorderTx(order);

  db.prepare('UPDATE suites SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), suite.id);

  ok(res, { ...getSuiteRow(suite.id), cases: getSuiteCases(suite.id) });
}

router.get('/', handleListSuites);
router.get('/:id', handleGetSuite);
router.post('/', handleCreateSuite);
router.put('/:id', handleUpdateSuite);
router.delete('/:id', handleDeleteSuite);
router.post('/:id/cases', handleAddCaseToSuite);
router.delete('/:id/cases/:testCaseId', handleRemoveCaseFromSuite);
router.put('/:id/reorder', handleReorderSuiteCases);

export default router;
