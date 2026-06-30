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


// GET /api/exams
router.get('/', asyncHandler(async (req, res) => {
  const where: any = { organizationId: req.user.organizationId }
  if (req.query.groupId) where.groupId = req.query.groupId as string
  const exams = await prisma.exam.findMany({ where, orderBy: { createdAt: 'desc' } })
  res.json({ success: true, message: 'OK', data: exams, errors: [] })
}))

// POST /api/exams
router.post('/', authorizeRoles('super_admin', 'org_admin', 'teacher'), asyncHandler(async (req, res) => {
  const { groupId, title, questions, timeLimit, maxScore, date } = req.body
  const exam = await prisma.exam.create({
    data: { organizationId: req.user.organizationId, groupId, title, questions: questions || [], timeLimit: timeLimit ? Number(timeLimit) : null, maxScore: maxScore ? Number(maxScore) : null, date: date ? new Date(date) : null, createdById: req.user.userId },
  })
  res.status(201).json({ success: true, message: 'Imtihon yaratildi', data: exam, errors: [] })
}))

// GET /api/exam-results
router.get('/results', asyncHandler(async (req, res) => {
  const where: any = {}
  if (req.query.examId) where.examId = req.query.examId as string
  if (req.query.studentId) where.studentId = req.query.studentId as string
  const results = await prisma.examResult.findMany({ where, orderBy: { submittedAt: 'desc' } })
  res.json({ success: true, message: 'OK', data: results, errors: [] })
}))

export default router