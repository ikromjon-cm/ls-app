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


// GET /api/payments
router.get('/', asyncHandler(async (req, res) => {
  const payments = await prisma.payment.findMany({ where: { organizationId: req.user.organizationId }, orderBy: { createdAt: 'desc' } })
  res.json({ success: true, message: 'OK', data: payments, errors: [] })
}))

// POST /api/payments
router.post('/', authorizeRoles('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  const { studentId, amount, method, date, note, studentName, groupId } = req.body
  const payment = await prisma.payment.create({
    data: { organizationId: req.user.organizationId, studentId, amount: Number(amount), method, date: date ? new Date(date) : new Date(), note, studentName: studentName || '', groupId, createdById: req.user.userId, createdByName: req.user.name },
  })
  if (studentId) {
    await prisma.student.update({ where: { id: studentId }, data: { paymentStatus: 'paid', lastPaymentDate: new Date() } })
    const student = await prisma.student.findUnique({ where: { id: studentId } })
    if (student?.parentPhone) {
      const parentUser = await prisma.user.findFirst({
        where: { organizationId: req.user.organizationId, phone: student.parentPhone },
        include: { devices: { select: { deviceInfo: true } } },
      })
      const { notifyPaymentReceipt } = await import('../../services/notification.service.js')
      const receiptNum = `RCP-${payment.id.slice(-8).toUpperCase()}`
      notifyPaymentReceipt(
        req.user.organizationId, studentName || student.name,
        Number(amount), method || 'Naqd',
        (date ? new Date(date) : new Date()).toLocaleDateString('uz-UZ'),
        receiptNum,
        parentUser?.email,
        parentUser?.devices.map(d => d.deviceInfo).filter(Boolean) as string[]
      )
    }
  }
  res.status(201).json({ success: true, message: "To'lov qayd etildi", data: payment, errors: [] })
}))

// PUT /api/payments/:id
router.put('/:id', authorizeRoles('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  const payment = await prisma.payment.update({ where: { id: req.params.id }, data: req.body })
  res.json({ success: true, message: "To'lov yangilandi", data: payment, errors: [] })
}))

// DELETE /api/payments/:id
router.delete('/:id', authorizeRoles('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  await prisma.payment.delete({ where: { id: req.params.id } })
  res.json({ success: true, message: "To'lov o'chirildi", data: null, errors: [] })
}))

export default router