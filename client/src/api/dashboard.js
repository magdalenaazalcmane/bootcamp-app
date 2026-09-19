async function request(path) {
  const res = await fetch(`/api/dashboard${path}`);
  const body = await res.json();
  if (!body.success) {
    throw new Error(body.error || 'Request failed');
  }
  return body.data;
}

export function getDashboardMetrics() {
  return request('/metrics');
}

export function getDashboardTrends() {
  return request('/trends');
}
