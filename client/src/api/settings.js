async function request(options) {
  const res = await fetch('/api/settings', {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const body = await res.json();
  if (!body.success) {
    throw new Error(body.error || 'Request failed');
  }
  return body.data;
}

export function getSettings() {
  return request();
}

export function updateSettings(patch) {
  return request({ method: 'PUT', body: JSON.stringify(patch) });
}
