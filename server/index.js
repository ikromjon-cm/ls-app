import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, mkdirSync } from 'fs'
import multer from 'multer'
import { authenticate, authorize, generateToken, generateRefreshToken, verifyToken } from './middleware/auth.js'
import * as db from './db.js'
import { writeFileSync, appendFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distPath = join(__dirname, '..', 'dist')

const app = express()

// ───── Security ─────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}))
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Ko\'p so\'rov yuborildi, keyinroq urinib ko\'ring', errors: ['RATE_LIMIT'] },
}))

// ───── Request Logging ─────
const logDir = join(__dirname, 'logs')
if (!existsSync(logDir)) mkdirSync(logDir)
const accessLogStream = (() => {
  const date = new Date().toISOString().split('T')[0]
  const path = join(logDir, `access-${date}.log`)
  return {
    write: (msg) => { appendFileSync(path, msg, 'utf8') }
  }
})()
app.use(morgan('combined', { stream: accessLogStream }))
app.use(morgan('dev'))

// ───── Body Parsing ─────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(compression())

// ───── Static ─────
app.use('/uploads', express.static(join(__dirname, 'uploads')))

// ───── Upload ─────
const upload = multer({
  dest: join(__dirname, 'uploads'),
  limits: { fileSize: 10 * 1024 * 1024 },
})

// ───── Response Helper ─────
function ok(res, data, message = 'OK') {
  return res.json({ success: true, message, data, errors: [] })
}
function created(res, data, message = 'Created') {
  return res.status(201).json({ success: true, message, data, errors: [] })
}
function fail(res, status, message, errors = []) {
  return res.status(status).json({ success: false, message, data: null, errors: Array.isArray(errors) ? errors : [errors] })
}

// ───── Async Wrapper ─────
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
}

db.initDB?.()

// ───── Health Check (no auth) ─────
app.get('/api/health', (_, res) => res.json({ success: true, message: 'OK', data: { status: 'healthy', uptime: process.uptime() }, errors: [] }))
app.get('/health', (_, res) => res.json({ success: true, message: 'OK', data: { status: 'healthy', uptime: process.uptime() }, errors: [] }))

// ───── Auth Routes ─────
app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const { login, password } = req.body
  if (!login || !password) return fail(res, 400, 'Login va parol talab qilinadi', ['VALIDATION'])
  if (typeof login !== 'string' || typeof password !== 'string') return fail(res, 400, 'Noto\'g\'ri format', ['VALIDATION'])
  const user = db.authenticate(login, password)
  if (!user) return fail(res, 401, 'Login yoki parol xato', ['AUTH'])
  const token = generateToken(user)
  const refreshToken = generateRefreshToken(user)
  db.logAudit({ userId: user.id, userName: user.name, userRole: user.role, action: 'Tizimga kirdi', details: '', type: 'auth', ip: req.ip })
  db.logDevice({ userId: user.id, userName: user.name, userRole: user.role, device: req.headers['user-agent'] || '', ip: req.ip, platform: req.headers['sec-ch-ua-platform'] || '' })
  ok(res, { user, token, refreshToken }, 'Tizimga muvaffaqiyatli kirdingiz')
}))

app.post('/api/auth/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken) return fail(res, 400, 'Refresh token talab qilinadi', ['VALIDATION'])
  const decoded = verifyToken(refreshToken)
  if (!decoded || decoded.type !== 'refresh') return fail(res, 401, 'Yaroqsiz refresh token', ['AUTH'])
  const user = db.getUser(decoded.id)
  if (!user) return fail(res, 404, 'Foydalanuvchi topilmadi', ['NOT_FOUND'])
  const token = generateToken(user)
  const newRefreshToken = generateRefreshToken(user)
  ok(res, { user, token, refreshToken: newRefreshToken }, 'Token yangilandi')
}))

// ───── Protected API Routes ─────
app.use('/api', authenticate)

// ───── Users ─────
app.get('/api/users', authorize('superadmin', 'admin'), asyncHandler((req, res) => {
  const users = db.getUsers(req.query.role)
  if (req.user.role === 'admin') return ok(res, users.filter(u => u.role !== 'superadmin'))
  ok(res, users)
}))

