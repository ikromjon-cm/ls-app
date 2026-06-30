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


// GET /api/grades
router.get('/', asyncHandler(async (req, res) => {
  const where: any = { organizationId: req.user.organizationId }
  if (req.query.studentId) where.studentId = req.query.studentId as string
  if (req.query.subject) where.subject = req.query.subject as string
  const grades = await prisma.grade.findMany({ where, orderBy: { createdAt: 'desc' } })
  res.json({ success: true, message: 'OK', data: grades, errors: [] })
}))

// POST /api/grades
router.post('/', authorizeRoles('super_admin', 'org_admin', 'teacher'), asyncHandler(async (req, res) => {
  const { studentId, subject, score } = req.body
  const grade = await prisma.grade.create({
    data: { organizationId: req.user.organizationId, studentId, subject, score: Number(score), createdById: req.user.userId },
  })
  res.status(201).json({ success: true, message: 'Baho qo\'yildi', data: grade, errors: [] })
}))

export default router