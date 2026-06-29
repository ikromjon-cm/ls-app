const BASE = '/api'

let authToken = localStorage.getItem('token')
let refreshToken = localStorage.getItem('refreshToken')

export function setTokens(token, rt) {
  authToken = token; refreshToken = rt
  if (token) localStorage.setItem('token', token); else localStorage.removeItem('token')
  if (rt) localStorage.setItem('refreshToken', rt); else localStorage.removeItem('refreshToken')
}

export function clearTokens() { setTokens(null, null) }
export function getToken() { return authToken }

async function request(url, options = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`
  const res = await fetch(`${BASE}${url}`, { headers, ...options })
  if (res.status === 401) {
    if (refreshToken) {
      const r = await fetch(`${BASE}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) })
      if (r.ok) {
        const data = await r.json()
        setTokens(data.token, data.refreshToken)
        headers['Authorization'] = `Bearer ${data.token}`
        const retry = await fetch(`${BASE}${url}`, { headers, ...options })
        if (!retry.ok) throw new Error((await retry.json().catch(() => ({}))).error || 'Request failed')
        return retry.json()
      }
    }
    clearTokens()
    throw new Error('Unauthorized')
  }
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Server error')
  return res.json()
}

export const api = {
  // Auth
  login: (login, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ login, password }) }),

  // Dashboard
  getDashboard: () => request('/dashboard'),

  // Users
  getUsers: (role) => request(`/users${role ? `?role=${role}` : ''}`),
  createUser: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),

  // Groups
  getGroups: () => request('/groups'),
  createGroup: (data) => request('/groups', { method: 'POST', body: JSON.stringify(data) }),
  updateGroup: (id, data) => request(`/groups/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGroup: (id) => request(`/groups/${id}`, { method: 'DELETE' }),

  // Students
  getStudents: (params) => request(`/students?${new URLSearchParams(params)}`),
  createStudent: (data) => {
    if (data.avatar instanceof File) {
      const form = new FormData()
      Object.entries(data).forEach(([k, v]) => form.append(k, v))
      return fetch(`${BASE}/students`, { method: 'POST', headers: { Authorization: `Bearer ${authToken}` }, body: form }).then(r => r.json())
    }
    return request('/students', { method: 'POST', body: JSON.stringify(data) })
  },
  updateStudent: (id, data) => request(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStudent: (id) => request(`/students/${id}`, { method: 'DELETE' }),

  // Payments
  getPayments: (params) => request(`/payments?${new URLSearchParams(params || {})}`),
  createPayment: (data) => request('/payments', { method: 'POST', body: JSON.stringify(data) }),

  // Expenses
  getExpenses: (params) => request(`/expenses?${new URLSearchParams(params || {})}`),
  createExpense: (data) => request('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  deleteExpense: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),

  // Attendance
  markAttendance: (data) => request('/attendance', { method: 'POST', body: JSON.stringify(data) }),
  getAttendance: (params) => request(`/attendance?${new URLSearchParams(params || {})}`),

  // Audit Logs
  getAuditLogs: (params) => request(`/audit-logs?${new URLSearchParams(params || {})}`),

  // Reports
  getReports: (params) => request(`/reports?${new URLSearchParams(params || {})}`),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),

  // Teachers
  getTeachers: () => request('/teachers'),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }),
}
