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

// GET /api/teachers
router.get('/', asyncHandler(async (req, res) => {
  const teachers = await prisma.user.findMany({
    where: { organizationId: req.user.organizationId, role: 'teacher' },
    select: { id: true, name: true, role: true, phone: true, email: true, avatar: true },
    orderBy: { name: 'asc' },
  })
  res.json({ success: true, message: 'OK', data: teachers, errors: [] })
}))

export default router