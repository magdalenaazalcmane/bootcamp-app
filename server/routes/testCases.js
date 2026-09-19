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

// RFC4180 field escaping: quote (and double-up internal quotes) any field
// containing a comma, quote, or newline — the exact inverse of parseCsv below.
function escapeCsvField(value) {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const EXPORT_COLUMNS = ['title', 'preconditions', 'steps', 'expected_result', 'severity', 'status'];

function rowsToCsv(rows) {
  const lines = [EXPORT_COLUMNS.join(',')];
  for (const row of rows) {
    const steps = JSON.parse(row.steps).join('\n');
    const values = [row.title, row.preconditions, steps, row.expected_result, row.severity, row.status];
    lines.push(values.map(escapeCsvField).join(','));
  }
  return lines.join('\r\n');
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

// Shared by the list endpoint and the CSV export endpoint, so the two can
// never silently drift apart on what "matches the current filters" means.
function buildFilterClauses({ search, status, sortBy, order }) {
  const where = [];
  const params = {};

  if (search) {
    where.push('title GLOB @search');
    params.search = `*${search}*`;
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

  return { whereClause, orderClause, params };
}

function handleListTestCases(req, res) {
  const { search = '', status = '', sortBy = 'updated_at', order = 'desc' } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = 20;

  const { whereClause, orderClause, params } = buildFilterClauses({ search, status, sortBy, order });

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

// --- CSV import ---

const MAX_CSV_BYTES = 2 * 1024 * 1024; // 2MB safety cap, not a hard business rule
const REQUIRED_IMPORT_HEADERS = ['title', 'severity', 'steps'];
const RECOGNIZED_IMPORT_HEADERS = ['title', 'severity', 'steps', 'expected_result', 'preconditions', 'status'];

// RFC4180-ish CSV parser: quoted fields, embedded commas/newlines inside
// quotes, "" as an escaped quote, and both \r\n and \n line endings.
function parseCsv(text) {
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  function pushField() {
    row.push(field);
    field = '';
  }
  function pushRow() {
    pushField();
    rows.push(row);
    row = [];
  }

  while (i < source.length) {
    const char = source[i];

    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (char === ',') {
      pushField();
      i += 1;
      continue;
    }
    if (char === '\r' && source[i + 1] === '\n') {
      pushRow();
      i += 2;
      continue;
    }
    if (char === '\n' || char === '\r') {
      pushRow();
      i += 1;
      continue;
    }
    field += char;
    i += 1;
  }

  if (field.length > 0 || row.length > 0) {
    pushRow();
  }

  return rows.filter((r) => !(r.length === 1 && r[0] === ''));
}

function normalizeHeaderName(h) {
  return (h || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function buildHeaderIndex(headerRow) {
  const index = {};
  headerRow.forEach((h, i) => {
    const normalized = normalizeHeaderName(h);
    if (RECOGNIZED_IMPORT_HEADERS.includes(normalized) && index[normalized] === undefined) {
      index[normalized] = i;
    }
  });
  return index;
}

function getCell(row, headerIndex, name) {
  const idx = headerIndex[name];
  if (idx === undefined || idx >= row.length) return '';
  return (row[idx] ?? '').trim();
}

// Matches a cell value against a known enum case-insensitively, returning the
// canonical form on a match — spreadsheet data entry is error-prone on
// capitalization, so "critical" should still import as "Critical".
function normalizeEnumValue(value, enumValues) {
  const trimmed = (value || '').trim();
  const match = enumValues.find((v) => v.toLowerCase() === trimmed.toLowerCase());
  return match || trimmed;
}

function mapRowToTestCase(row, headerIndex) {
  const stepsRaw = getCell(row, headerIndex, 'steps');
  const steps = stepsRaw
    .split(/\r\n|\n|\r/)
    .map((s) => s.trim())
    .filter(Boolean);
  const statusRaw = getCell(row, headerIndex, 'status');

  return {
    title: getCell(row, headerIndex, 'title'),
    preconditions: getCell(row, headerIndex, 'preconditions') || null,
    steps,
    expected_result: getCell(row, headerIndex, 'expected_result'),
    severity: normalizeEnumValue(getCell(row, headerIndex, 'severity'), SEVERITIES),
    status: statusRaw ? normalizeEnumValue(statusRaw, STATUSES) : 'draft',
  };
}

// Deliberately fresh validation (not a reuse of the existing validateBody
// above) — always requires non-blank values, with no partial-update mode to
// accidentally let a blank slip through.
function validateImportRow(mapped) {
  const errors = [];
  if (!mapped.title || !mapped.title.trim()) errors.push('title is required');
  if (!Array.isArray(mapped.steps) || mapped.steps.length === 0) {
    errors.push('steps is required (at least one non-empty line in the steps cell)');
  }
  if (!mapped.expected_result || !mapped.expected_result.trim()) errors.push('expected_result is required');
  if (!SEVERITIES.includes(mapped.severity)) errors.push(`severity must be one of ${SEVERITIES.join(', ')}`);
  if (!STATUSES.includes(mapped.status)) errors.push(`status must be one of ${STATUSES.join(', ')}`);
  return errors;
}

function handlePreviewImport(req, res) {
  const csvText = req.body?.csv_text;
  if (typeof csvText !== 'string' || !csvText.trim()) {
    return fail(res, 400, 'csv_text is required');
  }
  if (Buffer.byteLength(csvText, 'utf8') > MAX_CSV_BYTES) {
    return fail(res, 400, 'CSV file is too large (max 2MB)');
  }

  const rows = parseCsv(csvText);
  if (rows.length === 0) {
    return fail(res, 400, 'CSV file is empty');
  }

  const headerIndex = buildHeaderIndex(rows[0]);
  const missingHeaders = REQUIRED_IMPORT_HEADERS.filter((h) => headerIndex[h] === undefined);
  if (missingHeaders.length > 0) {
    return fail(res, 400, `CSV is missing required column(s): ${missingHeaders.join(', ')}`);
  }

  const valid = [];
  const invalid = [];

  rows.slice(1).forEach((row, i) => {
    const rowNumber = i + 2; // +1 for 0-index, +1 for the header row itself
    if (row.every((cell) => !cell || !cell.trim())) return; // skip blank trailing lines silently

    const mapped = mapRowToTestCase(row, headerIndex);
    const errors = validateImportRow(mapped);
    if (errors.length === 0) {
      valid.push({ row_number: rowNumber, ...mapped });
    } else {
      invalid.push({ row_number: rowNumber, title: mapped.title || '(no title)', errors });
    }
  });

  ok(res, {
    valid,
    invalid,
    total_rows: valid.length + invalid.length,
    valid_count: valid.length,
    invalid_count: invalid.length,
  });
}

function handleCommitImport(req, res) {
  const rows = req.body?.rows;
  if (!Array.isArray(rows) || rows.length === 0) {
    return fail(res, 400, 'rows is required and must be a non-empty array');
  }

  const now = new Date().toISOString();
  const insert = db.prepare(`
    INSERT INTO test_cases (title, preconditions, steps, expected_result, severity, status, created_at, updated_at)
    VALUES (@title, @preconditions, @steps, @expected_result, @severity, @status, @created_at, @updated_at)
  `);

  const imported = [];
  const skipped = [];

  // Never trusts the client's claim that a row is valid — re-validates every
  // row here too, since this endpoint can be called directly, bypassing the
  // preview step entirely.
  const runImport = db.transaction((rowsToImport) => {
    rowsToImport.forEach((row, i) => {
      const rowNumber = row.row_number ?? i + 1;
      const mapped = {
        title: row.title,
        preconditions: row.preconditions,
        steps: row.steps,
        expected_result: row.expected_result,
        severity: row.severity,
        status: row.status,
      };
      const errors = validateImportRow(mapped);
      if (errors.length > 0) {
        skipped.push({ row_number: rowNumber, title: mapped.title || '(no title)', errors });
        return;
      }
      const result = insert.run({
        title: mapped.title,
        preconditions: mapped.preconditions || null,
        steps: JSON.stringify(mapped.steps),
        expected_result: mapped.expected_result,
        severity: mapped.severity,
        status: mapped.status,
        created_at: now,
        updated_at: now,
      });
      imported.push({ row_number: rowNumber, id: result.lastInsertRowid, title: mapped.title });
    });
  });

  runImport(rows);

  ok(res, {
    imported,
    skipped,
    imported_count: imported.length,
    skipped_count: skipped.length,
  });
}

// Deliberately does NOT use the {success, data, error} envelope — same
// justified exception as the report HTML export: this serves a real,
// downloadable CSV file, and wrapping it in JSON would break the download.
function handleExportCsv(req, res) {
  const { search = '', status = '', sortBy = 'updated_at', order = 'desc' } = req.query;
  const { whereClause, orderClause, params } = buildFilterClauses({ search, status, sortBy, order });

  const rows = db.prepare(`SELECT * FROM test_cases ${whereClause} ${orderClause}`).all(params);
  const csv = rowsToCsv(rows);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="test-cases.csv"');
  // Leading BOM so Excel recognizes the file as UTF-8 and renders any
  // non-ASCII characters correctly instead of mojibake.
  res.send('﻿' + csv);
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
router.get('/export/csv', handleExportCsv);
router.get('/:id', handleGetTestCase);
router.get('/:id/suites', handleGetTestCaseSuites);
router.post('/', handleCreateTestCase);
router.put('/:id', handleUpdateTestCase);
router.delete('/:id', handleDeleteTestCase);
router.post('/import/preview', handlePreviewImport);
router.post('/import/commit', handleCommitImport);

export default router;
