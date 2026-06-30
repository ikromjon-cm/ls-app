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

// GET /api/payments/providers/config
router.get('/config', authorizeRoles('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  const org = await prisma.organization.findUnique({
    where: { id: req.user.organizationId },
    select: { settings: true },
  })
  const providers = (org?.settings as any)?.paymentProviders || {}
  res.json({ success: true, message: 'OK', data: providers, errors: [] })
}))

// PUT /api/payments/providers/config/:provider
router.put('/config/:provider', authorizeRoles('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  const org = await prisma.organization.findUnique({ where: { id: req.user.organizationId } })
  const settings = (org?.settings as any) || {}
  settings.paymentProviders = settings.paymentProviders || {}
  settings.paymentProviders[req.params.provider] = req.body
  await prisma.organization.update({
    where: { id: req.user.organizationId },
    data: { settings },
  })
  res.json({ success: true, message: 'Provider sozlandi', data: settings.paymentProviders, errors: [] })
}))

export default router