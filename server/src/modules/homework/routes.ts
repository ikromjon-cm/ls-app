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


// GET /api/homework
router.get('/', asyncHandler(async (req, res) => {
  const where: any = { organizationId: req.user.organizationId }
  if (req.query.groupId) where.groupId = req.query.groupId as string
  const homework = await prisma.homework.findMany({ where, orderBy: { createdAt: 'desc' } })
  res.json({ success: true, message: 'OK', data: homework, errors: [] })
}))

// POST /api/homework
router.post('/', authorizeRoles('super_admin', 'org_admin', 'teacher'), asyncHandler(async (req, res) => {
  const { groupId, title, description, deadline, files } = req.body
  const hw = await prisma.homework.create({
    data: { organizationId: req.user.organizationId, groupId, title, description, deadline: deadline ? new Date(deadline) : null, files: files || [] },
  })
  res.status(201).json({ success: true, message: 'Topshiriq yaratildi', data: hw, errors: [] })
}))

// DELETE /api/homework/:id
router.delete('/:id', authorizeRoles('super_admin', 'org_admin', 'teacher'), asyncHandler(async (req, res) => {
  await prisma.homework.delete({ where: { id: req.params.id } })
  res.json({ success: true, message: "Topshiriq o'chirildi", data: null, errors: [] })
}))

export default router