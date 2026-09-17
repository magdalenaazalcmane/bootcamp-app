async function request(path, options) {
  const res = await fetch(`/api/reports${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const body = await res.json();
  if (!body.success) {
    throw new Error(body.error || 'Request failed');
  }
  return body.data;
}

export function listReports() {
  return request('');
}

export function getReport(id) {
  return request(`/${id}`);
}

export function createReport(runId) {
  return request('', { method: 'POST', body: JSON.stringify({ run_id: runId }) });
}

export function getReportDownloadUrl(id) {
  return `/api/reports/${id}/export/html`;
}

export function getReportPrintUrl(id) {
  return `/api/reports/${id}/export/html?mode=print`;
}
