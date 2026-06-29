import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcrypt'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = process.env.DB_PATH || join(__dirname, 'crm.json')

function read() {
  if (!existsSync(DB_PATH)) return null
  return JSON.parse(readFileSync(DB_PATH, 'utf8'))
}
function write(data) { writeFileSync(DB_PATH, JSON.stringify(data, null, 2)) }

const getToday = () => new Date().toLocaleDateString('en-CA')
const getNow = () => new Date().toISOString()

function getDB() {
  let db = read()
  if (!db) {
    db = defaultData()
    write(db)
  }
  const defaults = defaultData()
  for (const key of Object.keys(defaults)) {
    if (db[key] === undefined) db[key] = defaults[key]
  }
  return db
}

function save(db) { write(db) }

function defaultData() {
  const now = getNow()
  const today = getToday()
  return {
    users: [
      { id: 1, login: 'superadmin', password: bcrypt.hashSync('admin123', 10), name: 'Super Admin', role: 'superadmin', phone: '+998901234567', createdAt: now, updatedAt: now, avatar: null, active: true },
      { id: 2, login: 'admin1', password: bcrypt.hashSync('admin123', 10), name: 'Admin Aziza', role: 'admin', phone: '+998901234568', createdAt: now, updatedAt: now, avatar: null, active: true, branch: 'Markaziy filial' },
      { id: 3, login: 'teacher1', password: bcrypt.hashSync('teacher123', 10), name: "O'qituvchi Bekzod", role: 'teacher', phone: '+998901234569', createdAt: now, updatedAt: now, avatar: null, active: true, groupIds: [] },
    ],
    students: [],
    groups: [],
    payments: [],
    expenses: [],
    attendance: [],
    auditLogs: [],
    notifications: [],
    homework: [],
    grades: [],
    schedule: [],
    messages: [],
    library: [],
    exams: [],
    examResults: [],
    certificates: [],
    qrCodes: [],
    devices: [],
    paymentTransactions: [],
    branches: ['Markaziy filial'],
    courses: ['Frontend', 'Backend', 'IELTS', 'Python', 'Mobile', 'Design'],
    settings: {
      sessionTimeout: 60,
      smsEnabled: false,
      telegramEnabled: false,
      paymentProviders: {
        click: { merchantId: '', secretKey: '', serviceId: '', merchantUserId: '', enabled: false },
        payme: { merchantId: '', secretKey: '', checkoutUrl: '', enabled: false },
        uzum: { merchantId: '', secretKey: '', terminalId: '', enabled: false },
      },
    },
    counters: { userId: 4, studentId: 1, groupId: 1, paymentId: 1, expenseId: 1, attendanceId: 1, auditId: 1, notificationId: 1, homeworkId: 1, gradeId: 1, scheduleId: 1, messageId: 1, bookId: 1, examId: 1, examResultId: 1, certificateId: 1, qrId: 1, deviceId: 1, paymentTxId: 1 },
  }
}

function nextId(counter) {
  const db = getDB()
  const id = db.counters[counter]++
  save(db)
  return id
}

function findUser(id) { return getDB().users.find(u => u.id === id) }
function findStudent(id) { return getDB().students.find(s => s.id === id) }
function findGroup(id) { return getDB().groups.find(g => g.id === id) }

// ───── Audit ─────
export function logAudit({ userId, userName, userRole, action, details, type, groupId, groupName, ip }) {
  const db = getDB()
  db.auditLogs.push({
    id: nextId('auditId'),
    userId, userName, userRole, action, details, type: type || 'general',
    groupId: groupId || null, groupName: groupName || null,
    ip: ip || '127.0.0.1', createdAt: getNow(),
  })
  save(db)
}

// ───── Notifications ─────
export function createNotification({ userId, title, message, type }) {
  const db = getDB()
  db.notifications.push({
    id: nextId('notificationId'),
    userId: userId || null, title, message, type: type || 'info',
    read: false, createdAt: getNow(),
  })
  save(db)
}

export function getNotifications(userId) {
  const db = getDB()
  if (!userId) return db.notifications.slice().reverse()
  return db.notifications.filter(n => !n.userId || n.userId === userId).slice().reverse()
}

export function markNotificationRead(id) {
  const db = getDB()
  const n = db.notifications.find(n => n.id === id)
  if (n) n.read = true
  save(db)
}

