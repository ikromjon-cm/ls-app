import express from 'express'
import cors from 'cors'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'
import { initDB, getGroups, createGroup, updateGroup, deleteGroup, addStudent, updateStudent, deleteStudent, markPayment, getPayments, markAttendance, getStats, getDebtors } from './db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distPath = join(__dirname, '..', 'dist')

const app = express()
app.use(cors())
app.use(express.json())

initDB()

// Groups
app.get('/api/groups', (_, res) => res.json(getGroups()))

app.post('/api/groups', (req, res) => {
  const { name, teacher, price, days, time } = req.body
  if (!name?.trim() || !teacher?.trim() || !price || !days?.trim() || !time?.trim())
    return res.status(400).json({ error: 'All fields required' })
  res.status(201).json(createGroup({ name: name.trim(), teacher: teacher.trim(), price: Number(price), days: days.trim(), time: time.trim() }))
})

app.put('/api/groups/:id', (req, res) => {
  const result = updateGroup(Number(req.params.id), req.body)
  if (!result) return res.status(404).json({ error: 'Group not found' })
  res.json(result)
})

app.delete('/api/groups/:id', (req, res) => {
  if (!deleteGroup(Number(req.params.id))) return res.status(404).json({ error: 'Group not found' })
  res.json({ message: 'Deleted' })
})

// Students
app.post('/api/groups/:id/students', (req, res) => {
  const { name, phone } = req.body
  if (!name?.trim() || !phone?.trim()) return res.status(400).json({ error: 'Name and phone required' })
  const student = addStudent(Number(req.params.id), { name: name.trim(), phone: phone.trim() })
  if (!student) return res.status(404).json({ error: 'Group not found' })
  res.status(201).json(student)
})

app.put('/api/students/:id', (req, res) => {
  const result = updateStudent(Number(req.params.id), req.body)
  if (!result) return res.status(404).json({ error: 'Student not found' })
  res.json(result)
})

app.delete('/api/students/:id', (req, res) => {
  if (!deleteStudent(Number(req.params.id))) return res.status(404).json({ error: 'Student not found' })
  res.json({ message: 'Deleted' })
})

// Payments
app.post('/api/students/:id/payment', (req, res) => {
  const payment = markPayment(Number(req.params.id), req.body)
  if (!payment) return res.status(404).json({ error: 'Student not found' })
  res.status(201).json(payment)
})

app.get('/api/payments', (_, res) => res.json(getPayments()))

// Attendance
app.post('/api/students/:id/attendance', (req, res) => {
  const { date, status } = req.body
  if (!date || !status) return res.status(400).json({ error: 'Date and status required' })
  const result = markAttendance(Number(req.params.id), { date, status })
  if (!result) return res.status(404).json({ error: 'Student not found' })
  res.json(result)
})

// Stats & Debtors
app.get('/api/stats', (_, res) => res.json(getStats()))
app.get('/api/debtors', (req, res) => res.json(getDebtors(req.query.search || '')))

// Serve Frontend (Production)
if (existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get('*', (_, res) => res.sendFile(join(distPath, 'index.html')))
  console.log('Serving frontend from dist/')
}

// Error handler
app.use((err, _, res, __) => {
  console.error(err)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
