import express from 'express'
import { createServer } from 'http'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import { rateLimit } from 'express-rate-limit'
import { existsSync, mkdirSync, appendFileSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yaml'
import env from './config/env.js'
import prisma from './config/database.js'
import redis from './config/redis.js'
import { setupSocketIO } from './config/socket.js'
import { authenticate, authorize, checkOrganization, sanitizeInput, asyncHandler } from './shared/middleware/index.js'
import {
  hashPassword, comparePassword, generateAccessToken, generateRefreshToken,
  verifyRefreshToken, createSession, invalidateSession,
  generateOTP, sendOTP, storeOTP, verifyOTP,
  generate2FASecret, verify2FAToken, generate2FAQrCode, checkRateLimit,
} from './core/auth/auth.service.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distPath = join(__dirname, '..', '..', 'dist')
const logDir = join(__dirname, '..', 'logs')

const app = express()
const httpServer = createServer(app)

// ───── Socket.io ─────
setupSocketIO(httpServer)

// ───── Security ─────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }))
app.use(cors({ origin: env.CORS_ORIGIN, methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-Id'], credentials: true }))
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 1000, standardHeaders: true, legacyHeaders: false, message: { success: false, message: "Ko'p so'rov yuborildi", errors: ['RATE_LIMIT'] } }))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(compression())
app.use(sanitizeInput)
app.use(checkOrganization)

// ───── Logging ─────
if (!existsSync(logDir)) mkdirSync(logDir)
const logStream = { write: (msg) => { const d = new Date().toISOString().split('T')[0]; appendFileSync(join(logDir, `access-${d}.log`), msg, 'utf8') } }
app.use(morgan('combined', { stream: logStream }))
app.use(morgan('dev'))

// ───── Helpers ─────
function ok(res, data, message = 'OK') { return res.json({ success: true, message, data, errors: [] }) }
function created(res, data, message = 'Created') { return res.status(201).json({ success: true, message, data, errors: [] }) }
function fail(res, status, message, errors = []) { return res.status(status).json({ success: false, message, data: null, errors: Array.isArray(errors) ? errors : [errors] }) }

// ═══════════════════════════════════════════
// HEALTH
// ═══════════════════════════════════════════

app.get('/api/health', async (_, res) => {
  const dbHealthy = await prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false)
  const redisHealthy = await redis.ping().then(() => true).catch(() => false)
  ok(res, { status: 'healthy', uptime: process.uptime(), database: dbHealthy ? 'healthy' : 'unhealthy', redis: redisHealthy ? 'healthy' : 'unhealthy' })
})
app.get('/health', (_, res) => ok(res, { status: 'healthy', uptime: process.uptime() }))

// ───── API Docs (Swagger) ─────
try {
  const swaggerPath = join(__dirname, '..', 'docs', 'openapi.yml')
  if (existsSync(swaggerPath)) {
    const swaggerDoc = YAML.parse(readFileSync(swaggerPath, 'utf8'))
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'OpenCode CRM API Docs',
    }))
    app.get('/api/docs.json', (_, res) => res.json(swaggerDoc))
    console.log('  ✓ Swagger UI at /api/docs')
  }
} catch {}

// ═══════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════

app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const { login, password } = req.body
  if (!login || !password) return fail(res, 400, 'Login va parol talab qilinadi')

  const user = await prisma.user.findFirst({
    where: { OR: [{ login }, { email: login }, { phone: login }], active: true },
    include: { organization: true },
  })
  if (!user || !comparePassword(password, user.password)) return fail(res, 401, 'Login yoki parol xato')

  if (user.twoFactorEnabled) {
    const code = generateOTP()
    await storeOTP(`2fa:${user.id}`, code, '2fa')
    if (user.phone) await sendOTP(user.phone, code)
    return ok(res, { requires2FA: true, userId: user.id, method: user.phone ? 'sms' : 'app' }, '2FA kodi yuborildi')
  }

  const payload = { userId: user.id, organizationId: user.organizationId, role: user.role }
  const token = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)
  await createSession(user.id, token, refreshToken, req.headers['user-agent'], req.ip)

  await prisma.auditLog.create({
    data: { organizationId: user.organizationId, userId: user.id, userName: user.name, action: "Tizimga kirdi", type: 'auth', ip: req.ip },
  })

  const { password: _, ...safe } = user
  ok(res, { user: safe, token, refreshToken, organization: user.organization }, "Tizimga muvaffaqiyatli kirdingiz")
}))