// ───── Auth ─────
export function authenticate(login, password) {
  let user = getDB().users.find(u => u.login === login && u.active)
  if (!user) user = getDB().users.find(u => u.phone === login && u.role === 'parent' && u.active)
  if (!user) user = getDB().users.find(u => u.phone === login && u.role === 'student' && u.active)
  if (!user) return null
  if (!bcrypt.compareSync(password, user.password)) return null
  const { password: _, ...safe } = user
  return safe
}

export function getUser(id) {
  const user = findUser(id)
  if (!user) return null
  const { password: _, ...safe } = user
  return safe
}

export function getUsers(role) {
  const db = getDB()
  let users = db.users.map(({ password, ...u }) => u)
  if (role) users = users.filter(u => u.role === role)
  return users
}

export function createUser(data) {
  const db = getDB()
  if (db.users.find(u => u.login === data.login)) return null
  const user = {
    id: nextId('userId'),
    ...data,
    password: bcrypt.hashSync(data.password, 10),
    createdAt: getNow(), updatedAt: getNow(),
    active: true, avatar: null,
  }
  db.users.push(user)
  save(db)
  logAudit({ userId: data.createdBy || 1, userName: data.createdByName || 'System', userRole: 'superadmin', action: `Yangi ${data.role} yaratildi: ${data.name}`, details: `Login: ${data.login}, Role: ${data.role}`, type: 'user' })
  const { password: _, ...safe } = user
  return safe
}

export function updateUser(id, data) {
  const db = getDB()
  const user = db.users.find(u => u.id === id)
  if (!user) return null
  if (data.password) data.password = bcrypt.hashSync(data.password, 10)
  Object.assign(user, data, { updatedAt: getNow() })
  save(db)
  const { password: _, ...safe } = user
  return safe
}

export function deleteUser(id) {
  const db = getDB()
  const idx = db.users.findIndex(u => u.id === id)
  if (idx === -1) return false
  db.users.splice(idx, 1)
  save(db)
  return true
}

