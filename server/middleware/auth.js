import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  console.warn('[WARN] JWT_SECRET environment variable not set, using default (not secure for production)')
}
const SECRET = JWT_SECRET || 'opencode-crm-secret-key-2026'

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name, login: user.login },
    SECRET,
    { expiresIn: '24h', issuer: 'opencode-crm' }
  )
}

export function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id, type: 'refresh' },
    SECRET,
    { expiresIn: '7d', issuer: 'opencode-crm' }
  )
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET, { issuer: 'opencode-crm' })
  } catch {
    return null
  }
}

export function authenticate(req, res, next) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false, message: 'Token talab qilinadi', data: null, errors: ['AUTH_REQUIRED']
    })
  }
  const decoded = verifyToken(auth.slice(7))
  if (!decoded) {
    return res.status(401).json({
      success: false, message: 'Yaroqsiz yoki muddati o\'tgan token', data: null, errors: ['TOKEN_EXPIRED']
    })
  }
  req.user = decoded
  req.clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip
  next()
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false, message: 'Sizga bu amal uchun ruxsat yo\'q', data: null, errors: ['FORBIDDEN']
      })
    }
    next()
  }
}

export { SECRET as JWT_SECRET }
