import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'opencode-crm-secret-key-2026'

export function generateToken(user) {
  return jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '24h' })
}

export function generateRefreshToken(user) {
  return jwt.sign({ id: user.id, type: 'refresh' }, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

export function authenticate(req, res, next) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token required' })
  const decoded = verifyToken(auth.slice(7))
  if (!decoded) return res.status(401).json({ error: 'Invalid or expired token' })
  req.user = decoded
  req.clientIp = req.headers['x-forwarded-for'] || req.ip
  next()
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Access denied' })
    next()
  }
}

export { JWT_SECRET }