app.post('/api/users', authorize('superadmin', 'admin'), asyncHandler((req, res) => {
  if (req.user.role === 'admin' && req.body.role !== 'teacher') return fail(res, 403, 'Admin faqat o\'qituvchi yarata oladi', ['FORBIDDEN'])
  const user = db.createUser({ ...req.body, createdBy: req.user.id, createdByName: req.user.name })
  if (!user) return fail(res, 409, 'Bunday login mavjud', ['CONFLICT'])
  created(res, user, 'Foydalanuvchi yaratildi')
}))

app.put('/api/users/:id', authorize('superadmin', 'admin'), asyncHandler((req, res) => {
  if (req.user.role === 'admin') delete req.body.role
  const user = db.updateUser(Number(req.params.id), { ...req.body, updatedBy: req.user.id, updatedByName: req.user.name })
  if (!user) return fail(res, 404, 'Foydalanuvchi topilmadi', ['NOT_FOUND'])
  ok(res, user, 'Foydalanuvchi yangilandi')
}))

app.delete('/api/users/:id', authorize('superadmin'), asyncHandler((req, res) => {
  if (!db.deleteUser(Number(req.params.id))) return fail(res, 404, 'Foydalanuvchi topilmadi', ['NOT_FOUND'])
  ok(res, null, 'Foydalanuvchi o\'chirildi')
}))

// ───── Dashboard ─────
app.get('/api/dashboard', asyncHandler((req, res) => ok(res, db.getDashboardStats())))

// ───── Groups ─────
app.get('/api/groups', asyncHandler((req, res) => ok(res, db.getGroups(req.user))))
app.post('/api/groups', authorize('superadmin', 'admin'), asyncHandler((req, res) => {
  if (!req.body.name) return fail(res, 400, 'Guruh nomi talab qilinadi', ['VALIDATION'])
  const g = db.createGroup({ ...req.body, createdBy: req.user.id, createdByName: req.user.name, createdByRole: req.user.role })
  created(res, g, 'Guruh yaratildi')
}))
app.put('/api/groups/:id', authorize('superadmin', 'admin'), asyncHandler((req, res) => {
  const g = db.updateGroup(Number(req.params.id), { ...req.body, updatedBy: req.user.id, updatedByName: req.user.name, updatedByRole: req.user.role })
  if (!g) return fail(res, 404, 'Guruh topilmadi', ['NOT_FOUND'])
  ok(res, g, 'Guruh yangilandi')
}))
app.delete('/api/groups/:id', authorize('superadmin', 'admin'), asyncHandler((req, res) => {
  if (!db.deleteGroup(Number(req.params.id))) return fail(res, 404, 'Guruh topilmadi', ['NOT_FOUND'])
  ok(res, null, 'Guruh o\'chirildi')
}))

// ───── Students ─────
app.get('/api/students', asyncHandler((req, res) => {
  if (req.user.role === 'teacher') {
    const teacher = db.getUser(req.user.id)
    if (!teacher) return ok(res, [])
    return ok(res, db.getStudents({ groupId: req.query.groupId }).filter(s => teacher.groupIds?.includes(s.groupId)))
  }
  ok(res, db.getStudents(req.query))
}))

app.post('/api/students', authorize('superadmin', 'admin'), upload.single('avatar'), asyncHandler((req, res) => {
  if (!req.body.name) return fail(res, 400, 'O\'quvchi ismi talab qilinadi', ['VALIDATION'])
  const data = req.body
  if (data.groupId) data.groupId = Number(data.groupId)
  if (req.file) data.avatar = `/uploads/${req.file.filename}`
  const s = db.createStudent({ ...data, createdBy: req.user.id, createdByName: req.user.name, createdByRole: req.user.role })
  created(res, s, 'O\'quvchi qo\'shildi')
}))

app.put('/api/students/:id', authorize('superadmin', 'admin'), upload.single('avatar'), asyncHandler((req, res) => {
  const data = req.body
  if (data.groupId) data.groupId = Number(data.groupId)
  if (req.file) data.avatar = `/uploads/${req.file.filename}`
  const s = db.updateStudent(Number(req.params.id), data)
  if (!s) return fail(res, 404, 'O\'quvchi topilmadi', ['NOT_FOUND'])
  ok(res, s, 'O\'quvchi yangilandi')
}))

