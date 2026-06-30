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


// GET /api/groups
router.get('/', asyncHandler(async (req, res) => {
  const groups = await prisma.group.findMany({
    where: { organizationId: req.user.organizationId, ...(req.user.role === 'teacher' ? { teacherId: req.user.userId } : {}) },
    include: { _count: { select: { students: true } } },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ success: true, message: 'OK', data: groups, errors: [] })
}))

// POST /api/groups
router.post('/', authorizeRoles('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  const { name, course, teacherId, teacherName, room, price, startDate, daysOfWeek, startTime, endTime, monthDuration } = req.body
  const group = await prisma.group.create({
    data: { organizationId: req.user.organizationId, name, course, teacherId, teacherName, room, price: price ? Number(price) : null, startDate: startDate ? new Date(startDate) : null, daysOfWeek, startTime, endTime, monthDuration: monthDuration ? Number(monthDuration) : null },
  })
  res.status(201).json({ success: true, message: 'Guruh yaratildi', data: group, errors: [] })
}))

// PUT /api/groups/:id
router.put('/:id', authorizeRoles('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  const group = await prisma.group.update({ where: { id: req.params.id }, data: req.body })
  res.json({ success: true, message: 'Guruh yangilandi', data: group, errors: [] })
}))

// DELETE /api/groups/:id
router.delete('/:id', authorizeRoles('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  const { id } = req.params

  await prisma.$transaction([
    prisma.homework.deleteMany({ where: { groupId: id } }),
    prisma.scheduleEntry.deleteMany({ where: { groupId: id } }),
    prisma.student.updateMany({ where: { groupId: id }, data: { groupId: null } }),
    prisma.group.delete({ where: { id } }),
  ])

  res.json({ success: true, message: "Guruh o'chirildi", data: null, errors: [] })
}))

export default router