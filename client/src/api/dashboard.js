export async function getDashboardMetrics() {
  const res = await fetch('/api/dashboard/metrics');
  const body = await res.json();
  if (!body.success) {
    throw new Error(body.error || 'Request failed');
  }
  return body.data;
}
