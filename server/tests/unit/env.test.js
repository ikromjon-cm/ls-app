import { describe, it, expect } from 'vitest'
import env from '../../src/config/env.js'

describe('Environment Configuration', () => {
  it('should have required auth secrets', () => {
    expect(env.JWT_SECRET).toBeDefined()
    expect(env.JWT_SECRET.length).toBeGreaterThanOrEqual(32)
    expect(env.JWT_REFRESH_SECRET).toBeDefined()
    expect(env.JWT_REFRESH_SECRET.length).toBeGreaterThanOrEqual(32)
    expect(env.SESSION_SECRET).toBeDefined()
    expect(env.SESSION_SECRET.length).toBeGreaterThanOrEqual(32)
  })

  it('should have valid database URL', () => {
    expect(env.DATABASE_URL).toMatch(/^postgresql:\/\//)
  })

  it('should have default port', () => {
    expect(env.PORT).toBe(3001)
  })

  it('should have valid environment', () => {
    expect(['development', 'production', 'test']).toContain(env.NODE_ENV)
  })
})
