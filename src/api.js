const BASE = '/api'

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Server error')
  }
  return res.json()
}

export const api = {
  getGroups: () => request('/groups'),
  createGroup: (data) => request('/groups', { method: 'POST', body: JSON.stringify(data) }),
  updateGroup: (id, data) => request(`/groups/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGroup: (id) => request(`/groups/${id}`, { method: 'DELETE' }),
  addStudent: (groupId, data) => request(`/groups/${groupId}/students`, { method: 'POST', body: JSON.stringify(data) }),
  updateStudent: (id, data) => request(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStudent: (id) => request(`/students/${id}`, { method: 'DELETE' }),
  markPayment: (studentId, data) => request(`/students/${studentId}/payment`, { method: 'POST', body: JSON.stringify(data) }),
  markAttendance: (studentId, data) => request(`/students/${studentId}/attendance`, { method: 'POST', body: JSON.stringify(data) }),
  getPayments: () => request('/payments'),
  getStats: () => request('/stats'),
  getDebtors: (search = '') => request(`/debtors?search=${encodeURIComponent(search)}`),
}
