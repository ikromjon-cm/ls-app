import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { asyncHandler } from '../../shared/middleware/index.js'
import {
  comparePassword, generateAccessToken, generateRefreshToken,
  verifyRefreshToken, createSession, invalidateSession,
  generateOTP, sendOTP, storeOTP, verifyOTP,
  generate2FASecret, verify2FAToken, generate2FAQrCode, checkRateLimit,
} from '../../core/auth/auth.service.js'
import { sendEmail, emailTemplates } from '../../services/email.service.js'
import prisma from '../../config/database.js'

const router = Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Ko'p urinish, keyinroq urinib ko'ring", errors: ['AUTH_RATE_LIMIT'] },
})

router.use('/login', authLimiter)
router.use('/verify-2fa', authLimiter)
router.use('/send-otp', authLimiter)
router.use('/verify-otp', authLimiter)

// POST /api/auth/login
router.post('/login', asyncHandler(async (req, res) => {
  const { login, password } = req.body
  if (!login || !password) return res.status(400).json({ success: false, message: 'Login va parol talab qilinadi', errors: [] })

  const user = await prisma.user.findFirst({
    where: { OR: [{ login }, { email: login }, { phone: login }], active: true },
    include: { organization: true },
  })
  if (!user || !comparePassword(password, user.password)) return res.status(401).json({ success: false, message: 'Login yoki parol xato', errors: [] })

  if (user.twoFactorEnabled) {
    const code = generateOTP()
    await storeOTP(`2fa:${user.id}`, code, '2fa')
    if (user.phone) await sendOTP(user.phone, code)
    return res.json({ success: true, message: '2FA kodi yuborildi', data: { requires2FA: true, userId: user.id, method: user.phone ? 'sms' : 'app' }, errors: [] })
  }

  const payload = { userId: user.id, organizationId: user.organizationId, role: user.role }
  const token = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)
  await createSession(user.id, token, refreshToken, req.headers['user-agent'], req.ip)

  await prisma.auditLog.create({
    data: { organizationId: user.organizationId, userId: user.id, userName: user.name, action: "Tizimga kirdi", type: 'auth', ip: req.ip },
  })

  const { password: _, ...safe } = user

  if (user.email && process.env.RESEND_API_KEY) {
    try {
      const now = new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })
      const html = emailTemplates.loginConfirmation(user.name, req.ip || 'N/A', now)
      sendEmail({ to: user.email, subject: 'Xavfsizlik: Tizimga kirish - OpenCode CRM', html })
    } catch {}
  }

  res.json({ success: true, message: "Tizimga muvaffaqiyatli kirdingiz", data: { user: safe, token, refreshToken, organization: user.organization }, errors: [] })
}))

// POST /api/auth/verify-2fa
router.post('/verify-2fa', asyncHandler(async (req, res) => {
  const { userId, code } = req.body
  if (!userId || !code) return res.status(400).json({ success: false, message: 'UserId va kod talab qilinadi', errors: [] })
  const valid = await verifyOTP(`2fa:${userId}`, code, '2fa')
  if (!valid) return res.status(401).json({ success: false, message: 'Yaroqsiz kod', errors: [] })
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { organization: true } })
  if (!user) return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi', errors: [] })
  const payload = { userId: user.id, organizationId: user.organizationId, role: user.role }
  const token = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)
  await createSession(user.id, token, refreshToken, req.headers['user-agent'], req.ip)
  const { password: _, ...safe } = user
  res.json({ success: true, message: 'Tasdiqlandi', data: { user: safe, token, refreshToken, organization: user.organization }, errors: [] })
}))

// POST /api/auth/refresh
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token talab qilinadi', errors: [] })
  const payload = verifyRefreshToken(refreshToken)
  if (!payload) return res.status(401).json({ success: false, message: 'Yaroqsiz refresh token', errors: [] })
  const user = await prisma.user.findUnique({ where: { id: (payload as any).userId } })
  if (!user) return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi', errors: [] })
  const newPayload = { userId: user.id, organizationId: user.organizationId, role: user.role }
  const newToken = generateAccessToken(newPayload)
  const newRefresh = generateRefreshToken(newPayload)
  await createSession(user.id, newToken, newRefresh, req.headers['user-agent'], req.ip)
  res.json({ success: true, message: 'Token yangilandi', data: { token: newToken, refreshToken: newRefresh }, errors: [] })
}))

