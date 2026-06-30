import { Router } from 'express'
import { asyncHandler } from '../../shared/middleware/index.js'
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

// GET /api/notifications
router.get('/', asyncHandler(async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { organizationId: req.user.organizationId, OR: [{ userId: req.user.userId }, { userId: null }] },
    orderBy: { createdAt: 'desc' }, take: 100,
  })
  res.json({ success: true, message: 'OK', data: notifications, errors: [] })
}))

// PUT /api/notifications/:id/read
router.put('/:id/read', asyncHandler(async (req, res) => {
  await prisma.notification.update({ where: { id: req.params.id }, data: { read: true } })
  res.json({ success: true, message: "Xabarnoma o'qildi", data: null, errors: [] })
}))

// PUT /api/notifications/read-all
router.put('/read-all', asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: { organizationId: req.user.organizationId, userId: req.user.userId, read: false },
    data: { read: true },
  })
  res.json({ success: true, message: 'Barcha xabarlar o\'qildi', data: null, errors: [] })
}))

export default router