// ───── Dashboard ─────
export function getDashboardStats() {
  const db = getDB()
  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()
  const today = getToday()

  const students = db.students
  const groups = db.groups
  const users = db.users
  const payments = db.payments
  const expenses = db.expenses

  const monthlyPayments = payments.filter(p => { const d = new Date(p.date); return d.getMonth() === month && d.getFullYear() === year })
  const monthlyExpenses = expenses.filter(e => { const d = new Date(e.date); return d.getMonth() === month && d.getFullYear() === year })

  const totalRevenue = monthlyPayments.reduce((s, p) => s + p.amount, 0)
  const totalExpense = monthlyExpenses.reduce((s, e) => s + e.amount, 0)

  const todayStudents = students.filter(s => s.createdAt && s.createdAt.startsWith(today))
  const todayPayments = payments.filter(p => p.date === today)
  const todayPaymentsSum = todayPayments.reduce((s, p) => s + p.amount, 0)

  const todayAttendance = db.attendance.filter(a => a.date === today)
  const presentToday = todayAttendance.filter(a => a.status === 'present').length

  const teacherAttendance = {}
  for (const a of todayAttendance) {
    const s = students.find(st => st.id === a.studentId)
    if (s) {
      const g = groups.find(gr => gr.id === s.groupId)
      if (g && g.teacherId) {
        teacherAttendance[g.teacherId] = (teacherAttendance[g.teacherId] || 0) + (a.status === 'present' ? 1 : 0)
      }
    }
  }

  const teacherRating = Object.entries(teacherAttendance)
    .map(([id, count]) => {
      const t = users.find(u => u.id === Number(id))
      return { name: t?.name || 'Noma\'lum', count, id: Number(id) }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const groupStats = groups.map(g => ({
    name: g.name,
    total: g.studentIds?.length || 0,
    paid: g.studentIds?.filter(sid => students.find(s => s.id === sid)?.paymentStatus === 'paid').length || 0,
    debt: g.studentIds?.filter(sid => students.find(s => s.id === sid)?.paymentStatus === 'debt').length || 0,
  }))

  const courseStats = {}
  for (const s of students) {
    if (s.course) {
      courseStats[s.course] = (courseStats[s.course] || 0) + 1
    }
  }

  return {
    totalStudents: students.length,
    totalGroups: groups.length,
    totalTeachers: users.filter(u => u.role === 'teacher').length,
    totalAdmins: users.filter(u => u.role === 'admin').length,
    totalRevenue,
    totalExpense,
    netProfit: totalRevenue - totalExpense,
    debtors: students.filter(s => s.paymentStatus === 'debt').length,
    presentToday,
    absentToday: todayAttendance.filter(a => a.status === 'absent').length,
    lateToday: todayAttendance.filter(a => a.status === 'late').length,
    totalToday: students.length,
    attendancePercent: students.length > 0 ? Math.round((presentToday / students.length) * 100) : 0,
    newToday: todayStudents.length,
    todayRevenue: todayPaymentsSum,
    teacherRating,
    groupStats,
    courseStats: Object.entries(courseStats).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
  }
}

// ───── Groups ─────
export function getGroups(user) {
  const db = getDB()
  let groups = db.groups
  if (user?.role === 'teacher') groups = groups.filter(g => g.teacherId === user.id)
  return groups
}

export function createGroup(data) {
  const db = getDB()
  const group = { id: nextId('groupId'), ...data, studentIds: [], status: 'active', createdAt: getNow(), updatedAt: getNow() }
  db.groups.push(group)
  save(db)
  logAudit({ userId: data.createdBy || 1, userName: data.createdByName || 'System', userRole: data.createdByRole || 'admin', action: `Yangi guruh yaratildi: ${group.name}`, details: `Kurs: ${data.course}, O'qituvchi: ${data.teacherName}`, type: 'group', groupId: group.id, groupName: group.name })
  createNotification({ title: 'Yangi guruh', message: `${group.name} guruhi ochildi`, type: 'info' })
  return group
}

export function updateGroup(id, data) {
  const db = getDB()
  const g = db.groups.find(gr => gr.id === id)
  if (!g) return null
  const oldTeacher = g.teacherName
  Object.assign(g, data, { updatedAt: getNow() })
  save(db)
  if (data.teacherName && data.teacherName !== oldTeacher) {
    logAudit({ userId: data.updatedBy || 1, userName: data.updatedByName || 'System', userRole: data.updatedByRole || 'admin', action: `${g.name} guruhi o'qituvchisi almashtirildi`, details: `${oldTeacher} -> ${data.teacherName}`, type: 'group', groupId: g.id, groupName: g.name })
  }
  return g
}

export function deleteGroup(id) {
  const db = getDB()
  const idx = db.groups.findIndex(g => g.id === id)
  if (idx === -1) return false
  db.groups.splice(idx, 1)
  db.students = db.students.filter(s => s.groupId !== id)
  save(db)
  return true
}

// ───── Students ─────
export function getStudents(filters = {}) {
  const db = getDB()
  let students = [...db.students]
  if (filters.groupId) students = students.filter(s => s.groupId === Number(filters.groupId))
  if (filters.course) students = students.filter(s => s.course === filters.course)
  if (filters.search) {
    const q = filters.search.toLowerCase()
    students = students.filter(s => s.name.toLowerCase().includes(q) || s.phone?.includes(q) || s.parentPhone?.includes(q))
  }
  if (filters.status) students = students.filter(s => s.paymentStatus === filters.status)
  return students.map(s => ({ ...s, groupName: db.groups.find(g => g.id === s.groupId)?.name || 'N/A' }))
}

export function createStudent(data) {
  const db = getDB()
  const parentIds = []
  const existing = db.students.find(s => s.phone === data.phone)
  if (existing) return existing

  // Auto-create parent account
  if (data.parentLogin && data.parentPassword) {
    const existingParent = db.users.find(u => u.login === data.parentLogin)
    if (existingParent) {
      parentIds.push(existingParent.id)
    } else {
      const parentUser = {
        id: nextId('userId'),
        login: data.parentLogin,
        password: bcrypt.hashSync(data.parentPassword, 10),
        name: data.parentName || 'Ota-ona',
        role: 'parent',
        phone: data.parentPhone || '',
        createdAt: getNow(), updatedAt: getNow(),
        active: true, avatar: null,
        childIds: [],
      }
      db.users.push(parentUser)
      parentIds.push(parentUser.id)
    }
  }

  // Auto-create student account
  let studentUserId = null
  if (data.studentLogin && data.studentPassword) {
    if (!db.users.find(u => u.login === data.studentLogin)) {
      const studentUser = {
        id: nextId('userId'),
        login: data.studentLogin,
        password: bcrypt.hashSync(data.studentPassword, 10),
        name: data.name,
        role: 'student',
        phone: data.phone || '',
        createdAt: getNow(), updatedAt: getNow(),
        active: true, avatar: null,
      }
      db.users.push(studentUser)
      studentUserId = studentUser.id
    }
  }

  const studentData = { ...data }
  delete studentData.parentLogin
  delete studentData.parentPassword
  delete studentData.studentLogin
  delete studentData.studentPassword

  const student = { id: nextId('studentId'), ...studentData, parentIds, studentUserId, createdAt: getNow(), updatedAt: getNow() }
  db.students.push(student)

  // Update parent user's childIds
  for (const pid of parentIds) {
    const parent = db.users.find(u => u.id === pid)
    if (parent) {
      parent.childIds = parent.childIds || []
      if (!parent.childIds.includes(student.id)) {
        parent.childIds.push(student.id)
      }
    }
  }

  const group = db.groups.find(g => g.id === data.groupId)
  if (group) {
    group.studentIds = group.studentIds || []
    group.studentIds.push(student.id)
  }
  save(db)
  logAudit({ userId: data.createdBy || 1, userName: data.createdByName || 'System', userRole: data.createdByRole || 'admin', action: `Yangi o'quvchi qo'shildi: ${student.name}`, details: `Kurs: ${data.course}, Guruh: ${group?.name || 'N/A'}`, type: 'student', groupId: data.groupId, groupName: group?.name })
  createNotification({ title: 'Yangi o\'quvchi', message: `${student.name} tizimga qo'shildi`, type: 'info' })
  return student
}

export function updateStudent(id, data) {
  const db = getDB()
  const s = db.students.find(st => st.id === id)
  if (!s) return null
  Object.assign(s, data, { updatedAt: getNow() })
  save(db)
  return s
}

export function deleteStudent(id) {
  const db = getDB()
  const idx = db.students.findIndex(s => s.id === id)
  if (idx === -1) return false
  const student = db.students[idx]
  const group = db.groups.find(g => g.id === student.groupId)
  if (group) {
    group.studentIds = (group.studentIds || []).filter(sid => sid !== id)
  }
  db.students.splice(idx, 1)
  save(db)
  return true
}

// ───── Payments ─────
export function getPayments(filters = {}) {
  const db = getDB()
  let payments = [...db.payments]
  if (filters.startDate) payments = payments.filter(p => p.date >= filters.startDate)
  if (filters.endDate) payments = payments.filter(p => p.date <= filters.endDate)
  if (filters.studentId) payments = payments.filter(p => p.studentId === Number(filters.studentId))
  return payments.sort((a, b) => b.id - a.id)
}

export function createPayment(data) {
  const db = getDB()
  const payment = { id: nextId('paymentId'), ...data, createdAt: getNow() }
  db.payments.push(payment)
  const student = db.students.find(s => s.id === data.studentId)
  if (student) {
    student.paymentStatus = 'paid'
    student.lastPaymentDate = data.date
  }
  save(db)
  logAudit({ userId: data.createdBy || 1, userName: data.createdByName || 'System', userRole: data.createdByRole || 'admin', action: `${data.amount?.toLocaleString()} so'm to'lov qabul qilindi`, details: `O'quvchi: ${data.studentName || 'N/A'}, To'lov turi: ${data.method}`, type: 'payment', groupId: data.groupId })
  createNotification({ title: 'To\'lov qilindi', message: `${data.studentName || 'N/A'} - ${data.amount?.toLocaleString()} so'm`, type: 'success' })
  return payment
}

export function updatePayment(id, data) {
  const db = getDB()
  const p = db.payments.find(pay => pay.id === id)
  if (!p) return null
  Object.assign(p, data)
  save(db)
  return p
}

export function deletePayment(id) {
  const db = getDB()
  const idx = db.payments.findIndex(p => p.id === id)
  if (idx === -1) return false
  db.payments.splice(idx, 1)
  save(db)
  return true
}

// ───── Payment Transactions (Online) ─────
export function createPaymentTransaction(data) {
  const db = getDB()
  const tx = { id: nextId('paymentTxId'), ...data, createdAt: getNow(), updatedAt: getNow() }
  db.paymentTransactions.push(tx)
  save(db)
  return tx
}

export function updatePaymentTransaction(id, data) {
  const db = getDB()
  const tx = db.paymentTransactions.find(t => t.id === id)
  if (!tx) return null
  Object.assign(tx, data, { updatedAt: getNow() })
  save(db)
  return tx
}

export function getPaymentTransactions(filters = {}) {
  const db = getDB()
  let list = [...db.paymentTransactions]
  if (filters.studentId) list = list.filter(t => t.studentId === Number(filters.studentId))
  if (filters.status) list = list.filter(t => t.status === filters.status)
  if (filters.provider) list = list.filter(t => t.provider === filters.provider)
  return list.sort((a, b) => b.id - a.id)
}

export function getPaymentTransactionByInvoice(invoiceId) {
  return getDB().paymentTransactions.find(t => t.invoiceId === invoiceId)
}

export function getPaymentTransactionByOrder(orderId) {
  return getDB().paymentTransactions.find(t => t.orderId === String(orderId))
}

export function getPaymentProviderConfig() {
  return getDB().settings.paymentProviders || {}
}

export function updatePaymentProviderConfig(config) {
  const db = getDB()
  db.settings.paymentProviders = { ...db.settings.paymentProviders, ...config }
  save(db)
  return db.settings.paymentProviders
}

// ───── Expenses ─────
export function getExpenses(filters = {}) {
  const db = getDB()
  let expenses = [...db.expenses]
  if (filters.startDate) expenses = expenses.filter(e => e.date >= filters.startDate)
  if (filters.endDate) expenses = expenses.filter(e => e.date <= filters.endDate)
  if (filters.category) expenses = expenses.filter(e => e.category === filters.category)
  return expenses.sort((a, b) => b.id - a.id)
}

export function createExpense(data) {
  const db = getDB()
  const expense = { id: nextId('expenseId'), ...data, createdAt: getNow() }
  db.expenses.push(expense)
  save(db)
  logAudit({ userId: data.createdBy || 1, userName: data.createdByName || 'System', userRole: data.createdByRole || 'admin', action: `${data.amount?.toLocaleString()} so'm xarajat kiritildi`, details: `Kategoriya: ${data.category}, Izoh: ${data.description || '-'}`, type: 'expense' })
  return expense
}

export function deleteExpense(id) {
  const db = getDB()
  const idx = db.expenses.findIndex(e => e.id === id)
  if (idx === -1) return false
  db.expenses.splice(idx, 1)
  save(db)
  return true
}

// ───── Attendance ─────
export function markAttendance(data) {
  const db = getDB()
  const existing = db.attendance.find(a => a.studentId === data.studentId && a.date === data.date)
  if (existing) {
    existing.status = data.status
    existing.note = data.note || existing.note
    existing.markedBy = data.markedBy
    existing.markedAt = getNow()
  } else {
    db.attendance.push({ id: nextId('attendanceId'), ...data, markedAt: getNow() })
  }
  save(db)

  const student = db.students.find(s => s.id === data.studentId)
  if (student) {
    const absences = db.attendance.filter(a => a.studentId === data.studentId && (a.status === 'absent' || a.status === 'late'))
    if (absences.length >= 3) {
      student.riskGroup = true
      save(db)
      createNotification({ title: 'Risk Group', message: `${student.name} 3 marta kelmadi!`, type: 'warning' })
    }
  }

  logAudit({ userId: data.markedBy || 1, userName: data.markedByName || 'System', userRole: data.markedByRole || 'teacher', action: `Davomat qilindi: ${data.status === 'present' ? 'Keldi' : data.status === 'absent' ? 'Kelmadi' : 'Kechikdi'}`, details: `O'quvchi: ${data.studentName || 'N/A'}`, type: 'attendance', groupId: data.groupId })
  return existing || { id: db.counters.attendanceId - 1, ...data }
}

export function getAttendance(filters = {}) {
  const db = getDB()
  let attendance = [...db.attendance]
  if (filters.date) attendance = attendance.filter(a => a.date === filters.date)
  if (filters.groupId) {
    const studentIds = db.students.filter(s => s.groupId === Number(filters.groupId)).map(s => s.id)
    attendance = attendance.filter(a => studentIds.includes(a.studentId))
  }
  if (filters.studentId) attendance = attendance.filter(a => a.studentId === Number(filters.studentId))
  return attendance
}

// ───── Audit Logs ─────
export function getAuditLogs(filters = {}) {
  const db = getDB()
  let logs = [...db.auditLogs]
  if (filters.startDate) logs = logs.filter(l => l.createdAt >= filters.startDate)
  if (filters.endDate) logs = logs.filter(l => l.createdAt <= filters.endDate)
  if (filters.userId) logs = logs.filter(l => l.userId === Number(filters.userId))
  if (filters.type) logs = logs.filter(l => l.type === filters.type)
  if (filters.groupId) logs = logs.filter(l => l.groupId === Number(filters.groupId))
  return logs.sort((a, b) => b.id - a.id).slice(0, 500)
}

// ───── Reports ─────
export function getReports(filters = {}) {
  const db = getDB()
  const now = new Date()
  const year = filters.year ? Number(filters.year) : now.getFullYear()
  const result = []

  for (let m = 0; m < 12; m++) {
    const monthlyPayments = db.payments.filter(p => { const d = new Date(p.date); return d.getMonth() === m && d.getFullYear() === year })
    const monthlyExpenses = db.expenses.filter(e => { const d = new Date(e.date); return d.getMonth() === m && d.getFullYear() === year })
    const revenue = monthlyPayments.reduce((s, p) => s + p.amount, 0)
    const expense = monthlyExpenses.reduce((s, e) => s + e.amount, 0)

    result.push({
      month: m + 1,
      monthName: ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'][m],
      revenue, expense, profit: revenue - expense,
      paymentsCount: monthlyPayments.length,
      expensesCount: monthlyExpenses.length,
    })
  }
  return result
}

export function resetDB() {
  const data = defaultData()
  write(data)
  return data
}

// ───── Homework ─────
export function getHomework(filters = {}) {
  const db = getDB()
  let list = [...db.homework]
  if (filters.groupId) list = list.filter(h => h.groupId === Number(filters.groupId))
  if (filters.studentId) {
    const student = db.students.find(s => s.id === Number(filters.studentId))
    if (student) list = list.filter(h => h.groupId === student.groupId)
  }
  return list.sort((a, b) => b.id - a.id)
}

export function createHomework(data) {
  const db = getDB()
  const hw = { id: nextId('homeworkId'), ...data, createdAt: getNow(), updatedAt: getNow() }
  db.homework.push(hw)
  save(db)
  const group = db.groups.find(g => g.id === hw.groupId)
  if (group) {
    for (const sid of (group.studentIds || [])) {
      const student = db.students.find(s => s.id === sid)
      if (student) {
        for (const pid of (student.parentIds || [])) {
          createNotification({ userId: pid, title: 'Yangi uy vazifasi', message: `${student.name} uchun yangi uy vazifasi: ${hw.title}`, type: 'homework' })
        }
      }
    }
  }
  return hw
}

export function updateHomework(id, data) {
  const db = getDB()
  const hw = db.homework.find(h => h.id === id)
  if (!hw) return null
  Object.assign(hw, data, { updatedAt: getNow() })
  save(db)
  return hw
}

export function deleteHomework(id) {
  const db = getDB()
  const idx = db.homework.findIndex(h => h.id === id)
  if (idx === -1) return false
  db.homework.splice(idx, 1)
  save(db)
  return true
}

// ───── Grades ─────
export function getGrades(filters = {}) {
  const db = getDB()
  let list = [...db.grades]
  if (filters.studentId) list = list.filter(g => g.studentId === Number(filters.studentId))
  if (filters.groupId) list = list.filter(g => g.groupId === Number(filters.groupId))
  if (filters.subject) list = list.filter(g => g.subject === filters.subject)
  return list.sort((a, b) => b.id - a.id)
}

export function createGrade(data) {
  const db = getDB()
  const grade = { id: nextId('gradeId'), ...data, createdAt: getNow() }
  db.grades.push(grade)
  save(db)
  return grade
}

export function getGradeStats(studentId) {
  const db = getDB()
  const grades = db.grades.filter(g => g.studentId === studentId)
  const subjects = {}
  for (const g of grades) {
    if (!subjects[g.subject]) subjects[g.subject] = []
    subjects[g.subject].push(g.grade || g.score)
  }
  const result = []
  for (const [subject, scores] of Object.entries(subjects)) {
    const total = scores.reduce((s, v) => s + v, 0)
    result.push({ subject, count: scores.length, average: Math.round((total / scores.length) * 10) / 10, scores })
  }
  return result
}

// ───── Schedule ─────
export function getSchedule(filters = {}) {
  const db = getDB()
  let list = [...db.schedule]
  if (filters.groupId) list = list.filter(s => s.groupId === Number(filters.groupId))
  if (filters.day) list = list.filter(s => s.day === filters.day)
  return list.sort((a, b) => a.timeStart.localeCompare(b.timeStart))
}

export function createSchedule(data) {
  const db = getDB()
  const s = { id: nextId('scheduleId'), ...data, createdAt: getNow() }
  db.schedule.push(s)
  save(db)
  return s
}

export function updateSchedule(id, data) {
  const db = getDB()
  const s = db.schedule.find(sch => sch.id === id)
  if (!s) return null
  Object.assign(s, data)
  save(db)
  return s
}

export function deleteSchedule(id) {
  const db = getDB()
  const idx = db.schedule.findIndex(s => s.id === id)
  if (idx === -1) return false
  db.schedule.splice(idx, 1)
  save(db)
  return true
}

// ───── Messages (Chat) ─────
export function sendMessage(data) {
  const db = getDB()
  const msg = { id: nextId('messageId'), ...data, createdAt: getNow(), read: false }
  db.messages.push(msg)
  save(db)
  return msg
}

export function getMessages(filters = {}) {
  const db = getDB()
  let list = [...db.messages]
  if (filters.parentId && filters.teacherId) {
    list = list.filter(m =>
      (m.senderId === Number(filters.parentId) && m.receiverId === Number(filters.teacherId)) ||
      (m.senderId === Number(filters.teacherId) && m.receiverId === Number(filters.parentId))
    )
  }
  if (filters.studentId) {
    list = list.filter(m => m.studentId === Number(filters.studentId))
  }
  return list.sort((a, b) => a.id - b.id)
}

export function markMessagesRead(userId, otherId) {
  const db = getDB()
  for (const m of db.messages) {
    if (m.receiverId === userId && m.senderId === otherId) m.read = true
  }
  save(db)
}

// ───── Library ─────
export function getBooks(filters = {}) {
  const db = getDB()
  let list = [...db.library]
  if (filters.search) {
    const q = filters.search.toLowerCase()
    list = list.filter(b => b.title?.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q))
  }
  if (filters.category) list = list.filter(b => b.category === filters.category)
  return list
}

export function createBook(data) {
  const db = getDB()
  const book = { id: nextId('bookId'), ...data, createdAt: getNow() }
  db.library.push(book)
  save(db)
  return book
}

export function deleteBook(id) {
  const db = getDB()
  const idx = db.library.findIndex(b => b.id === id)
  if (idx === -1) return false
  db.library.splice(idx, 1)
  save(db)
  return true
}

// ───── Exams ─────
export function getExams(filters = {}) {
  const db = getDB()
  let list = [...db.exams]
  if (filters.groupId) list = list.filter(e => e.groupId === Number(filters.groupId))
  if (filters.studentId) {
    const student = db.students.find(s => s.id === Number(filters.studentId))
    if (student) list = list.filter(e => e.groupId === student.groupId)
  }
  return list.sort((a, b) => b.id - a.id)
}

export function createExam(data) {
  const db = getDB()
  const exam = { id: nextId('examId'), ...data, createdAt: getNow() }
  db.exams.push(exam)
  save(db)
  return exam
}

export function submitExamResult(data) {
  const db = getDB()
  const exam = db.exams.find(e => e.id === data.examId)
  if (!exam) return null
  let correct = 0
  const answers = data.answers || []
  const questions = exam.questions || []
  for (let i = 0; i < questions.length; i++) {
    if (answers[i] === questions[i].correctAnswer) correct++
  }
  const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0
  const result = {
    id: nextId('examResultId'),
    examId: data.examId,
    studentId: data.studentId,
    examTitle: exam.title,
    score,
    correct,
    total: questions.length,
    answers,
    submittedAt: getNow(),
  }
  db.examResults.push(result)
  save(db)
  return result
}

export function getExamResults(filters = {}) {
  const db = getDB()
  let list = [...db.examResults]
  if (filters.studentId) list = list.filter(r => r.studentId === Number(filters.studentId))
  if (filters.examId) list = list.filter(r => r.examId === Number(filters.examId))
  return list.sort((a, b) => b.id - a.id)
}

// ───── Certificates ─────
export function createCertificate(data) {
  const db = getDB()
  const cert = { id: nextId('certificateId'), ...data, issuedAt: getNow() }
  db.certificates.push(cert)
  save(db)
  return cert
}

export function getCertificates(filters = {}) {
  const db = getDB()
  let list = [...db.certificates]
  if (filters.studentId) list = list.filter(c => c.studentId === Number(filters.studentId))
  return list.sort((a, b) => b.id - a.id)
}

// ───── QR Attendance ─────
export function generateQRCode(data) {
  const db = getDB()
  const code = { id: nextId('qrId'), ...data, code: Math.random().toString(36).substring(2, 10).toUpperCase(), active: true, createdAt: getNow() }
  db.qrCodes.push(code)
  save(db)
  return code
}

export function verifyQRCode(code) {
  const db = getDB()
  const qr = db.qrCodes.find(q => q.code === code && q.active)
  if (!qr) return null
  qr.active = false
  save(db)
  return qr
}

// ───── Parent Dashboard ─────
export function getParentChildren(parentId) {
  const db = getDB()
  const parent = db.users.find(u => u.id === parentId && u.role === 'parent')
  if (!parent) return []
  const children = db.students.filter(s => (s.parentIds || []).includes(parentId))
  return children.map(s => {
    const group = db.groups.find(g => g.id === s.groupId)
    const today = getToday()
    const att = db.attendance.find(a => a.studentId === s.id && a.date === today)
    const monthlyAtt = db.attendance.filter(a => a.studentId === s.id && a.date.startsWith(today.substring(0, 7)))
    const present = monthlyAtt.filter(a => a.status === 'present').length
    const total = monthlyAtt.length || 1
    const debts = db.payments.filter(p => p.studentId === s.id)
    const totalPaid = debts.reduce((sum, p) => sum + p.amount, 0)
    return {
      ...s,
      groupName: group?.name || 'N/A',
      teacherName: group ? db.users.find(u => u.id === group.teacherId)?.name || 'N/A' : 'N/A',
      todayStatus: att?.status || null,
      attendancePercent: Math.round((present / total) * 100),
      totalPaid,
      paymentHistory: debts.slice(-10).reverse(),
    }
  })
}

export function getParentPayments(parentId) {
  const db = getDB()
  const children = db.students.filter(s => (s.parentIds || []).includes(parentId))
  const studentIds = children.map(s => s.id)
  return db.payments.filter(p => studentIds.includes(p.studentId)).sort((a, b) => b.id - a.id)
}

// ───── Student Portal ─────
export function getStudentPortalData(studentId) {
  const db = getDB()
  const student = db.students.find(s => s.id === studentId)
  if (!student) return null
  const group = db.groups.find(g => g.id === student.groupId)
  const today = getToday()
  const attendance = db.attendance.filter(a => a.studentId === studentId)
  const todayAtt = attendance.find(a => a.date === today)
  const monthlyAtt = attendance.filter(a => a.date.startsWith(today.substring(0, 7)))
  const present = monthlyAtt.filter(a => a.status === 'present').length
  const grades = db.grades.filter(g => g.studentId === studentId)
  const payments = db.payments.filter(p => p.studentId === studentId)
  const schedule = db.schedule.filter(s => s.groupId === student.groupId)
  const homework = db.homework.filter(h => h.groupId === student.groupId)
  return {
    student,
    group: group || null,
    todayAttendance: todayAtt?.status || null,
    attendancePercent: monthlyAtt.length > 0 ? Math.round((present / monthlyAtt.length) * 100) : 0,
    attendanceHistory: attendance.sort((a, b) => b.id - a.id).slice(-30),
    grades: getGradeStats(studentId),
    payments: payments.sort((a, b) => b.id - a.id),
    debt: student.paymentStatus === 'debt',
    schedule: schedule.sort((a, b) => a.timeStart.localeCompare(b.timeStart)),
    homework: homework.sort((a, b) => b.id - a.id),
  }
}

// ───── Device Tracking (Super Admin) ─────
export function logDevice(data) {
  const db = getDB()
  const existing = db.devices.find(d => d.userId === data.userId)
  if (existing) {
    Object.assign(existing, data, { lastActive: getNow() })
  } else {
    db.devices.push({ id: nextId('deviceId'), ...data, firstSeen: getNow(), lastActive: getNow() })
  }
  save(db)
}

export function getDevices(filters = {}) {
  const db = getDB()
  let list = [...db.devices]
  if (filters.userId) list = list.filter(d => d.userId === Number(filters.userId))
  return list.sort((a, b) => b.lastActive?.localeCompare(a.lastActive))
}

// ───── Parent Auth Login by phone ─────
export function authenticateParent(phone, password) {
  const db = getDB()
  const parent = db.users.find(u => u.phone === phone && u.role === 'parent' && u.active)
  if (!parent) return null
  if (!bcrypt.compareSync(password, parent.password)) return null
  const { password: _, ...safe } = parent
  return safe
}

export function authenticateStudent(login, password) {
  const db = getDB()
  const student = db.users.find(u => u.login === login && u.role === 'student' && u.active)
  if (!student) return null
  if (!bcrypt.compareSync(password, student.password)) return null
  const { password: _, ...safe } = student
  return safe
}

export { getDB, getToday, save }
