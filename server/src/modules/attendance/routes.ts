import { Router } from 'express'
import { asyncHandler, authorizeRoles } from '../../shared/middleware/index.js'
import prisma from '../../config/database.js'

const router = Router()

router.use(asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Token talab qilinadi', errors: ['NO_TOKEN'] })
  const token = authHeader.substring(7)
  const { verifyAccessToken } = await import('../../core/auth/auth.service.js')
  const payload = verifyAccessToken(token)
  if (!payload) return res.status(401).json({ success: false, message: 'Yaroqsiz token', errors: ['INVALID_TOKEN'] })
  req.user = payload
  next()
}))


// GET /api/attendance
router.get('/', authorizeRoles('super_admin', 'org_admin', 'teacher'), asyncHandler(async (req, res) => {
  const where: any = { organizationId: req.user.organizationId }
  if (req.query.date) where.date = new Date(req.query.date as string)
  if (req.query.groupId) {
    const students = await prisma.student.findMany({ where: { groupId: req.query.groupId as string }, select: { id: true } })
    where.studentId = { in: students.map(s => s.id) }
  }
  const attendance = await prisma.attendance.findMany({ where, include: { student: { select: { name: true } } } })
  res.json({ success: true, message: 'OK', data: attendance, errors: [] })
}))

// POST /api/attendance
router.post('/', authorizeRoles('super_admin', 'org_admin', 'teacher'), asyncHandler(async (req, res) => {
  const { studentId, date, status, note } = req.body
  const existing = await prisma.attendance.findFirst({ where: { organizationId: req.user.organizationId, studentId, date: new Date(date) } })
  let att
  if (existing) {
    att = await prisma.attendance.update({ where: { id: existing.id }, data: { status, note, markedById: req.user.userId } })
  } else {
    att = await prisma.attendance.create({ data: { organizationId: req.user.organizationId, studentId, date: new Date(date), status, note, markedById: req.user.userId } })
  }
  res.json({ success: true, message: 'Davomat belgilandi', data: att, errors: [] })
}))

export default router