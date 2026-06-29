import express from 'express'
import cors from 'cors'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'
import multer from 'multer'
import { authenticate, authorize, generateToken, generateRefreshToken, verifyToken } from './middleware/auth.js'
import * as db from './db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distPath = join(__dirname, '..', 'dist')

const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use('/uploads', express.static(join(__dirname, 'uploads')))

const upload = multer({ dest: join(__dirname, 'uploads') })

db.initDB?.()

// ───── Auth Routes ─────
app.post('/api/auth/login', (req, res) => {
  const { login, password } = req.body
  if (!login || !password) return res.status(400).json({ error: 'Login va parol talab qilinadi' })
  const user = db.authenticate(login, password)
  if (!user) return res.status(401).json({ error: 'Login yoki parol xato' })
  const token = generateToken(user)
  const refreshToken = generateRefreshToken(user)
  db.logAudit({ userId: user.id, userName: user.name, userRole: user.role, action: 'Tizimga kirdi', details: '', type: 'auth', ip: req.ip })
  res.json({ user, token, refreshToken })
})

app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' })
  const decoded = verifyToken(refreshToken)
  if (!decoded || decoded.type !== 'refresh') return res.status(401).json({ error: 'Invalid refresh token' })
  const user = db.getUser(decoded.id)
  if (!user) return res.status(404).json({ error: 'User not found' })
  const token = generateToken(user)
  const newRefreshToken = generateRefreshToken(user)
  res.json({ user, token, refreshToken: newRefreshToken })
})

// ───── Protected API Routes ─────
app.use('/api', authenticate)

// ───── Users ─────
app.get('/api/users', authorize('superadmin', 'admin'), (req, res) => {
  const users = db.getUsers(req.query.role)
  if (req.user.role === 'admin') res.json(users.filter(u => u.role !== 'superadmin'))
  else res.json(users)
})

app.post('/api/users', authorize('superadmin', 'admin'), (req, res) => {
  if (req.user.role === 'admin' && req.body.role !== 'teacher') return res.status(403).json({ error: 'Admin faqat o\'qituvchi yarata oladi' })
  const user = db.createUser({ ...req.body, createdBy: req.user.id, createdByName: req.user.name })
  if (!user) return res.status(409).json({ error: 'Bunday login mavjud' })
  res.status(201).json(user)
})

app.put('/api/users/:id', authorize('superadmin', 'admin'), (req, res) => {
  if (req.user.role === 'admin') delete req.body.role
  const user = db.updateUser(Number(req.params.id), { ...req.body, updatedBy: req.user.id, updatedByName: req.user.name })
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json(user)
})

app.delete('/api/users/:id', authorize('superadmin'), (req, res) => {
  if (!db.deleteUser(Number(req.params.id))) return res.status(404).json({ error: 'User not found' })
  res.json({ message: 'Deleted' })
})

// ───── Dashboard ─────
app.get('/api/dashboard', (req, res) => res.json(db.getDashboardStats()))

// ───── Groups ─────
app.get('/api/groups', (req, res) => res.json(db.getGroups(req.user)))

app.post('/api/groups', authorize('superadmin', 'admin'), (req, res) => {
  const g = db.createGroup({ ...req.body, createdBy: req.user.id, createdByName: req.user.name, createdByRole: req.user.role })
  res.status(201).json(g)
})

app.put('/api/groups/:id', authorize('superadmin', 'admin'), (req, res) => {
  const g = db.updateGroup(Number(req.params.id), { ...req.body, updatedBy: req.user.id, updatedByName: req.user.name, updatedByRole: req.user.role })
  if (!g) return res.status(404).json({ error: 'Group not found' })
  res.json(g)
})

app.delete('/api/groups/:id', authorize('superadmin', 'admin'), (req, res) => {
  if (!db.deleteGroup(Number(req.params.id))) return res.status(404).json({ error: 'Group not found' })
  res.json({ message: 'Deleted' })
})

// ───── Students ─────
app.get('/api/students', (req, res) => {
  if (req.user.role === 'teacher') {
    const teacher = db.getUser(req.user.id)
    if (!teacher) return res.json([])
    res.json(db.getStudents({ groupId: req.query.groupId }).filter(s => teacher.groupIds?.includes(s.groupId)))
  } else {
    res.json(db.getStudents(req.query))
  }
})