app.delete('/api/students/:id', authorize('superadmin', 'admin'), asyncHandler((req, res) => {
  if (!db.deleteStudent(Number(req.params.id))) return fail(res, 404, 'O\'quvchi topilmadi', ['NOT_FOUND'])
  ok(res, null, 'O\'quvchi o\'chirildi')
}))

// ───── Payments ─────
app.get('/api/payments', asyncHandler((req, res) => ok(res, db.getPayments(req.query))))
app.post('/api/payments', authorize('superadmin', 'admin'), asyncHandler((req, res) => {
  if (!req.body.studentId || !req.body.amount) return fail(res, 400, 'Student ID va summa talab qilinadi', ['VALIDATION'])
  const p = db.createPayment({ ...req.body, createdBy: req.user.id, createdByName: req.user.name, createdByRole: req.user.role })
  created(res, p, 'To\'lov qayd etildi')
}))

// ───── Expenses ─────
app.get('/api/expenses', asyncHandler((req, res) => ok(res, db.getExpenses(req.query))))
app.post('/api/expenses', authorize('superadmin', 'admin'), asyncHandler((req, res) => {
  if (!req.body.amount || !req.body.description) return fail(res, 400, 'Summa va izoh talab qilinadi', ['VALIDATION'])
  const e = db.createExpense({ ...req.body, createdBy: req.user.id, createdByName: req.user.name, createdByRole: req.user.role })
  created(res, e, 'Xarajat qayd etildi')
}))
app.delete('/api/expenses/:id', authorize('superadmin', 'admin'), asyncHandler((req, res) => {
  if (!db.deleteExpense(Number(req.params.id))) return fail(res, 404, 'Xarajat topilmadi', ['NOT_FOUND'])
  ok(res, null, 'Xarajat o\'chirildi')
}))

// ───── Attendance ─────
app.post('/api/attendance', authorize('superadmin', 'admin', 'teacher'), asyncHandler((req, res) => {
  if (!req.body.studentId || !req.body.date) return fail(res, 400, 'Student ID va sana talab qilinadi', ['VALIDATION'])
  const a = db.markAttendance({ ...req.body, markedBy: req.user.id, markedByName: req.user.name, markedByRole: req.user.role })
  ok(res, a, 'Davomat belgilandi')
}))
app.get('/api/attendance', authorize('superadmin', 'admin', 'teacher'), asyncHandler((req, res) => ok(res, db.getAttendance(req.query))))

// ───── Audit Logs ─────
app.get('/api/audit-logs', authorize('superadmin'), asyncHandler((req, res) => ok(res, db.getAuditLogs(req.query))))

// ───── Reports ─────
app.get('/api/reports', authorize('superadmin', 'admin'), asyncHandler((req, res) => ok(res, db.getReports(req.query))))

// ───── Notifications ─────
app.get('/api/notifications', asyncHandler((req, res) => ok(res, db.getNotifications(req.user.id))))
app.put('/api/notifications/:id/read', asyncHandler((req, res) => {
  db.markNotificationRead(Number(req.params.id))
  ok(res, null, 'Xabarnoma o\'qildi')
}))

// ───── Teachers ─────
app.get('/api/teachers', authorize('superadmin', 'admin'), asyncHandler((req, res) => ok(res, db.getUsers('teacher'))))

// ───── Reset Database ─────
app.post('/api/reset', authorize('superadmin'), asyncHandler((req, res) => {
  const data = db.resetDB()
  db.logAudit({ userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: 'Ma\'lumotlar bazasini tozaladi', details: 'Barcha ma\'lumotlar o\'chirildi', type: 'system', ip: req.ip })
  ok(res, { users: data.users.length }, 'Ma\'lumotlar tozalandi')
}))

// ───── Settings ─────
app.get('/api/settings', authorize('superadmin'), asyncHandler((req, res) => {
  const d = db.getDB()
  ok(res, d.settings)
}))
app.put('/api/settings', authorize('superadmin'), asyncHandler((req, res) => {
  const d = db.getDB()
  d.settings = { ...d.settings, ...req.body }
  db.save(d)
  ok(res, d.settings, 'Sozlamalar saqlandi')
}))

