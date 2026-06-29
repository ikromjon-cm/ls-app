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

function extractData(res) {
  // Handle both new {success, message, data, errors} and legacy formats
  if (res.success === true && res.data !== undefined) return res.data
  if (res.success === false) throw new Error(res.message || 'Server error')
  return res // legacy fallback for raw array responses
}

async function request(url, options = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`
  let res = await fetch(`${BASE}${url}`, { headers, ...options })
  if (res.status === 401) {
    if (refreshToken) {
      const r = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      })
      if (r.ok) {
        const data = await r.json()
        const body = extractData(data)
        setTokens(body.token, body.refreshToken)
        headers['Authorization'] = `Bearer ${body.token}`
        res = await fetch(`${BASE}${url}`, { headers, ...options })
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.message || 'So\'rov bajarilmadi')
        }
        return extractData(await res.json())
      }
    }
    clearTokens()
    window.dispatchEvent(new CustomEvent('auth:logout'))
    throw new Error('Sessiya tugadi. Qayta kiring.')
  }
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.message || 'Server xatoligi')
  }
  return extractData(await res.json())
}

export const api = {
  request,
  login: (login, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ login, password }) }),
  refresh: () => request('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
  getDashboard: () => request('/dashboard'),
  getUsers: (role) => request(`/users${role ? `?role=${role}` : ''}`),
  createUser: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),
  getGroups: () => request('/groups'),
  createGroup: (data) => request('/groups', { method: 'POST', body: JSON.stringify(data) }),
  updateGroup: (id, data) => request(`/groups/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGroup: (id) => request(`/groups/${id}`, { method: 'DELETE' }),
  getStudents: (params) => request(`/students?${new URLSearchParams(params)}`),
  createStudent: (data) => {
    if (data.avatar instanceof File) {
      const form = new FormData()
      Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== null) form.append(k, v) })
      return fetch(`${BASE}/students`, {
        method: 'POST', headers: { Authorization: `Bearer ${authToken}` }, body: form
      }).then(async r => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || 'Server error')
        return extractData(await r.json())
      })
    }
    return request('/students', { method: 'POST', body: JSON.stringify(data) })
  },
  updateStudent: (id, data) => {
    if (data.avatar instanceof File) {
      const form = new FormData()
      Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== null) form.append(k, v) })
      return fetch(`${BASE}/students/${id}`, {
        method: 'PUT', headers: { Authorization: `Bearer ${authToken}` }, body: form
      }).then(async r => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || 'Server error')
        return extractData(await r.json())
      })
    }
    return request(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  },
  deleteStudent: (id) => request(`/students/${id}`, { method: 'DELETE' }),
  getPayments: (params) => request(`/payments?${new URLSearchParams(params || {})}`),
  createPayment: (data) => request('/payments', { method: 'POST', body: JSON.stringify(data) }),
  getExpenses: (params) => request(`/expenses?${new URLSearchParams(params || {})}`),
  createExpense: (data) => request('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  deleteExpense: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),
  markAttendance: (data) => request('/attendance', { method: 'POST', body: JSON.stringify(data) }),
  getAttendance: (params) => request(`/attendance?${new URLSearchParams(params || {})}`),
  getAuditLogs: (params) => request(`/audit-logs?${new URLSearchParams(params || {})}`),
  getReports: (params) => request(`/reports?${new URLSearchParams(params || {})}`),
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  getHomework: (params) => request(`/homework?${new URLSearchParams(params || {})}`),
  getGrades: (params) => request(`/grades?${new URLSearchParams(params || {})}`),
  getMessages: (params) => request(`/messages?${new URLSearchParams(params || {})}`),
  sendMessage: (data) => request('/messages', { method: 'POST', body: JSON.stringify(data) }),
  getTeachers: () => request('/teachers'),
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  // Homework
  getHomework: (params) => request(`/homework?${new URLSearchParams(params || {})}`),
  createHomework: (data) => request('/homework', { method: 'POST', body: JSON.stringify(data) }),
  deleteHomework: (id) => request(`/homework/${id}`, { method: 'DELETE' }),
  // Grades
  getGrades: (params) => request(`/grades?${new URLSearchParams(params || {})}`),
  createGrade: (data) => request('/grades', { method: 'POST', body: JSON.stringify(data) }),
  // Schedule
  getSchedule: (params) => request(`/schedule?${new URLSearchParams(params || {})}`),
  createSchedule: (data) => request('/schedule', { method: 'POST', body: JSON.stringify(data) }),
  deleteSchedule: (id) => request(`/schedule/${id}`, { method: 'DELETE' }),
  // Library
  getBooks: (params) => request(`/library?${new URLSearchParams(params || {})}`),
  createBook: (data) => request('/library', { method: 'POST', body: JSON.stringify(data) }),
  deleteBook: (id) => request(`/library/${id}`, { method: 'DELETE' }),
  // Exams
  getExams: (params) => request(`/exams?${new URLSearchParams(params || {})}`),
  createExam: (data) => request('/exams', { method: 'POST', body: JSON.stringify(data) }),
  getExamResults: (params) => request(`/exam-results?${new URLSearchParams(params || {})}`),
  // Certificates
  getCertificates: (params) => request(`/certificates?${new URLSearchParams(params || {})}`),
  createCertificate: (data) => request('/certificates', { method: 'POST', body: JSON.stringify(data) }),
  // Payment providers config
  getPaymentProviders: () => request('/payments/providers/config'),
  updatePaymentProvider: (provider, data) => request(`/payments/providers/config/${provider}`, { method: 'PUT', body: JSON.stringify(data) }),
}