app.post('/api/auth/verify-2fa', asyncHandler(async (req, res) => {
  const { userId, code } = req.body
  if (!userId || !code) return fail(res, 400, 'UserId va kod talab qilinadi')
  const valid = await verifyOTP(`2fa:${userId}`, code, '2fa')
  if (!valid) return fail(res, 401, 'Yaroqsiz kod')
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { organization: true } })
  if (!user) return fail(res, 404, 'Foydalanuvchi topilmadi')
  const payload = { userId: user.id, organizationId: user.organizationId, role: user.role }
  const token = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)
  await createSession(user.id, token, refreshToken, req.headers['user-agent'], req.ip)
  const { password: _, ...safe } = user
  ok(res, { user: safe, token, refreshToken, organization: user.organization }, 'Tasdiqlandi')
}))

app.post('/api/auth/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken) return fail(res, 400, 'Refresh token talab qilinadi')
  const payload = verifyRefreshToken(refreshToken)
  if (!payload) return fail(res, 401, 'Yaroqsiz refresh token')
  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user) return fail(res, 404, 'Foydalanuvchi topilmadi')
  const newPayload = { userId: user.id, organizationId: user.organizationId, role: user.role }
  const newToken = generateAccessToken(newPayload)
  const newRefresh = generateRefreshToken(newPayload)
  await createSession(user.id, newToken, newRefresh, req.headers['user-agent'], req.ip)
  ok(res, { token: newToken, refreshToken: newRefresh }, 'Token yangilandi')
}))

app.post('/api/auth/logout', asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.substring(7)
  if (token) await invalidateSession(token)
  ok(res, null, 'Chiqildi')
}))

app.post('/api/auth/send-otp', asyncHandler(async (req, res) => {
  const { phone } = req.body
  if (!phone) return fail(res, 400, 'Telefon raqam talab qilinadi')
  const allowed = await checkRateLimit(`otp:${phone}`, 3, 300)
  if (!allowed) return fail(res, 429, "Ko'p urunish, keyinroq urinib ko'ring")
  const code = generateOTP()
  await storeOTP(phone, code, 'login')
  await sendOTP(phone, code)
  ok(res, null, 'Kod yuborildi')
}))

app.post('/api/auth/verify-otp', asyncHandler(async (req, res) => {
  const { phone, code } = req.body
  if (!phone || !code) return fail(res, 400, 'Telefon va kod talab qilinadi')
  const valid = await verifyOTP(phone, code, 'login')
  if (!valid) return fail(res, 401, 'Yaroqsiz kod')
  const user = await prisma.user.findFirst({ where: { phone, active: true }, include: { organization: true } })
  if (!user) return fail(res, 404, 'Foydalanuvchi topilmadi')
  const payload = { userId: user.id, organizationId: user.organizationId, role: user.role }
  const token = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)
  await createSession(user.id, token, refreshToken, req.headers['user-agent'], req.ip)
  const { password: _, ...safe } = user
  ok(res, { user: safe, token, refreshToken, organization: user.organization }, 'Tasdiqlandi')
}))

app.post('/api/auth/setup-2fa', authenticate, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } })
  if (!user) return fail(res, 404, 'Foydalanuvchi topilmadi')
  const { secret, otpauthUrl } = generate2FASecret(user.email || user.login)
  const qrCode = await generate2FAQrCode(otpauthUrl)
  await prisma.user.update({ where: { id: user.id }, data: { twoFactorSecret: secret } })
  ok(res, { secret, qrCode, otpauthUrl }, '2FA sozlandi')
}))

app.post('/api/auth/enable-2fa', authenticate, asyncHandler(async (req, res) => {
  const { token } = req.body
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } })
  if (!user || !user.twoFactorSecret) return fail(res, 400, '2FA sozlanmagan')
  if (!verify2FAToken(user.twoFactorSecret, token)) return fail(res, 401, 'Yaroqsiz kod')
  await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true } })
  ok(res, null, '2FA faollashtirildi')
}))

app.post('/api/auth/disable-2fa', authenticate, asyncHandler(async (req, res) => {
  await prisma.user.update({ where: { id: req.user.userId }, data: { twoFactorEnabled: false, twoFactorSecret: null } })
  ok(res, null, "2FA o'chirildi")
}))

// ═══════════════════════════════════════════
// ORGANIZATIONS
// ═══════════════════════════════════════════

