async function request(path, options) {
  const res = await fetch(`/api/bugs${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const body = await res.json();
  if (!body.success) {
    throw new Error(body.error || 'Request failed');
  }
  return body.data;
}

export function listBugs(params = {}) {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null))
  ).toString();
  return request(`?${query}`);
}

export function getBug(id) {
  return request(`/${id}`);
}

export function createBug(payload) {
  return request('', { method: 'POST', body: JSON.stringify(payload) });
}

export function updateBug(id, payload) {
  return request(`/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export function deleteBug(id) {
  return request(`/${id}`, { method: 'DELETE' });
}

export function changeBugStatus(id, status, message) {
  return request(`/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, message }) });
}

export function addBugComment(id, message) {
  return request(`/${id}/comments`, { method: 'POST', body: JSON.stringify({ message }) });
}
