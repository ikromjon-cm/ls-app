import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { randomBytes, createHmac } from 'crypto'
import env from '../../config/env.js'
import prisma from '../../config/database.js'
import redis from '../../config/redis.js'

export function hashPassword(password) {
  return bcrypt.hashSync(password, 12)
}

export function comparePassword(password, hash) {
  return bcrypt.compareSync(password, hash)
}

export function generateAccessToken(payload) {
  return jwt.sign({ ...payload, type: 'access' }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  })
}

export function generateRefreshToken(payload) {
  return jwt.sign({ ...payload, type: 'refresh' }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  })
}

export function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET)
    if (decoded.type !== 'access') return null
    return decoded
  } catch { return null }
}

export function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET)
    if (decoded.type !== 'refresh') return null
    return decoded
  } catch { return null }
}

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function createSession(userId, token, refreshToken, deviceInfo, ip) {
  return prisma.session.create({
    data: { userId, token, refreshToken, deviceInfo, ip, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  })
}

export async function invalidateSession(token) {
  await prisma.session.deleteMany({ where: { token } })
  await redis.del(`session:${token}`)
}

export async function invalidateAllSessions(userId) {
  const sessions = await prisma.session.findMany({ where: { userId }, select: { token: true } })
  await prisma.session.deleteMany({ where: { userId } })
  if (sessions.length) await redis.del(sessions.map(s => `session:${s.token}`))
}

// ───── TOTP 2FA ─────
function totp(secret, counter) {
  const buf = Buffer.alloc(8)
  for (let i = 7; i >= 0; i--) { buf[i] = counter & 0xff; counter >>= 8 }
  const hmac = createHmac('sha1', Buffer.from(secret, 'hex')).update(buf).digest()
  const offset = hmac[hmac.length - 1] & 0xf
  const code = ((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16) | ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff)
  return String(code % 1000000).padStart(6, '0')
}

export function generate2FASecret(email) {
  const secret = randomBytes(20).toString('hex')
  const otpauthUrl = `otpauth://totp/OpenCode%20CRM:${encodeURIComponent(email)}?secret=${secret}&issuer=OpenCode%20CRM&algorithm=SHA1&digits=6&period=30`
  return { secret, otpauthUrl }
}

export function verify2FAToken(secret, token) {
  const time = Math.floor(Date.now() / 30000)
  for (let i = -1; i <= 1; i++) {
    if (totp(secret, time + i) === token) return true
  }
  return false
}

export async function generate2FAQrCode(otpauthUrl) {
  const QRCode = await import('qrcode')
  return QRCode.toDataURL(otpauthUrl)
}

// ───── SMS OTP ─────
export async function sendOTP(phone, code) {
  if (env.SMS_API_KEY) {
    try {
      const res = await fetch(`${env.SMS_API_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.SMS_API_KEY}` },
        body: JSON.stringify({ phone, text: `OpenCode: ${code} - tasdiqlash kodi` }),
      })
      return res.ok
    } catch { return false }
  }
  console.log(`[OTP] ${phone}: ${code}`)
  return true
}

export async function storeOTP(identifier, code, type) {
  await redis.setex(`otp:${type}:${identifier}`, 300, code)
}

export async function verifyOTP(identifier, code, type) {
  const stored = await redis.get(`otp:${type}:${identifier}`)
  if (!stored || stored !== code) return false
  await redis.del(`otp:${type}:${identifier}`)
  return true
}

export async function checkRateLimit(key, maxAttempts = 5, windowMs = 300) {
  const count = await redis.incr(`ratelimit:${key}`)
  if (count === 1) await redis.expire(`ratelimit:${key}`, windowMs)
  return count <= maxAttempts
}

// ───── Permissions ─────
export const ROLE_HIERARCHY = {
  super_admin: 100, org_admin: 80, manager: 60,
  teacher: 40, employee: 30, parent: 20, student: 10,
}

export function hasPermission(userRole, requiredRole) {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0)
}
