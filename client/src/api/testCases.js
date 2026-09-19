async function request(path, options) {
  const res = await fetch(`/api/test-cases${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const body = await res.json();
  if (!body.success) {
    throw new Error(body.error || 'Request failed');
  }
  return body.data;
}

export function listTestCases(params = {}) {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null))
  ).toString();
  return request(`?${query}`);
}

export function createTestCase(payload) {
  return request('', { method: 'POST', body: JSON.stringify(payload) });
}

export function updateTestCase(id, payload) {
  return request(`/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export function deleteTestCase(id) {
  return request(`/${id}`, { method: 'DELETE' });
}

export function getTestCaseSuites(id) {
  return request(`/${id}/suites`);
}

export function previewImport(csvText) {
  return request('/import/preview', { method: 'POST', body: JSON.stringify({ csv_text: csvText }) });
}

export function commitImport(rows) {
  return request('/import/commit', { method: 'POST', body: JSON.stringify({ rows }) });
}

export function getExportCsvUrl(params = {}) {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null))
  ).toString();
  return `/api/test-cases/export/csv?${query}`;
}
