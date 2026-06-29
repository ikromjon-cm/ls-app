import { describe, it, expect } from 'vitest'
import { hashPassword, comparePassword, generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken, hasPermission, ROLE_HIERARCHY, generateOTP, generate2FASecret, verify2FAToken } from '../src/core/auth/auth.service.js'
import { createHmac } from 'crypto'

function totp(secret, counter) {
  const buf = Buffer.alloc(8)
  for (let i = 7; i >= 0; i--) { buf[i] = counter & 0xff; counter >>= 8 }
  const hmac = createHmac('sha1', Buffer.from(secret, 'hex')).update(buf).digest()
  const offset = hmac[hmac.length - 1] & 0xf
  const code = ((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16) | ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff)
  return String(code % 1000000).padStart(6, '0')
}

describe('Auth Service - Password Hashing', () => {
  it('should hash and verify passwords', () => {
    const hash = hashPassword('test123')
    expect(hash).toBeDefined()
    expect(hash).not.toBe('test123')
    expect(comparePassword('test123', hash)).toBe(true)
    expect(comparePassword('wrong', hash)).toBe(false)
  })

  it('should generate different hashes for same password', () => {
    const h1 = hashPassword('test123')
    const h2 = hashPassword('test123')
    expect(h1).not.toBe(h2)
  })

  it('should handle empty passwords', () => {
    const hash = hashPassword('')
    expect(comparePassword('', hash)).toBe(true)
  })
})

describe('Auth Service - JWT Tokens', () => {
  const payload = { userId: 'test123', organizationId: 'org1', role: 'org_admin' }

  it('should generate and verify access tokens', () => {
    const token = generateAccessToken(payload)
    expect(token).toBeDefined()
    expect(typeof token).toBe('string')

    const decoded = verifyAccessToken(token)
    expect(decoded).toBeDefined()
    expect(decoded.userId).toBe('test123')
    expect(decoded.role).toBe('org_admin')
    expect(decoded.type).toBe('access')
  })

  it('should generate and verify refresh tokens', () => {
    const token = generateRefreshToken(payload)
    const decoded = verifyRefreshToken(token)
    expect(decoded).toBeDefined()
    expect(decoded.type).toBe('refresh')
  })

  it('should reject invalid tokens', () => {
    expect(verifyAccessToken('invalid.token.here')).toBeNull()
    expect(verifyRefreshToken('bad.token')).toBeNull()
  })

  it('should reject access token on refresh verify', () => {
    const token = generateAccessToken(payload)
    expect(verifyRefreshToken(token)).toBeNull()
  })

  it('should encode correct payload in tokens', () => {
    const roles = ['super_admin', 'org_admin', 'manager', 'teacher', 'parent', 'student']
    for (const role of roles) {
      const token = generateAccessToken({ ...payload, role })
      const decoded = verifyAccessToken(token)
      expect(decoded.role).toBe(role)
      expect(decoded.userId).toBe('test123')
      expect(decoded.organizationId).toBe('org1')
    }
  })
})

describe('Auth Service - Permissions', () => {
  it('should have correct role hierarchy', () => {
    expect(ROLE_HIERARCHY.super_admin).toBe(100)
    expect(ROLE_HIERARCHY.org_admin).toBe(80)
    expect(ROLE_HIERARCHY.manager).toBe(60)
    expect(ROLE_HIERARCHY.teacher).toBe(40)
    expect(ROLE_HIERARCHY.employee).toBe(30)
    expect(ROLE_HIERARCHY.parent).toBe(20)
    expect(ROLE_HIERARCHY.student).toBe(10)
  })

  it('should check permissions correctly', () => {
    expect(hasPermission('super_admin', 'org_admin')).toBe(true)
    expect(hasPermission('org_admin', 'super_admin')).toBe(false)
    expect(hasPermission('teacher', 'student')).toBe(true)
    expect(hasPermission('student', 'teacher')).toBe(false)
    expect(hasPermission('org_admin', 'org_admin')).toBe(true)
    expect(hasPermission('manager', 'teacher')).toBe(true)
    expect(hasPermission('parent', 'student')).toBe(true)
  })

  it('should handle unknown roles', () => {
    expect(hasPermission('unknown_role', 'teacher')).toBe(false)
    expect(hasPermission('super_admin', 'unknown_role')).toBe(true)
  })
})

describe('Auth Service - OTP', () => {
  it('should generate 6-digit codes', () => {
    const otp = generateOTP()
    expect(otp).toMatch(/^\d{6}$/)
  })

  it('should generate unique OTPs', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateOTP()))
    expect(codes.size).toBeGreaterThan(90)
  })

  it('should generate codes in valid range', () => {
    for (let i = 0; i < 50; i++) {
      const code = parseInt(generateOTP(), 10)
      expect(code).toBeGreaterThanOrEqual(0)
      expect(code).toBeLessThanOrEqual(999999)
    }
  })
})

describe('Auth Service - 2FA/TOTP', () => {
  it('should generate 2FA secret and otpauth URL', () => {
    const { secret, otpauthUrl } = generate2FASecret('test@example.com')
    expect(secret).toBeDefined()
    expect(secret.length).toBeGreaterThan(20)
    expect(otpauthUrl).toContain('otpauth://totp/')
    expect(otpauthUrl).toContain(encodeURIComponent('test@example.com'))
    expect(otpauthUrl).toContain('secret=')
    expect(otpauthUrl).toContain('OpenCode%20CRM')
  })

  it('should handle special characters in email', () => {
    const { otpauthUrl } = generate2FASecret('user+tag@test.co')
    expect(otpauthUrl).toContain('user%2Btag')
  })

  it('should generate unique secrets for different emails', () => {
    const s1 = generate2FASecret('user1@test.com').secret
    const s2 = generate2FASecret('user2@test.com').secret
    expect(s1).not.toBe(s2)
  })

  it('should verify valid TOTP tokens within time window', () => {
    const { secret } = generate2FASecret('test@example.com')
    const time = Math.floor(Date.now() / 30000)
    // Current period
    expect(verify2FAToken(secret, totp(secret, time))).toBe(true)
    // Previous period (30s ago)
    expect(verify2FAToken(secret, totp(secret, time - 1))).toBe(true)
    // Next period (30s ahead)
    expect(verify2FAToken(secret, totp(secret, time + 1))).toBe(true)
  })

  it('should reject tokens outside time window', () => {
    const { secret } = generate2FASecret('test@example.com')
    const time = Math.floor(Date.now() / 30000)
    // 2 periods ago
    expect(verify2FAToken(secret, totp(secret, time - 2))).toBe(false)
    // 2 periods ahead
    expect(verify2FAToken(secret, totp(secret, time + 2))).toBe(false)
  })

  it('should reject invalid TOTP tokens', () => {
    const { secret } = generate2FASecret('test@example.com')
    expect(verify2FAToken(secret, '000000')).toBe(false)
    expect(verify2FAToken(secret, '123456')).toBe(false)
  })

  it('should handle empty secret', () => {
    expect(verify2FAToken('', '123456')).toBe(false)
  })

  it('should throw on null secret', () => {
    expect(() => verify2FAToken(null, '123456')).toThrow()
  })
})
