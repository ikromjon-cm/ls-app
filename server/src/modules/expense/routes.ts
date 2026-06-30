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


// GET /api/expenses
router.get('/', asyncHandler(async (req, res) => {
  const expenses = await prisma.expense.findMany({ where: { organizationId: req.user.organizationId }, orderBy: { createdAt: 'desc' } })
  res.json({ success: true, message: 'OK', data: expenses, errors: [] })
}))

// POST /api/expenses
router.post('/', authorizeRoles('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  const { amount, description, category, date } = req.body
  const expense = await prisma.expense.create({
    data: { organizationId: req.user.organizationId, amount: Number(amount), description, category, date: date ? new Date(date) : new Date(), createdById: req.user.userId, createdByName: req.user.name },
  })
  res.status(201).json({ success: true, message: 'Xarajat qayd etildi', data: expense, errors: [] })
}))

// DELETE /api/expenses/:id
router.delete('/:id', authorizeRoles('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  await prisma.expense.delete({ where: { id: req.params.id } })
  res.json({ success: true, message: 'Xarajat o\'chirildi', data: null, errors: [] })
}))

export default router