// ───── Homework ─────
app.get('/api/homework', asyncHandler((req, res) => ok(res, db.getHomework(req.query))))
app.post('/api/homework', authorize('superadmin', 'admin', 'teacher'), upload.array('files'), asyncHandler((req, res) => {
  const data = req.body
  if (req.files?.length) data.files = req.files.map(f => `/uploads/${f.filename}`)
  const hw = db.createHomework({ ...data, createdBy: req.user.id, createdByName: req.user.name })
  created(res, hw, 'Topshiriq yaratildi')
}))
app.put('/api/homework/:id', authorize('superadmin', 'admin', 'teacher'), asyncHandler((req, res) => {
  const hw = db.updateHomework(Number(req.params.id), req.body)
  if (!hw) return fail(res, 404, 'Topshiriq topilmadi', ['NOT_FOUND'])
  ok(res, hw, 'Topshiriq yangilandi')
}))
app.delete('/api/homework/:id', authorize('superadmin', 'admin', 'teacher'), asyncHandler((req, res) => {
  if (!db.deleteHomework(Number(req.params.id))) return fail(res, 404, 'Topshiriq topilmadi', ['NOT_FOUND'])
  ok(res, null, 'Topshiriq o\'chirildi')
}))

// ───── Grades ─────
app.get('/api/grades', asyncHandler((req, res) => ok(res, db.getGrades(req.query))))
app.post('/api/grades', authorize('superadmin', 'admin', 'teacher'), asyncHandler((req, res) => {
  if (!req.body.studentId || !req.body.subject) return fail(res, 400, 'Student ID va fan talab qilinadi', ['VALIDATION'])
  const g = db.createGrade({ ...req.body, createdBy: req.user.id })
  created(res, g, 'Baho qo\'yildi')
}))
app.get('/api/grades/stats/:studentId', asyncHandler((req, res) => ok(res, db.getGradeStats(Number(req.params.studentId)))))

// ───── Schedule ─────
app.get('/api/schedule', asyncHandler((req, res) => ok(res, db.getSchedule(req.query))))
app.post('/api/schedule', authorize('superadmin', 'admin'), asyncHandler((req, res) => {
  const s = db.createSchedule({ ...req.body, createdBy: req.user.id })
  created(res, s, 'Dars jadvalga qo\'shildi')
}))
app.put('/api/schedule/:id', authorize('superadmin', 'admin'), asyncHandler((req, res) => {
  const s = db.updateSchedule(Number(req.params.id), req.body)
  if (!s) return fail(res, 404, 'Jadval topilmadi', ['NOT_FOUND'])
  ok(res, s, 'Jadval yangilandi')
}))
app.delete('/api/schedule/:id', authorize('superadmin', 'admin'), asyncHandler((req, res) => {
  if (!db.deleteSchedule(Number(req.params.id))) return fail(res, 404, 'Jadval topilmadi', ['NOT_FOUND'])
  ok(res, null, 'Jadval o\'chirildi')
}))

// ───── Messages (Chat) ─────
app.get('/api/messages', asyncHandler((req, res) => ok(res, db.getMessages(req.query))))
app.post('/api/messages', asyncHandler((req, res) => {
  if (!req.body.content) return fail(res, 400, 'Xabar matni talab qilinadi', ['VALIDATION'])
  const m = db.sendMessage({ ...req.body, senderId: req.user.id, senderName: req.user.name, senderRole: req.user.role })
  created(res, m, 'Xabar yuborildi')
}))
app.put('/api/messages/read', asyncHandler((req, res) => {
  db.markMessagesRead(req.user.id, req.body.otherId)
  ok(res, null, 'Xabarlar o\'qildi')
}))

// ───── Library ─────
app.get('/api/library', asyncHandler((req, res) => ok(res, db.getBooks(req.query))))
app.post('/api/library', authorize('superadmin', 'admin'), upload.single('file'), asyncHandler((req, res) => {
  const data = req.body
  if (req.file) data.fileUrl = `/uploads/${req.file.filename}`
  const b = db.createBook({ ...data, createdBy: req.user.id })
  created(res, b, 'Kitob qo\'shildi')
}))
app.delete('/api/library/:id', authorize('superadmin', 'admin'), asyncHandler((req, res) => {
  if (!db.deleteBook(Number(req.params.id))) return fail(res, 404, 'Kitob topilmadi', ['NOT_FOUND'])
  ok(res, null, 'Kitob o\'chirildi')
}))

