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


// GET /api/audit-logs
router.get('/', authorizeRoles('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  const where: any = { organizationId: req.user.organizationId }
  if (req.query.type) where.type = req.query.type as string
  if (req.query.userId) where.userId = req.query.userId as string
  if (req.query.startDate || req.query.endDate) {
    where.createdAt = {}
    if (req.query.startDate) where.createdAt.gte = new Date(req.query.startDate as string)
    if (req.query.endDate) where.createdAt.lte = new Date(req.query.endDate as string)
  }
  const logs = await prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: 500 })
  res.json({ success: true, message: 'OK', data: logs, errors: [] })
}))

export default router