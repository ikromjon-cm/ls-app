const BASE = '/api'

let authToken = localStorage.getItem('token')
let refreshToken = localStorage.getItem('refreshToken')
let refreshPromise = null

export function setTokens(token, rt) {
  authToken = token; refreshToken = rt
  if (token) localStorage.setItem('token', token); else localStorage.removeItem('token')
  if (rt) localStorage.setItem('refreshToken', rt); else localStorage.removeItem('refreshToken')
}

export function clearTokens() { setTokens(null, null) }
export function getToken() { return authToken }

function extractData(res) {
  if (res.success === true && res.data !== undefined) return res.data
  if (res.success === false) throw new Error(res.message || 'Server error')
  return res
}

function showErrorToast(message) {
  try {
    const event = new CustomEvent('app:error', { detail: { message } })
    window.dispatchEvent(event)
  } catch {}
}

async function tryRefreshToken() {
  if (!refreshToken) return false
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const r = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      if (!r.ok) throw new Error('Refresh failed')
      const data = await r.json()
      const body = extractData(data)
      setTokens(body.token, body.refreshToken)
      return true
    } catch {
      clearTokens()
      window.dispatchEvent(new CustomEvent('auth:logout'))
      return false
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

async function request(url, options = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const isFormData = options.body instanceof FormData
  if (isFormData) delete headers['Content-Type']

  if (authToken) headers['Authorization'] = `Bearer ${authToken}`

  let res = await fetch(`${BASE}${url}`, { headers, ...options })

  if (res.status === 401) {
    const refreshed = await tryRefreshToken()
    if (refreshed) {
      headers['Authorization'] = `Bearer ${authToken}`
      res = await fetch(`${BASE}${url}`, { headers, ...options })
    } else {
      throw new Error('Sessiya tugadi. Qayta kiring.')
    }
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    const message = errData.message || 'Server xatoligi'
    showErrorToast(message)
    throw new Error(message)
  }

  return extractData(await res.json())
}

function buildQuery(params) {
  if (!params || !Object.keys(params).length) return ''
  const clean = Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== ''))
  return '?' + new URLSearchParams(clean).toString()
}

function handleFormData(url, method, data) {
  const form = new FormData()
  Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== null) form.append(k, v) })
  return fetch(`${BASE}${url}`, {
    method,
    headers: { Authorization: `Bearer ${authToken}` },
    body: form,
  }).then(async r => {
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || 'Server xatoligi')
    return extractData(await r.json())
  })
}

export const api = {
  request,

  // Auth
  login: (login, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ login, password }) }),
  refresh: () => request('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  sendOTP: (phone) => request('/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone }) }),
  verifyOTP: (phone, code) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, code }) }),

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
  getStudents: (params) => request(`/students${buildQuery(params)}`),
  createStudent: (data) => {
    if (data.avatar instanceof File) return handleFormData('/students', 'POST', data)
    return request('/students', { method: 'POST', body: JSON.stringify(data) })
  },
  updateStudent: (id, data) => {
    if (data.avatar instanceof File) return handleFormData(`/students/${id}`, 'PUT', data)
    return request(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  },
  deleteStudent: (id) => request(`/students/${id}`, { method: 'DELETE' }),

  // Payments
  getPayments: (params) => request(`/payments${buildQuery(params)}`),
  createPayment: (data) => request('/payments', { method: 'POST', body: JSON.stringify(data) }),
  updatePayment: (id, data) => request(`/payments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePayment: (id) => request(`/payments/${id}`, { method: 'DELETE' }),

  // Expenses
  getExpenses: (params) => request(`/expenses${buildQuery(params)}`),
  createExpense: (data) => request('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  deleteExpense: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),

  // Attendance
  markAttendance: (data) => request('/attendance', { method: 'POST', body: JSON.stringify(data) }),
  getAttendance: (params) => request(`/attendance${buildQuery(params)}`),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PUT' }),
  sendPushNotification: (data) => request('/notifications/push', { method: 'POST', body: JSON.stringify(data) }),

  // Messages
  getMessages: (params) => request(`/messages${buildQuery(params)}`),
  sendMessage: (data) => request('/messages', { method: 'POST', body: JSON.stringify(data) }),

  // Homework
  getHomework: (params) => request(`/homework${buildQuery(params)}`),
  createHomework: (data) => request('/homework', { method: 'POST', body: JSON.stringify(data) }),
  deleteHomework: (id) => request(`/homework/${id}`, { method: 'DELETE' }),

  // Grades
  getGrades: (params) => request(`/grades${buildQuery(params)}`),
  createGrade: (data) => request('/grades', { method: 'POST', body: JSON.stringify(data) }),

  // Schedule
  getSchedule: (params) => request(`/schedule${buildQuery(params)}`),
  createSchedule: (data) => request('/schedule', { method: 'POST', body: JSON.stringify(data) }),
  deleteSchedule: (id) => request(`/schedule/${id}`, { method: 'DELETE' }),

  // Library
  getBooks: (params) => request(`/library${buildQuery(params)}`),
  createBook: (data) => request('/library', { method: 'POST', body: JSON.stringify(data) }),
  deleteBook: (id) => request(`/library/${id}`, { method: 'DELETE' }),

  // Exams
  getExams: (params) => request(`/exams${buildQuery(params)}`),
  createExam: (data) => request('/exams', { method: 'POST', body: JSON.stringify(data) }),
  getExamResults: (params) => request(`/exam-results${buildQuery(params)}`),

  // Certificates
  getCertificates: (params) => request(`/certificates${buildQuery(params)}`),
  createCertificate: (data) => request('/certificates', { method: 'POST', body: JSON.stringify(data) }),

  // Reports
  getReports: (params) => request(`/reports${buildQuery(params)}`),

  // Teachers
  getTeachers: () => request('/teachers'),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Audit Logs
  getAuditLogs: (params) => request(`/audit-logs${buildQuery(params)}`),

  // Payment Providers
  getPaymentProviders: () => request('/payments/providers/config'),
  updatePaymentProvider: (provider, data) => request(`/payments/providers/config/${provider}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Email
  sendEmail: (data) => request('/email/send', { method: 'POST', body: JSON.stringify(data) }),
  sendPasswordReset: (email) => request('/email/password-reset', { method: 'POST', body: JSON.stringify({ email }) }),

  // FCM
  registerFCMToken: (token, platform) => request('/fcm/register', { method: 'POST', body: JSON.stringify({ token, platform }) }),
  unregisterFCMToken: (token) => request('/fcm/register', { method: 'DELETE', body: JSON.stringify({ token }) }),

  // Parent portal
  getParentChildren: () => request('/parent/children'),
}
