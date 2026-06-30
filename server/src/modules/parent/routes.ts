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

// GET /api/parent/children
router.get('/children', asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } })
  if (!user) return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi', errors: [] })
  const students = await prisma.student.findMany({
    where: { organizationId: req.user.organizationId, parentPhone: user.phone },
    include: { group: { select: { name: true, teacherName: true } } },
  })
  res.json({ success: true, message: 'OK', data: students.map(s => ({ ...s, groupName: s.group?.name || 'N/A', teacherName: s.group?.teacherName || 'N/A', group: undefined })), errors: [] })
}))

export default router