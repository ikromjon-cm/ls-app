import { verifyAccessToken, hasPermission } from '../core/auth/auth.service.js'

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

export function checkOrganization(req, res, next) {
  if (!req.headers['x-organization-id'] && req.user?.organizationId) {
    req.headers['x-organization-id'] = req.user.organizationId
  }
  next()
}

export function sanitizeInput(req, _res, next) {
  if (req.body) {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].replace(/<[^>]*>/g, '').trim()
      }
    }
  }
  next()
}

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
}
