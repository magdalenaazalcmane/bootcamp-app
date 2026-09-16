async function request(path, options) {
  const res = await fetch(`/api/suites${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const body = await res.json();
  if (!body.success) {
    throw new Error(body.error || 'Request failed');
  }
  return body.data;
}

export function listSuites(params = {}) {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null))
  ).toString();
  return request(`?${query}`);
}

export function getSuite(id) {
  return request(`/${id}`);
}

export function createSuite(payload) {
  return request('', { method: 'POST', body: JSON.stringify(payload) });
}

export function updateSuite(id, payload) {
  return request(`/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export function deleteSuite(id) {
  return request(`/${id}`, { method: 'DELETE' });
}

export function addCaseToSuite(id, testCaseId) {
  return request(`/${id}/cases`, { method: 'POST', body: JSON.stringify({ test_case_id: testCaseId }) });
}

export function removeCaseFromSuite(id, testCaseId) {
  return request(`/${id}/cases/${testCaseId}`, { method: 'DELETE' });
}

export function reorderSuiteCases(id, order) {
  return request(`/${id}/reorder`, { method: 'PUT', body: JSON.stringify({ order }) });
}
