import { verifyAccessToken, hasPermission } from '../../core/auth/auth.service.js'

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token talab qilinadi', errors: ['NO_TOKEN'] })
  }
  const token = authHeader.substring(7)
  const payload = verifyAccessToken(token)
  if (!payload) {
    return res.status(401).json({ success: false, message: 'Yaroqsiz token', errors: ['INVALID_TOKEN'] })
  }
  req.user = payload
  next()
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Avtorizatsiya talab qilinadi', errors: ['UNAUTHORIZED'] })
    }
    if (!roles.some(r => hasPermission(req.user.role, r))) {
      return res.status(403).json({ success: false, message: "Ruxsat yo'q", errors: ['FORBIDDEN'] })
    }
    next()
  }
}

export function authorizeRoles(...roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Avtorizatsiya talab qilinadi', errors: ['UNAUTHORIZED'] })
    if (!roles.some(r => hasPermission(req.user.role, r))) return res.status(403).json({ success: false, message: "Ruxsat yo'q", errors: ['FORBIDDEN'] })
    next()
  }
}

export function checkOrganization(req, res, next) {
  if (!req.headers['x-organization-id'] && req.user?.organizationId) {
    req.headers['x-organization-id'] = req.user.organizationId
  }
  next()
}

function sanitizeValue(value) {
  if (typeof value === 'string') {
    return value.replace(/<[^>]*>/g, '').trim()
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue)
  }
  if (value && typeof value === 'object') {
    const sanitized = {}
    for (const key of Object.keys(value)) {
      sanitized[key] = sanitizeValue(value[key])
    }
    return sanitized
  }
  return value
}

export function sanitizeInput(req, _res, next) {
  if (req.body) req.body = sanitizeValue(req.body)
  if (req.query) {
    for (const key of Object.keys(req.query)) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].replace(/<[^>]*>/g, '').trim()
      }
    }
  }
  next()
}

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
}
