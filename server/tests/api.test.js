import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { existsSync, unlinkSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEST_DB_PATH = join(__dirname, 'test-crm.json')

// Force DB_PATH for db module
process.env.DB_PATH = TEST_DB_PATH

import * as db from '../db.js'

describe('Database Layer', () => {
  beforeAll(() => {
    if (existsSync(TEST_DB_PATH)) unlinkSync(TEST_DB_PATH)
  })

  afterAll(() => {
    if (existsSync(TEST_DB_PATH)) unlinkSync(TEST_DB_PATH)
  })

  it('should authenticate default users', () => {
    const user = db.authenticate('superadmin', 'admin123')
    expect(user).toBeDefined()
    expect(user.role).toBe('superadmin')
    expect(user.login).toBe('superadmin')
  })

  it('should reject invalid credentials', () => {
    expect(db.authenticate('superadmin', 'wrong')).toBeNull()
    expect(db.authenticate('nonexistent', 'admin123')).toBeNull()
  })

  it('should create and read users', () => {
    const u = db.createUser({ login: 'testuser', password: 'test123', name: 'Test User', role: 'teacher' })
    expect(u).toBeDefined()
    expect(u).not.toBeNull()
    expect(u.login).toBe('testuser')
    expect(u.role).toBe('teacher')

    const users = db.getUsers('teacher')
    expect(users.some(x => x.login === 'testuser')).toBe(true)
  })

  it('should prevent duplicate logins', () => {
    const u = db.createUser({ login: 'testuser', password: 'test123', name: 'Test User', role: 'teacher' })
    expect(u).toBeNull()
  })

  it('should create and read groups', () => {
    const g = db.createGroup({ name: 'Test Group', course: 'Frontend', createdBy: 1 })
    expect(g).toBeDefined()
    expect(g.name).toBe('Test Group')
  })

  it('should create and read students', () => {
    const s = db.createStudent({
      name: 'Test Student',
      phone: '+998901234599',
      group: 'Test Group',
      parentLogin: 'testparent',
      parentPassword: 'parent123',
      createdBy: 1,
    })
    expect(s).toBeDefined()
    expect(s.name).toBe('Test Student')
    expect(s.parentIds.length).toBeGreaterThan(0)

    const s2 = db.createStudent({
      name: 'Test Student 2',
      phone: '+998901234599',
      group: 'Test Group',
      createdBy: 1,
    })
    expect(s2.id).toBe(s.id)
  })

  it('should create and process payments', () => {
    const p = db.createPayment({
      studentId: 1,
      amount: 500000,
      type: 'cash',
      date: new Date().toISOString().split('T')[0],
      createdBy: 1,
    })
    expect(p).toBeDefined()
    expect(p.amount).toBe(500000)
  })

  it('should create and read attendance', () => {
    const a = db.markAttendance({
      studentId: 1,
      date: new Date().toISOString().split('T')[0],
      status: 'present',
      markedBy: 1,
    })
    expect(a).toBeDefined()
    expect(a.status).toBe('present')
  })

  it('should generate dashboard stats', () => {
    const stats = db.getDashboardStats()
    expect(stats).toBeDefined()
    expect(stats.totalStudents).toBeGreaterThanOrEqual(1)
  })

  it('should create homework', () => {
    const hw = db.createHomework({
      groupId: 1,
      title: 'Test Homework',
      description: 'Do the exercises',
      deadline: '2026-07-01',
      createdBy: 1,
    })
    expect(hw).toBeDefined()
    expect(hw.title).toBe('Test Homework')
  })

  it('should create grades', () => {
    const g1 = db.createGrade({
      studentId: 1,
      subject: 'Math',
      grade: 5,
      createdBy: 1,
    })
    expect(g1).toBeDefined()
    expect(g1.grade).toBe(5)

    const stats = db.getGradeStats(1)
    expect(Array.isArray(stats)).toBe(true)
    expect(stats.length).toBeGreaterThanOrEqual(1)
    expect(stats[0].average).toBe(5)
  })

  it('should handle parent portal', () => {
    const parentUser = db.getUsers('parent').find(u => u.login === 'testparent')
    expect(parentUser).toBeDefined()

    const children = db.getParentChildren(parentUser.id)
    expect(children.length).toBeGreaterThanOrEqual(1)
  })

  it('should create and send messages', () => {
    const msg = db.sendMessage({
      content: 'Hello!',
      receiverId: 1,
      senderId: 2,
      senderName: 'Test',
      senderRole: 'teacher',
    })
    expect(msg).toBeDefined()
    expect(msg.content).toBe('Hello!')
  })

  it('should create certificates', () => {
    const cert = db.createCertificate({
      studentId: 1,
      studentName: 'Test Student',
      courseName: 'Frontend',
      issuedBy: 1,
      issuedByName: 'Admin',
    })
    expect(cert).toBeDefined()
    expect(cert.id).toBeDefined()
    expect(cert.studentName).toBe('Test Student')
  })

  it('should generate and verify QR codes', () => {
    const qr = db.generateQRCode({ createdBy: 1 })
    expect(qr).toBeDefined()
    expect(qr.code).toBeDefined()

    const verify = db.verifyQRCode(qr.code)
    expect(verify).toBeDefined()
    expect(verify.code).toBe(qr.code)
  })
})
