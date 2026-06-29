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
  db.logDevice({ userId: user.id, userName: user.name, userRole: user.role, device: req.headers['user-agent'] || '', ip: req.ip, platform: req.headers['sec-ch-ua-platform'] || '' })
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
  if (data.groupId) data.groupId = Number(data.groupId)
  if (req.file) data.avatar = `/uploads/${req.file.filename}`
  const s = db.createStudent({ ...data, createdBy: req.user.id, createdByName: req.user.name, createdByRole: req.user.role })
  res.status(201).json(s)
})

app.put('/api/students/:id', authorize('superadmin', 'admin'), upload.single('avatar'), (req, res) => {
  const data = req.body
  if (data.groupId) data.groupId = Number(data.groupId)
  if (req.file) data.avatar = `/uploads/${req.file.filename}`
  const s = db.updateStudent(Number(req.params.id), data)
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
app.post('/api/attendance', authorize('superadmin', 'admin', 'teacher'), (req, res) => {
  const a = db.markAttendance({ ...req.body, markedBy: req.user.id, markedByName: req.user.name, markedByRole: req.user.role })
  res.json(a)
})
app.get('/api/attendance', authorize('superadmin', 'admin', 'teacher'), (req, res) => res.json(db.getAttendance(req.query)))

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

// ───── Homework ─────
app.get('/api/homework', (req, res) => res.json(db.getHomework(req.query)))
app.post('/api/homework', authorize('superadmin', 'admin', 'teacher'), upload.array('files'), (req, res) => {
  const data = req.body
  if (req.files?.length) data.files = req.files.map(f => `/uploads/${f.filename}`)
  const hw = db.createHomework({ ...data, createdBy: req.user.id, createdByName: req.user.name })
  res.status(201).json(hw)
})
app.put('/api/homework/:id', authorize('superadmin', 'admin', 'teacher'), (req, res) => {
  const hw = db.updateHomework(Number(req.params.id), req.body)
  if (!hw) return res.status(404).json({ error: 'Homework not found' })
  res.json(hw)
})
app.delete('/api/homework/:id', authorize('superadmin', 'admin', 'teacher'), (req, res) => {
  if (!db.deleteHomework(Number(req.params.id))) return res.status(404).json({ error: 'Homework not found' })
  res.json({ message: 'Deleted' })
})

// ───── Grades ─────
app.get('/api/grades', (req, res) => res.json(db.getGrades(req.query)))
app.post('/api/grades', authorize('superadmin', 'admin', 'teacher'), (req, res) => {
  const g = db.createGrade({ ...req.body, createdBy: req.user.id })
  res.status(201).json(g)
})
app.get('/api/grades/stats/:studentId', (req, res) => res.json(db.getGradeStats(Number(req.params.studentId))))

// ───── Schedule ─────
app.get('/api/schedule', (req, res) => res.json(db.getSchedule(req.query)))
app.post('/api/schedule', authorize('superadmin', 'admin'), (req, res) => {
  const s = db.createSchedule({ ...req.body, createdBy: req.user.id })
  res.status(201).json(s)
})
app.put('/api/schedule/:id', authorize('superadmin', 'admin'), (req, res) => {
  const s = db.updateSchedule(Number(req.params.id), req.body)
  if (!s) return res.status(404).json({ error: 'Schedule not found' })
  res.json(s)
})
app.delete('/api/schedule/:id', authorize('superadmin', 'admin'), (req, res) => {
  if (!db.deleteSchedule(Number(req.params.id))) return res.status(404).json({ error: 'Schedule not found' })
  res.json({ message: 'Deleted' })
})

// ───── Messages (Chat) ─────
app.get('/api/messages', (req, res) => res.json(db.getMessages(req.query)))
app.post('/api/messages', (req, res) => {
  const m = db.sendMessage({ ...req.body, senderId: req.user.id, senderName: req.user.name, senderRole: req.user.role })
  res.status(201).json(m)
})
app.put('/api/messages/read', (req, res) => {
  db.markMessagesRead(req.user.id, req.body.otherId)
  res.json({ message: 'Read' })
})

// ───── Library ─────
app.get('/api/library', (req, res) => res.json(db.getBooks(req.query)))
app.post('/api/library', authorize('superadmin', 'admin'), upload.single('file'), (req, res) => {
  const data = req.body
  if (req.file) data.fileUrl = `/uploads/${req.file.filename}`
  const b = db.createBook({ ...data, createdBy: req.user.id })
  res.status(201).json(b)
})
app.delete('/api/library/:id', authorize('superadmin', 'admin'), (req, res) => {
  if (!db.deleteBook(Number(req.params.id))) return res.status(404).json({ error: 'Book not found' })
  res.json({ message: 'Deleted' })
})

// ───── Exams ─────
app.get('/api/exams', (req, res) => res.json(db.getExams(req.query)))
app.post('/api/exams', authorize('superadmin', 'admin', 'teacher'), (req, res) => {
  const e = db.createExam({ ...req.body, createdBy: req.user.id })
  res.status(201).json(e)
})
app.post('/api/exams/submit', (req, res) => {
  const r = db.submitExamResult({ ...req.body, studentId: req.user.studentId || req.body.studentId })
  if (!r) return res.status(404).json({ error: 'Exam not found' })
  res.json(r)
})
app.get('/api/exam-results', (req, res) => res.json(db.getExamResults(req.query)))

// ───── Certificates ─────
app.get('/api/certificates', (req, res) => res.json(db.getCertificates(req.query)))
app.post('/api/certificates', authorize('superadmin', 'admin'), (req, res) => {
  const c = db.createCertificate({ ...req.body, issuedBy: req.user.id, issuedByName: req.user.name })
  res.status(201).json(c)
})

// ───── QR Attendance ─────
app.post('/api/qr/generate', authorize('superadmin', 'admin', 'teacher'), (req, res) => {
  const qr = db.generateQRCode({ ...req.body, createdBy: req.user.id })
  res.json(qr)
})
app.post('/api/qr/verify', (req, res) => {
  const result = db.verifyQRCode(req.body.code)
  if (!result) return res.status(404).json({ error: 'Not valid or expired QR code' })
  res.json(result)
})

// ───── Parent Portal ─────
app.get('/api/parent/children', (req, res) => {
  if (req.user.role !== 'parent') return res.status(403).json({ error: 'Only parents' })
  res.json(db.getParentChildren(req.user.id))
})
app.get('/api/parent/payments', (req, res) => {
  if (req.user.role !== 'parent') return res.status(403).json({ error: 'Only parents' })
  res.json(db.getParentPayments(req.user.id))
})

// ───── Student Portal ─────
app.get('/api/student/portal', (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Only students' })
  const student = db.students.find(s => s.studentUserId === req.user.id)
  if (!student) return res.status(404).json({ error: 'Student not found' })
  const data = db.getStudentPortalData(student.id)
  res.json(data)
})

// ───── Devices (Super Admin) ─────
app.get('/api/devices', authorize('superadmin'), (req, res) => res.json(db.getDevices(req.query)))

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
