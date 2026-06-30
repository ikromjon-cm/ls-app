import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sanitizeInput, checkOrganization } from '../../src/shared/middleware/index.js'

describe('sanitizeInput', () => {
  function createReq(body, query) {
    return { body: body || {}, query: query || {} }
  }
  function createRes() {
    return {}
  }

  it('should strip HTML tags from string fields', () => {
    const req = createReq({ name: '<script>alert("xss")</script>Hello' })
    const next = vi.fn()
    sanitizeInput(req, createRes(), next)
    expect(req.body.name).toBe('alert("xss")Hello')
    expect(next).toHaveBeenCalled()
  })

  it('should trim string fields', () => {
    const req = createReq({ name: '  John  ', email: '  test@test.com  ' })
    const next = vi.fn()
    sanitizeInput(req, createRes(), next)
    expect(req.body.name).toBe('John')
    expect(req.body.email).toBe('test@test.com')
  })

  it('should handle nested objects', () => {
    const req = createReq({ user: { name: '<b>Alice</b>', bio: '  Hello  ' } })
    const next = vi.fn()
    sanitizeInput(req, createRes(), next)
    expect(req.body.user.name).toBe('Alice')
    expect(req.body.user.bio).toBe('Hello')
  })

  it('should handle arrays', () => {
    const req = createReq({ tags: ['<p>tag1</p>', '<script>tag2</script>'] })
    const next = vi.fn()
    sanitizeInput(req, createRes(), next)
    expect(req.body.tags[0]).toBe('tag1')
    expect(req.body.tags[1]).toBe('tag2')
  })

  it('should sanitize query params', () => {
    const req = createReq({}, { search: '<script>alert(1)</script>test' })
    const next = vi.fn()
    sanitizeInput(req, createRes(), next)
    expect(req.query.search).toBe('alert(1)test')
  })

  it('should handle null and non-object values', () => {
    const req = createReq({ name: null, count: 42, active: true })
    const next = vi.fn()
    sanitizeInput(req, createRes(), next)
    expect(req.body.name).toBeNull()
    expect(req.body.count).toBe(42)
    expect(req.body.active).toBe(true)
  })

  it('should handle empty body', () => {
    const req = createReq(null)
    const next = vi.fn()
    sanitizeInput(req, createRes(), next)
    expect(next).toHaveBeenCalled()
  })
})

describe('checkOrganization', () => {
  function createReq(headers, user) {
    return { headers: headers || {}, user: user || null }
  }

  it('should set x-organization-id from user if not provided', () => {
    const req = createReq({}, { organizationId: 'org-123' })
    const next = vi.fn()
    checkOrganization(req, {}, next)
    expect(req.headers['x-organization-id']).toBe('org-123')
    expect(next).toHaveBeenCalled()
  })

  it('should not override existing x-organization-id', () => {
    const req = createReq({ 'x-organization-id': 'existing-org' }, { organizationId: 'user-org' })
    const next = vi.fn()
    checkOrganization(req, {}, next)
    expect(req.headers['x-organization-id']).toBe('existing-org')
  })

  it('should not set header if no user', () => {
    const req = createReq({})
    const next = vi.fn()
    checkOrganization(req, {}, next)
    expect(req.headers['x-organization-id']).toBeUndefined()
  })
})