app.post('/api/students', authorize('superadmin', 'admin'), upload.single('avatar'), (req, res) => {
  const data = req.body
  if (req.file) data.avatar = `/uploads/${req.file.filename}`
  const s = db.createStudent({ ...data, createdBy: req.user.id, createdByName: req.user.name, createdByRole: req.user.role })
  res.status(201).json(s)
})

app.put('/api/students/:id', authorize('superadmin', 'admin'), (req, res) => {
  const s = db.updateStudent(Number(req.params.id), req.body)
  if (!s) return res.status(404).json({ error: 'Student not found' })
  res.json(s)
})

app.delete('/api/students/:id', authorize('superadmin', 'admin'), (req, res) => {
  if (!db.deleteStudent(Number(req.params.id))) return res.status(404).json({ error: 'Student not found' })
  res.json({ message: 'Deleted' })
})

// ───── Payments ─────
app.get('/api/payments', (req, res) => res.json(db.getPayments(req.query)))
app.post('/api/payments', authorize('superadmin', 'admin'), (req, res) => {
  const p = db.createPayment({ ...req.body, createdBy: req.user.id, createdByName: req.user.name, createdByRole: req.user.role })
  res.status(201).json(p)
})

// ───── Expenses ─────
app.get('/api/expenses', (req, res) => res.json(db.getExpenses(req.query)))
app.post('/api/expenses', authorize('superadmin', 'admin'), (req, res) => {
  const e = db.createExpense({ ...req.body, createdBy: req.user.id, createdByName: req.user.name, createdByRole: req.user.role })
  res.status(201).json(e)
})
app.delete('/api/expenses/:id', authorize('superadmin', 'admin'), (req, res) => {
  if (!db.deleteExpense(Number(req.params.id))) return res.status(404).json({ error: 'Expense not found' })
  res.json({ message: 'Deleted' })
})

// ───── Attendance ─────
app.post('/api/attendance', (req, res) => {
  const a = db.markAttendance({ ...req.body, markedBy: req.user.id, markedByName: req.user.name, markedByRole: req.user.role })
  res.json(a)
})
app.get('/api/attendance', (req, res) => res.json(db.getAttendance(req.query)))

// ───── Audit Logs ─────
app.get('/api/audit-logs', authorize('superadmin'), (req, res) => res.json(db.getAuditLogs(req.query)))

// ───── Reports ─────
app.get('/api/reports', authorize('superadmin', 'admin'), (req, res) => res.json(db.getReports(req.query)))

// ───── Notifications ─────
app.get('/api/notifications', (req, res) => res.json(db.getNotifications(req.user.id)))
app.put('/api/notifications/:id/read', (req, res) => {
  db.markNotificationRead(Number(req.params.id))
  res.json({ message: 'Read' })
})

// ───── Teachers ─────
app.get('/api/teachers', authorize('superadmin', 'admin'), (req, res) => res.json(db.getUsers('teacher')))

// ───── Reset Database (clears all data, keeps default users) ─────
app.post('/api/reset', authorize('superadmin'), (req, res) => {
  const data = db.resetDB()
  db.logAudit({ userId: req.user.id, userName: req.user.name, userRole: req.user.role, action: 'Ma\'lumotlar bazasini tozaladi', details: 'Barcha ma\'lumotlar o\'chirildi', type: 'system', ip: req.ip })
  res.json({ message: 'All data cleared', users: data.users.length })
})

// ───── Settings ─────
app.get('/api/settings', authorize('superadmin'), (req, res) => {
  const d = db.getDB()
  res.json(d.settings)
})
app.put('/api/settings', authorize('superadmin'), (req, res) => {
  const d = db.getDB()
  d.settings = { ...d.settings, ...req.body }
  db.save(d)
  res.json(d.settings)
})

// ───── Serve Frontend ─────
if (existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get('*', (_, res) => res.sendFile(join(distPath, 'index.html')))
}

// ───── Error Handler ─────
app.use((err, _, res, __) => {
  console.error(err)
  res.status(500).json({ error: err.message || 'Server error' })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
