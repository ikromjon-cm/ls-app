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

// GET /api/settings
router.get('/', authorizeRoles('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  const org = await prisma.organization.findUnique({
    where: { id: req.user.organizationId },
    select: { settings: true, name: true, slug: true, plan: true, logo: true },
  })
  res.json({ success: true, message: 'OK', data: org || { settings: {} }, errors: [] })
}))

// PUT /api/settings
router.put('/', authorizeRoles('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  const org = await prisma.organization.update({
    where: { id: req.user.organizationId },
    data: { settings: req.body },
  })
  res.json({ success: true, message: 'Sozlamalar saqlandi', data: org.settings, errors: [] })
}))

export default router