// POST /api/auth/logout
router.post('/logout', asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.substring(7)
  if (token) await invalidateSession(token)
  res.json({ success: true, message: 'Chiqildi', data: null, errors: [] })
}))

// POST /api/auth/send-otp
router.post('/send-otp', asyncHandler(async (req, res) => {
  const { phone } = req.body
  if (!phone) return res.status(400).json({ success: false, message: 'Telefon raqam talab qilinadi', errors: [] })
  const allowed = await checkRateLimit(`otp:${phone}`, 3, 300)
  if (!allowed) return res.status(429).json({ success: false, message: "Ko'p urunish, keyinroq urinib ko'ring", errors: [] })
  const code = generateOTP()
  await storeOTP(phone, code, 'login')
  await sendOTP(phone, code)
  res.json({ success: true, message: 'Kod yuborildi', data: null, errors: [] })
}))

// POST /api/auth/verify-otp
router.post('/verify-otp', asyncHandler(async (req, res) => {
  const { phone, code } = req.body
  if (!phone || !code) return res.status(400).json({ success: false, message: 'Telefon va kod talab qilinadi', errors: [] })
  const valid = await verifyOTP(phone, code, 'login')
  if (!valid) return res.status(401).json({ success: false, message: 'Yaroqsiz kod', errors: [] })
  const user = await prisma.user.findFirst({ where: { phone, active: true }, include: { organization: true } })
  if (!user) return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi', errors: [] })
  const payload = { userId: user.id, organizationId: user.organizationId, role: user.role }
  const token = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)
  await createSession(user.id, token, refreshToken, req.headers['user-agent'], req.ip)
  const { password: _, ...safe } = user
  res.json({ success: true, message: 'Tasdiqlandi', data: { user: safe, token, refreshToken, organization: user.organization }, errors: [] })
}))

// POST /api/auth/setup-2fa
router.post('/setup-2fa', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Token talab qilinadi', errors: ['NO_TOKEN'] })
  const token = authHeader.substring(7)
  const { verifyAccessToken } = await import('../../core/auth/auth.service.js')
  const payload = verifyAccessToken(token)
  if (!payload) return res.status(401).json({ success: false, message: 'Yaroqsiz token', errors: ['INVALID_TOKEN'] })
  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user) return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi', errors: [] })
  const { secret, otpauthUrl } = generate2FASecret(user.email || user.login)
  const qrCode = await generate2FAQrCode(otpauthUrl)
  await prisma.user.update({ where: { id: user.id }, data: { twoFactorSecret: secret } })
  res.json({ success: true, message: '2FA sozlandi', data: { secret, qrCode, otpauthUrl }, errors: [] })
}))

// POST /api/auth/enable-2fa
router.post('/enable-2fa', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Token talab qilinadi', errors: ['NO_TOKEN'] })
  const token = authHeader.substring(7)
  const { verifyAccessToken } = await import('../../core/auth/auth.service.js')
  const payload = verifyAccessToken(token)
  if (!payload) return res.status(401).json({ success: false, message: 'Yaroqsiz token', errors: ['INVALID_TOKEN'] })
  const { token: code } = req.body
  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user || !user.twoFactorSecret) return res.status(400).json({ success: false, message: '2FA sozlanmagan', errors: [] })
  if (!verify2FAToken(user.twoFactorSecret, code)) return res.status(401).json({ success: false, message: 'Yaroqsiz kod', errors: [] })
  await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true } })
  res.json({ success: true, message: '2FA faollashtirildi', data: null, errors: [] })
}))

// POST /api/auth/disable-2fa
router.post('/disable-2fa', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Token talab qilinadi', errors: ['NO_TOKEN'] })
  const token = authHeader.substring(7)
  const { verifyAccessToken } = await import('../../core/auth/auth.service.js')
  const payload = verifyAccessToken(token)
  if (!payload) return res.status(401).json({ success: false, message: 'Yaroqsiz token', errors: ['INVALID_TOKEN'] })
  await prisma.user.update({ where: { id: payload.userId }, data: { twoFactorEnabled: false, twoFactorSecret: null } })
  res.json({ success: true, message: "2FA o'chirildi", data: null, errors: [] })
}))

export default router