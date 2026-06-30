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


// GET /api/certificates
router.get('/', asyncHandler(async (req, res) => {
  const where: any = { organizationId: req.user.organizationId }
  if (req.query.studentId) where.studentId = req.query.studentId as string
  const certificates = await prisma.certificate.findMany({ where, orderBy: { issuedAt: 'desc' } })
  res.json({ success: true, message: 'OK', data: certificates, errors: [] })
}))

// POST /api/certificates
router.post('/', authorizeRoles('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  const { studentId, studentName, type, certificateNumber, issueDate, description } = req.body
  const cert = await prisma.certificate.create({
    data: { organizationId: req.user.organizationId, studentId, studentName, type: type || 'completion', certificateNumber, issueDate: issueDate ? new Date(issueDate) : null, description, issuedById: req.user.userId, issuedByName: req.user.name },
  })
  res.status(201).json({ success: true, message: 'Sertifikat berildi', data: cert, errors: [] })
}))

export default router