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

// GET /api/messages
router.get('/', asyncHandler(async (req, res) => {
  const where: any = { organizationId: req.user.organizationId }
  if (req.query.otherId) {
    where.OR = [
      { senderId: req.user.userId, receiverId: req.query.otherId as string },
      { senderId: req.query.otherId as string, receiverId: req.user.userId },
    ]
  }
  const messages = await prisma.message.findMany({ where, orderBy: { createdAt: 'asc' } })
  res.json({ success: true, message: 'OK', data: messages, errors: [] })
}))

// POST /api/messages
router.post('/', asyncHandler(async (req, res) => {
  const { content, receiverId, studentId } = req.body
  if (!content) return res.status(400).json({ success: false, message: 'Xabar matni talab qilinadi', errors: [] })
  const msg = await prisma.message.create({
    data: { organizationId: req.user.organizationId, content, senderId: req.user.userId, receiverId, studentId },
  })
  const { getIO } = await import('../../config/socket.js')
  try {
    const io = getIO()
    const roomId = [req.user.userId, receiverId].sort().join(':')
    io.to(`chat:${roomId}`).emit('message:new', { ...msg, senderName: req.user.name, senderRole: req.user.role })
  } catch {}
  res.status(201).json({ success: true, message: 'Xabar yuborildi', data: msg, errors: [] })
}))

export default router