app.post('/api/organizations/register', asyncHandler(async (req, res) => {
  const { name, slug, adminName, adminEmail, adminPassword } = req.body
  if (!name || !slug || !adminName || !adminEmail || !adminPassword) return fail(res, 400, 'Barcha maydonlar talab qilinadi')
  const existing = await prisma.organization.findUnique({ where: { slug } })
  if (existing) return fail(res, 409, 'Bunday slug mavjud')
  const org = await prisma.organization.create({
    data: {
      name, slug, plan: 'starter',
      branches: { create: { name: 'Asosiy filial' } },
      courses: { create: [{ name: 'Frontend' }, { name: 'Backend' }, { name: 'IELTS' }, { name: 'Python' }, { name: 'Mobile' }, { name: 'Design' }] },
    },
  })
  const user = await prisma.user.create({
    data: { organizationId: org.id, login: adminEmail, email: adminEmail, name: adminName, password: hashPassword(adminPassword), role: 'org_admin' },
  })
  created(res, { organization: org, user: { id: user.id, name: user.name, email: user.email, role: user.role } }, 'Tashkilot yaratildi')
}))

// ═══════════════════════════════════════════
// PROTECTED ROUTES
// ═══════════════════════════════════════════

app.use('/api', authenticate)

// ───── Users ─────
app.get('/api/users', authorize('super_admin', 'org_admin', 'manager'), asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    where: { organizationId: req.user.organizationId },
    select: { id: true, login: true, name: true, role: true, email: true, phone: true, avatar: true, active: true, lastLoginAt: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
  ok(res, users)
}))

app.post('/api/users', authorize('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  const { login, name, password, role, email, phone } = req.body
  const existing = await prisma.user.findFirst({ where: { organizationId: req.user.organizationId, login } })
  if (existing) return fail(res, 409, 'Bunday login mavjud')
  const user = await prisma.user.create({
    data: { organizationId: req.user.organizationId, login, name, password: hashPassword(password), email, phone, role },
    select: { id: true, login: true, name: true, role: true, email: true, phone: true, createdAt: true },
  })
  created(res, user, 'Foydalanuvchi yaratildi')
}))

app.put('/api/users/:id', authorize('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  const data = { ...req.body }
  if (data.password) data.password = hashPassword(data.password)
  const user = await prisma.user.update({ where: { id: req.params.id }, data })
  const { password: _, ...safe } = user
  ok(res, safe, 'Foydalanuvchi yangilandi')
}))

app.delete('/api/users/:id', authorize('super_admin'), asyncHandler(async (req, res) => {
  await prisma.user.delete({ where: { id: req.params.id } })
  ok(res, null, "Foydalanuvchi o'chirildi")
}))

// ───── Dashboard ─────
app.get('/api/dashboard', asyncHandler(async (req, res) => {
  const orgId = req.user.organizationId
  const now = new Date()
  const [totalStudents, totalGroups, totalTeachers, payments, expenses, attendance] = await Promise.all([
    prisma.student.count({ where: { organizationId: orgId } }),
    prisma.group.count({ where: { organizationId: orgId } }),
    prisma.user.count({ where: { organizationId: orgId, role: 'teacher' } }),
    prisma.payment.findMany({ where: { organizationId: orgId } }),
    prisma.expense.findMany({ where: { organizationId: orgId } }),
    prisma.attendance.findMany({ where: { organizationId: orgId } }),
  ])

  const month = now.getMonth(), year = now.getFullYear()
  const monthlyPayments = payments.filter(p => p.date.getMonth() === month && p.date.getFullYear() === year)
  const monthlyExpenses = expenses.filter(e => e.date.getMonth() === month && e.date.getFullYear() === year)

  const monthlyRevenue = []
  for (let m = 0; m < 12; m++) {
    monthlyRevenue.push({
      month: m + 1,
      revenue: payments.filter(p => p.date.getMonth() === m && p.date.getFullYear() === year).reduce((s, p) => s + p.amount, 0),
      expense: expenses.filter(e => e.date.getMonth() === m && e.date.getFullYear() === year).reduce((s, e) => s + e.amount, 0),
    })
  }

  ok(res, {
    totalStudents, totalGroups, totalTeachers,
    totalRevenue: monthlyPayments.reduce((s, p) => s + p.amount, 0),
    totalExpense: monthlyExpenses.reduce((s, e) => s + e.amount, 0),
    netProfit: monthlyPayments.reduce((s, p) => s + p.amount, 0) - monthlyExpenses.reduce((s, e) => s + e.amount, 0),
    debtors: await prisma.student.count({ where: { organizationId: orgId, paymentStatus: { in: ['debt', 'risk'] } } }),
    attendanceRate: attendance.length > 0 ? Math.round(attendance.filter(a => a.status === 'present').length / attendance.length * 100) : 0,
    monthlyRevenue,
    todayRevenue: payments.filter(p => p.date.toDateString() === now.toDateString()).reduce((s, p) => s + p.amount, 0),
  })
}))

