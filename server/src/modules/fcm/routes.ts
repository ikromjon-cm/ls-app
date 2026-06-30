import { Router } from 'express'
import { asyncHandler, authorizeRoles } from '../../shared/middleware/index.js'
import { sendToDevice, sendToMultipleDevices, sendToTopic } from '../../services/firebase.service.js'
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

// POST /api/fcm/register
router.post('/register', asyncHandler(async (req, res) => {
  const { token: fcmToken, platform, deviceInfo } = req.body
  if (!fcmToken) return res.status(400).json({ success: false, message: 'FCM token talab qilinadi', errors: [] })
  try {
    const existing = await prisma.device.findFirst({
      where: { organizationId: req.user.organizationId, userId: req.user.userId, deviceInfo: fcmToken },
    })
    if (!existing) {
      await prisma.device.create({
        data: { organizationId: req.user.organizationId, userId: req.user.userId, deviceInfo: fcmToken, platform: platform || 'mobile', ip: req.ip },
      })
    } else {
      await prisma.device.update({ where: { id: existing.id }, data: { lastActive: new Date(), platform: platform || existing.platform } })
    }
  } catch {}
  res.json({ success: true, message: 'FCM token ro\'yxatdan o\'tkazildi', data: null, errors: [] })
}))

// DELETE /api/fcm/register
router.delete('/register', asyncHandler(async (req, res) => {
  const { token: fcmToken } = req.body
  if (!fcmToken) return res.status(400).json({ success: false, message: 'FCM token talab qilinadi', errors: [] })
  try {
    await prisma.device.deleteMany({ where: { userId: req.user.userId, deviceInfo: fcmToken } })
  } catch {}
  res.json({ success: true, message: 'FCM token o\'chirildi', data: null, errors: [] })
}))

// POST /api/fcm/push
router.post('/push', authorizeRoles('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  const { title, body, userId, data } = req.body
  if (!title || !body) return res.status(400).json({ success: false, message: 'Title va body talab qilinadi', errors: [] })
  if (userId) {
    const devices = await prisma.device.findMany({ where: { userId } })
    const tokens = devices.map(d => d.deviceInfo).filter(Boolean) as string[]
    if (tokens.length) await sendToMultipleDevices(tokens, { title, body, data })
  }
  await prisma.notification.create({
    data: { organizationId: req.user.organizationId, userId: userId || undefined, title, message: body, type: 'info' },
  })
  res.json({ success: true, message: 'Bildirishnoma yuborildi', data: null, errors: [] })
}))

export default router