// ───── Exams ─────
app.get('/api/exams', asyncHandler((req, res) => ok(res, db.getExams(req.query))))
app.post('/api/exams', authorize('superadmin', 'admin', 'teacher'), asyncHandler((req, res) => {
  const e = db.createExam({ ...req.body, createdBy: req.user.id })
  created(res, e, 'Imtihon yaratildi')
}))
app.post('/api/exams/submit', asyncHandler((req, res) => {
  const r = db.submitExamResult({ ...req.body, studentId: req.user.studentId || req.body.studentId })
  if (!r) return fail(res, 404, 'Imtihon topilmadi', ['NOT_FOUND'])
  ok(res, r, 'Natija saqlandi')
}))
app.get('/api/exam-results', asyncHandler((req, res) => ok(res, db.getExamResults(req.query))))

// ───── Certificates ─────
app.get('/api/certificates', asyncHandler((req, res) => ok(res, db.getCertificates(req.query))))
app.post('/api/certificates', authorize('superadmin', 'admin'), asyncHandler((req, res) => {
  const c = db.createCertificate({ ...req.body, issuedBy: req.user.id, issuedByName: req.user.name })
  created(res, c, 'Sertifikat yaratildi')
}))

// ───── QR Attendance ─────
app.post('/api/qr/generate', authorize('superadmin', 'admin', 'teacher'), asyncHandler((req, res) => {
  const qr = db.generateQRCode({ ...req.body, createdBy: req.user.id })
  ok(res, qr, 'QR kod yaratildi')
}))
app.post('/api/qr/verify', asyncHandler((req, res) => {
  if (!req.body.code) return fail(res, 400, 'QR kod talab qilinadi', ['VALIDATION'])
  const result = db.verifyQRCode(req.body.code)
  if (!result) return fail(res, 404, 'Yaroqsiz yoki muddati o\'tgan QR kod', ['QR_INVALID'])
  ok(res, result, 'QR kod tasdiqlandi')
}))

// ───── Parent Portal ─────
app.get('/api/parent/children', asyncHandler((req, res) => {
  if (req.user.role !== 'parent') return fail(res, 403, 'Faqat ota-onalar uchun', ['FORBIDDEN'])
  ok(res, db.getParentChildren(req.user.id))
}))
app.get('/api/parent/payments', asyncHandler((req, res) => {
  if (req.user.role !== 'parent') return fail(res, 403, 'Faqat ota-onalar uchun', ['FORBIDDEN'])
  ok(res, db.getParentPayments(req.user.id))
}))

// ───── Student Portal ─────
app.get('/api/student/portal', asyncHandler((req, res) => {
  if (req.user.role !== 'student') return fail(res, 403, 'Faqat o\'quvchilar uchun', ['FORBIDDEN'])
  const student = db.students.find(s => s.studentUserId === req.user.id)
  if (!student) return fail(res, 404, 'O\'quvchi topilmadi', ['NOT_FOUND'])
  ok(res, db.getStudentPortalData(student.id))
}))

// ───── Devices (Super Admin) ─────
app.get('/api/devices', authorize('superadmin'), asyncHandler((req, res) => ok(res, db.getDevices(req.query))))

// ───── Serve Frontend ─────
if (existsSync(distPath)) {
  app.use(express.static(distPath, { maxAge: '7d', etag: true, lastModified: true }))
  app.get('*', (_, res) => res.sendFile(join(distPath, 'index.html')))
}

// ───── 404 Handler ─────
app.use((_, res) => {
  res.status(404).json({ success: false, message: 'API endpoint topilmadi', data: null, errors: ['NOT_FOUND'] })
})

// ───── Global Error Handler ─────
app.use((err, _, res, __) => {
  console.error('[ERROR]', err.message || err)
  const status = err.status || 500
  const message = err.message || 'Serverda xatolik yuz berdi'
  if (status === 500) {
    try {
      const logDir2 = join(__dirname, 'logs')
      if (!existsSync(logDir2)) mkdirSync(logDir2)
      const date = new Date().toISOString().split('T')[0]
      appendFileSync(join(logDir2, `error-${date}.log`), `[${new Date().toISOString()}] ${err.stack || err}\n`, 'utf8')
    } catch {}
  }
  res.status(status).json({ success: false, message, data: null, errors: ['SERVER_ERROR'] })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`✓ Server running on port ${PORT}`))
