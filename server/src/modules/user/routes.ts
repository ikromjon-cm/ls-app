import { Router } from 'express'
import { asyncHandler, authorizeRoles } from '../../shared/middleware/index.js'
import { hashPassword } from '../../core/auth/auth.service.js'
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


// GET /api/users
router.get('/', authorizeRoles('super_admin', 'org_admin', 'manager'), asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    where: { organizationId: req.user.organizationId },
    select: { id: true, login: true, name: true, role: true, email: true, phone: true, avatar: true, active: true, lastLoginAt: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ success: true, message: 'OK', data: users, errors: [] })
}))

// POST /api/users
router.post('/', authorizeRoles('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  const { login, name, password, role, email, phone } = req.body
  const existing = await prisma.user.findFirst({ where: { organizationId: req.user.organizationId, login } })
  if (existing) return res.status(409).json({ success: false, message: 'Bunday login mavjud', errors: [] })
  const user = await prisma.user.create({
    data: { organizationId: req.user.organizationId, login, name, password: hashPassword(password), email, phone, role },
    select: { id: true, login: true, name: true, role: true, email: true, phone: true, createdAt: true },
  })
  res.status(201).json({ success: true, message: 'Foydalanuvchi yaratildi', data: user, errors: [] })
}))

// PUT /api/users/:id
router.put('/:id', authorizeRoles('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  const data = { ...req.body }
  if (data.password) data.password = hashPassword(data.password)
  const user = await prisma.user.update({ where: { id: req.params.id }, data })
  const { password: _, ...safe } = user
  res.json({ success: true, message: 'Foydalanuvchi yangilandi', data: safe, errors: [] })
}))

// DELETE /api/users/:id
router.delete('/:id', authorizeRoles('super_admin'), asyncHandler(async (req, res) => {
  const { id } = req.params

  await prisma.$transaction([
    prisma.device.deleteMany({ where: { userId: id } }),
    prisma.notification.deleteMany({ where: { userId: id } }),
    prisma.group.updateMany({ where: { teacherId: id }, data: { teacherId: null } }),
    prisma.message.deleteMany({ where: { OR: [{ senderId: id }, { receiverId: id }] } }),
    prisma.user.delete({ where: { id } }),
  ])

  res.json({ success: true, message: "Foydalanuvchi o'chirildi", data: null, errors: [] })
}))

export default router