// ───── Groups ─────
app.get('/api/groups', asyncHandler(async (req, res) => {
  const groups = await prisma.group.findMany({
    where: { organizationId: req.user.organizationId, ...(req.user.role === 'teacher' ? { teacherId: req.user.userId } : {}) },
    include: { _count: { select: { students: true } } },
    orderBy: { createdAt: 'desc' },
  })
  ok(res, groups)
}))

app.post('/api/groups', authorize('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  const { name, course, teacherId, teacherName, room, price, startDate, daysOfWeek, startTime, endTime, monthDuration } = req.body
  const group = await prisma.group.create({
    data: { organizationId: req.user.organizationId, name, course, teacherId, teacherName, room, price: price ? Number(price) : null, startDate: startDate ? new Date(startDate) : null, daysOfWeek, startTime, endTime, monthDuration: monthDuration ? Number(monthDuration) : null },
  })
  created(res, group, 'Guruh yaratildi')
}))

app.put('/api/groups/:id', authorize('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  const group = await prisma.group.update({ where: { id: req.params.id }, data: req.body })
  ok(res, group, 'Guruh yangilandi')
}))

app.delete('/api/groups/:id', authorize('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  await prisma.group.delete({ where: { id: req.params.id } })
  ok(res, null, "Guruh o'chirildi")
}))

// ───── Students ─────
app.get('/api/students', asyncHandler(async (req, res) => {
  const students = await prisma.student.findMany({
    where: { organizationId: req.user.organizationId },
    include: { group: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })
  ok(res, students.map(s => ({ ...s, groupName: s.group?.name || 'N/A', group: undefined })))
}))

app.post('/api/students', authorize('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  const { name, phone, groupId, course, parentName, parentPhone } = req.body
  const group = groupId ? await prisma.group.findUnique({ where: { id: groupId } }) : null
  const student = await prisma.student.create({
    data: { organizationId: req.user.organizationId, name, phone, groupId, course, parentName, parentPhone, paymentStatus: 'debt' },
  })
  if (group) {
    await prisma.notification.create({ data: { organizationId: req.user.organizationId, title: 'Yangi o\'quvchi', message: `${name} guruhga qo'shildi`, type: 'info' } })
  }
  created(res, { ...student, groupName: group?.name || 'N/A' }, "O'quvchi qo'shildi")
}))

app.put('/api/students/:id', authorize('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  const student = await prisma.student.update({ where: { id: req.params.id }, data: req.body })
  ok(res, student, "O'quvchi yangilandi")
}))

app.delete('/api/students/:id', authorize('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  await prisma.student.delete({ where: { id: req.params.id } })
  ok(res, null, "O'quvchi o'chirildi")
}))

// ───── Payments ─────
app.get('/api/payments', asyncHandler(async (req, res) => {
  const payments = await prisma.payment.findMany({ where: { organizationId: req.user.organizationId }, orderBy: { createdAt: 'desc' } })
  ok(res, payments)
}))

app.post('/api/payments', authorize('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  const { studentId, amount, method, date, note, studentName, groupId } = req.body
  const payment = await prisma.payment.create({
    data: { organizationId: req.user.organizationId, studentId, amount: Number(amount), method, date: date ? new Date(date) : new Date(), note, studentName: studentName || '', groupId, createdById: req.user.userId, createdByName: req.user.name },
  })
  if (studentId) await prisma.student.update({ where: { id: studentId }, data: { paymentStatus: 'paid', lastPaymentDate: new Date() } })
  created(res, payment, "To'lov qayd etildi")
}))

app.put('/api/payments/:id', authorize('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  const payment = await prisma.payment.update({ where: { id: req.params.id }, data: req.body })
  ok(res, payment, "To'lov yangilandi")
}))

app.delete('/api/payments/:id', authorize('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  await prisma.payment.delete({ where: { id: req.params.id } })
  ok(res, null, "To'lov o'chirildi")
}))

// ───── Expenses ─────
app.get('/api/expenses', asyncHandler(async (req, res) => {
  const expenses = await prisma.expense.findMany({ where: { organizationId: req.user.organizationId }, orderBy: { createdAt: 'desc' } })
  ok(res, expenses)
}))

app.post('/api/expenses', authorize('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  const { amount, description, category, date } = req.body
  const expense = await prisma.expense.create({
    data: { organizationId: req.user.organizationId, amount: Number(amount), description, category, date: date ? new Date(date) : new Date(), createdById: req.user.userId, createdByName: req.user.name },
  })
  created(res, expense, 'Xarajat qayd etildi')
}))

app.delete('/api/expenses/:id', authorize('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  await prisma.expense.delete({ where: { id: req.params.id } })
  ok(res, null, 'Xarajat o\'chirildi')
}))

