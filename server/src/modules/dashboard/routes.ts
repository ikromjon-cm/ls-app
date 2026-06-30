import { Router } from 'express'
import { asyncHandler } from '../../shared/middleware/index.js'
import prisma from '../../config/database.js'
import redis from '../../config/redis.js'

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

// GET /api/dashboard
router.get('/', asyncHandler(async (req, res) => {
  const orgId = req.user.organizationId
  const cacheKey = `dashboard:${orgId}`
  const cached = await redis.get(cacheKey).catch(() => null)
  if (cached) return res.json({ success: true, message: 'OK', data: JSON.parse(cached), errors: [] })

  const now = new Date()
  const year = now.getFullYear()
  const [totalStudents, totalGroups, totalTeachers, totalAdmins, payments, expenses, attendance, allStudents] = await Promise.all([
    prisma.student.count({ where: { organizationId: orgId } }),
    prisma.group.count({ where: { organizationId: orgId } }),
    prisma.user.count({ where: { organizationId: orgId, role: 'teacher' } }),
    prisma.user.count({ where: { organizationId: orgId, role: { in: ['org_admin', 'super_admin'] } } }),
    prisma.payment.findMany({ where: { organizationId: orgId, date: { gte: new Date(`${year}-01-01`) } } }),
    prisma.expense.findMany({ where: { organizationId: orgId, date: { gte: new Date(`${year}-01-01`) } } }),
    prisma.attendance.findMany({ where: { organizationId: orgId } }),
    prisma.student.findMany({ where: { organizationId: orgId }, select: { id: true, groupId: true, paymentStatus: true } }),
  ])

  const groupIds = [...new Set(allStudents.filter(s => s.groupId).map(s => s.groupId))]
  const groups = await prisma.group.findMany({ where: { id: { in: groupIds } }, select: { id: true, name: true } })
  const groupMap = Object.fromEntries(groups.map(g => [g.id, g.name]))

  const totalDebtors = allStudents.filter(s => s.paymentStatus === 'debt' || s.paymentStatus === 'risk').length
  const paidStudents = allStudents.filter(s => s.paymentStatus === 'paid').length

  const todayStr = now.toDateString()
  const presentToday = attendance.filter(a => a.status === 'present' && a.date.toDateString() === todayStr).length
  const absentToday = attendance.filter(a => a.status === 'absent' && a.date.toDateString() === todayStr).length
  const lateToday = attendance.filter(a => a.status === 'late' && a.date.toDateString() === todayStr).length

  const groupStatsMap: Record<string, { name: string; paid: number; debt: number }> = {}
  for (const s of allStudents) {
    if (!s.groupId) continue
    const gid = s.groupId
    if (!groupStatsMap[gid]) groupStatsMap[gid] = { name: groupMap[gid] || 'Noma\'lum', paid: 0, debt: 0 }
    if (s.paymentStatus === 'paid') groupStatsMap[gid].paid++
    else groupStatsMap[gid].debt++
  }
  const groupStats = Object.values(groupStatsMap)

  const month = now.getMonth()
  const monthlyPayments = payments.filter(p => p.date.getMonth() === month && p.date.getFullYear() === year)
  const monthlyExpenses = expenses.filter(e => e.date.getMonth() === month && e.date.getFullYear() === year)

  const monthlyRevenue: { month: number; revenue: number; expense: number }[] = []
  for (let m = 0; m < 12; m++) {
    monthlyRevenue.push({
      month: m + 1,
      revenue: payments.filter(p => p.date.getMonth() === m && p.date.getFullYear() === year).reduce((s, p) => s + p.amount, 0),
      expense: expenses.filter(e => e.date.getMonth() === m && e.date.getFullYear() === year).reduce((s, e) => s + e.amount, 0),
    })
  }

  const data = {
    totalStudents, totalGroups, totalTeachers, totalAdmins,
    totalRevenue: monthlyPayments.reduce((s, p) => s + p.amount, 0),
    totalExpense: monthlyExpenses.reduce((s, e) => s + e.amount, 0),
    netProfit: monthlyPayments.reduce((s, p) => s + p.amount, 0) - monthlyExpenses.reduce((s, e) => s + e.amount, 0),
    debtors: totalDebtors,
    attendanceRate: attendance.length > 0 ? Math.round(attendance.filter(a => a.status === 'present').length / attendance.length * 100) : 0,
    presentToday, absentToday, lateToday,
    monthlyRevenue,
    todayRevenue: payments.filter(p => p.date.toDateString() === now.toDateString()).reduce((s, p) => s + p.amount, 0),
    groupStats,
    courseStats: [],
    teacherRating: [],
  }
  redis.setex(cacheKey, 300, JSON.stringify(data)).catch(() => {})
  res.json({ success: true, message: 'OK', data, errors: [] })
}))

export default router