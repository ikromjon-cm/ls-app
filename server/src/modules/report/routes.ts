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


// GET /api/reports
router.get('/', authorizeRoles('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  const orgId = req.user.organizationId
  const year = req.query.year ? Number(req.query.year) : new Date().getFullYear()
  const [payments, expenses] = await Promise.all([
    prisma.payment.findMany({ where: { organizationId: orgId, date: { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) } } }),
    prisma.expense.findMany({ where: { organizationId: orgId, date: { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) } } }),
  ])
  const months: { month: number; monthName: string; revenue: number; expense: number; paymentCount: number; expenseCount: number }[] = []
  for (let m = 0; m < 12; m++) {
    const monthPayments = payments.filter(p => p.date.getMonth() === m)
    const monthExpenses = expenses.filter(e => e.date.getMonth() === m)
    months.push({
      month: m + 1,
      monthName: ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'][m],
      revenue: monthPayments.reduce((s, p) => s + p.amount, 0),
      expense: monthExpenses.reduce((s, e) => s + e.amount, 0),
      paymentCount: monthPayments.length,
      expenseCount: monthExpenses.length,
    })
  }
  res.json({
    success: true, message: 'OK',
    data: {
      year, months,
      totalRevenue: payments.reduce((s, p) => s + p.amount, 0),
      totalExpense: expenses.reduce((s, e) => s + e.amount, 0),
      netProfit: payments.reduce((s, p) => s + p.amount, 0) - expenses.reduce((s, e) => s + e.amount, 0),
    },
    errors: []
  })
}))

export default router