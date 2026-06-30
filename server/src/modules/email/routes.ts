import { Router } from 'express'
import { asyncHandler, authorizeRoles } from '../../shared/middleware/index.js'
import { sendEmail, emailTemplates } from '../../services/email.service.js'
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

// POST /api/email/send
router.post('/send', authorizeRoles('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  const { to, subject, html, type } = req.body
  if (!to || !subject || !html) return res.status(400).json({ success: false, message: 'To, subject va html talab qilinadi', errors: [] })
  const result = await sendEmail({ to, subject, html })
  await prisma.auditLog.create({
    data: { organizationId: req.user.organizationId, userId: req.user.userId, userName: req.user.name, action: `Email yuborildi: ${subject}`, type: 'email', ip: req.ip },
  })
  if (!result.success) return res.status(500).json({ success: false, message: 'Email yuborilmadi', errors: [result.error || 'SEND_FAILED'] })
  res.json({ success: true, message: 'Email yuborildi', data: { id: result.id }, errors: [] })
}))

// POST /api/email/send-login-alert
router.post('/send-login-alert', asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } })
  if (!user?.email) return res.status(400).json({ success: false, message: 'Email manzil topilmadi', errors: [] })
  const now = new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })
  const html = emailTemplates.loginConfirmation(user.name, req.ip || 'N/A', now)
  await sendEmail({ to: user.email, subject: 'Xavfsizlik: Tizimga kirish - OpenCode CRM', html })
  res.json({ success: true, message: 'Xabar yuborildi', data: null, errors: [] })
}))

// POST /api/email/password-reset
router.post('/password-reset', asyncHandler(async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ success: false, message: 'Email talab qilinadi', errors: [] })
  const user = await prisma.user.findFirst({ where: { email, active: true } })
  if (!user) return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi', errors: [] })
  const { generateAccessToken } = await import('../../core/auth/auth.service.js')
  const resetToken = generateAccessToken({ userId: user.id, type: 'password_reset' })
  const resetLink = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`
  const html = emailTemplates.passwordReset(user.name, resetLink)
  await sendEmail({ to: user.email, subject: 'Parolni tiklash - OpenCode CRM', html })
  res.json({ success: true, message: 'Parolni tiklash havolasi yuborildi', data: null, errors: [] })
}))

export default router