// ───── Attendance ─────
app.get('/api/attendance', authorize('super_admin', 'org_admin', 'teacher'), asyncHandler(async (req, res) => {
  const where = { organizationId: req.user.organizationId }
  if (req.query.date) where.date = new Date(req.query.date)
  if (req.query.groupId) {
    const students = await prisma.student.findMany({ where: { groupId: req.query.groupId }, select: { id: true } })
    where.studentId = { in: students.map(s => s.id) }
  }
  const attendance = await prisma.attendance.findMany({ where, include: { student: { select: { name: true } } } })
  ok(res, attendance)
}))

app.post('/api/attendance', authorize('super_admin', 'org_admin', 'teacher'), asyncHandler(async (req, res) => {
  const { studentId, date, status, note } = req.body
  const existing = await prisma.attendance.findFirst({ where: { organizationId: req.user.organizationId, studentId, date: new Date(date) } })
  let att
  if (existing) {
    att = await prisma.attendance.update({ where: { id: existing.id }, data: { status, note, markedById: req.user.userId } })
  } else {
    att = await prisma.attendance.create({ data: { organizationId: req.user.organizationId, studentId, date: new Date(date), status, note, markedById: req.user.userId } })
  }
  ok(res, att, 'Davomat belgilandi')
}))

// ───── Notifications ─────
app.get('/api/notifications', asyncHandler(async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { organizationId: req.user.organizationId, OR: [{ userId: req.user.userId }, { userId: null }] },
    orderBy: { createdAt: 'desc' }, take: 100,
  })
  ok(res, notifications)
}))

app.put('/api/notifications/:id/read', asyncHandler(async (req, res) => {
  await prisma.notification.update({ where: { id: req.params.id }, data: { read: true } })
  ok(res, null, "Xabarnoma o'qildi")
}))

// ───── Messages ─────
app.get('/api/messages', asyncHandler(async (req, res) => {
  const where = { organizationId: req.user.organizationId }
  if (req.query.otherId) {
    where.OR = [
      { senderId: req.user.userId, receiverId: req.query.otherId },
      { senderId: req.query.otherId, receiverId: req.user.userId },
    ]
  }
  const messages = await prisma.message.findMany({ where, orderBy: { createdAt: 'asc' } })
  ok(res, messages)
}))

app.post('/api/messages', asyncHandler(async (req, res) => {
  const { content, receiverId, studentId } = req.body
  if (!content) return fail(res, 400, 'Xabar matni talab qilinadi')
  const msg = await prisma.message.create({
    data: { organizationId: req.user.organizationId, content, senderId: req.user.userId, receiverId, studentId },
  })
  const { getIO } = await import('./config/socket.js')
  try {
    const io = getIO()
    const roomId = [req.user.userId, receiverId].sort().join(':')
    io.to(`chat:${roomId}`).emit('message:new', { ...msg, senderName: req.user.name, senderRole: req.user.role })
  } catch {}
  created(res, msg, 'Xabar yuborildi')
}))

// ───── SPA ─────
if (existsSync(distPath)) {
  app.use(express.static(distPath, { maxAge: '7d', etag: true, lastModified: true }))
  app.get('*', (_, res) => res.sendFile(join(distPath, 'index.html')))
}

// ───── 404 ─────
app.use((_, res) => { res.status(404).json({ success: false, message: 'API endpoint topilmadi', errors: ['NOT_FOUND'] }) })

// ───── Error Handler ─────
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message || err)
  const status = err.status || 500
  const message = err.message || 'Serverda xatolik yuz berdi'
  if (status === 500) {
    try {
      const d = new Date().toISOString().split('T')[0]
      appendFileSync(join(logDir, `error-${d}.log`), `[${new Date().toISOString()}] ${err.stack || err}\n`, 'utf8')
    } catch {}
  }
  res.status(status).json({ success: false, message, errors: ['SERVER_ERROR'] })
})

// ═══════════════════════════════════════════
// START
// ═══════════════════════════════════════════

const PORT = env.PORT
httpServer.listen(PORT, async () => {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`  🚀 Enterprise CRM Server`)
  console.log(`  📡 Port: ${PORT}`)
  console.log(`  🌍 Env: ${env.NODE_ENV}`)
  console.log(`  🗄️  Database: PostgreSQL`)
  console.log(`  ⚡ Cache: Redis`)
  console.log(`  🔌 Socket.io: Ready`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
  try { await redis.connect(); console.log('  ✓ Redis connected') } catch { console.log('  ⚠ Redis not available (optional)') }
})

export default app
