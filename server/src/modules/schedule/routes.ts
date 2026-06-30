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


// GET /api/schedule
router.get('/', asyncHandler(async (req, res) => {
  const where: any = { organizationId: req.user.organizationId }
  if (req.query.groupId) where.groupId = req.query.groupId as string
  if (req.query.day) where.day = req.query.day as string
  const schedule = await prisma.scheduleEntry.findMany({ where, orderBy: [{ day: 'asc' }, { timeStart: 'asc' }] })
  res.json({ success: true, message: 'OK', data: schedule, errors: [] })
}))

// POST /api/schedule
router.post('/', authorizeRoles('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  const { groupId, subject, teacherId, day, timeStart, timeEnd, room } = req.body
  const entry = await prisma.scheduleEntry.create({
    data: { organizationId: req.user.organizationId, groupId, subject, teacherId, day, timeStart, timeEnd, room, createdById: req.user.userId },
  })
  res.status(201).json({ success: true, message: 'Dars qo\'shildi', data: entry, errors: [] })
}))

// DELETE /api/schedule/:id
router.delete('/:id', authorizeRoles('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  await prisma.scheduleEntry.delete({ where: { id: req.params.id } })
  res.json({ success: true, message: "Dars o'chirildi", data: null, errors: [] })
}))

export default router