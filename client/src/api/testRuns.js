async function request(path, options) {
  const res = await fetch(`/api/test-runs${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const body = await res.json();
  if (!body.success) {
    throw new Error(body.error || 'Request failed');
  }
  return body.data;
}

export function listRuns() {
  return request('');
}

export function getRun(id) {
  return request(`/${id}`);
}

export function createRun(suiteId) {
  return request('', { method: 'POST', body: JSON.stringify({ suite_id: suiteId }) });
}

export function updateRunResult(runId, testCaseId, result, notes) {
  return request(`/${runId}/cases/${testCaseId}`, {
    method: 'PUT',
    body: JSON.stringify({ result, notes }),
  });
}
