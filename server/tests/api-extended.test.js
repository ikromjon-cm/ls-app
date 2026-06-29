import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { existsSync, unlinkSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEST_DB_PATH = join(__dirname, 'test-crm-extended.json')

let db, testStudentId, testGroupId, testParentId

describe('Extended Database Operations', () => {
  beforeAll(async () => {
    process.env.DB_PATH = TEST_DB_PATH
    if (existsSync(TEST_DB_PATH)) unlinkSync(TEST_DB_PATH)
    // Dynamic import ensures DB_PATH is set before module evaluation
    db = await import('../db.js')
    db.createUser({ login: 'portal_parent', password: 'pass', name: 'Portal Parent', role: 'parent', createdBy: 1 })
  })

  afterAll(() => {
    if (existsSync(TEST_DB_PATH)) unlinkSync(TEST_DB_PATH)
  })

  describe('Groups', () => {
    it('should create group with all fields', () => {
      const g = db.createGroup({
        name: 'Extended Test Group',
        course: 'Python',
        teacherName: 'Test Teacher',
        room: '301',
        price: 700000,
        monthDuration: 6,
        startTime: '10:00',
        endTime: '12:00',
        daysOfWeek: ['monday', 'wednesday'],
        createdBy: 1,
        createdByName: 'System',
        createdByRole: 'superadmin',
      })
      expect(g).toBeDefined()
      expect(g.name).toBe('Extended Test Group')
      expect(g.course).toBe('Python')
      expect(g.teacherName).toBe('Test Teacher')
      expect(g.room).toBe('301')
      expect(g.price).toBe(700000)
      expect(g.status).toBe('active')
      expect(Array.isArray(g.studentIds)).toBe(true)
      testGroupId = g.id
    })

    it('should list all groups', () => {
      const groups = db.getGroups({ role: 'superadmin' })
      expect(groups.length).toBeGreaterThanOrEqual(1)
      expect(groups.some(g => g.id === testGroupId)).toBe(true)
    })

    it('should update group', () => {
      const updated = db.updateGroup(testGroupId, { name: 'Updated Group', price: 800000 })
      expect(updated).toBeDefined()
      expect(updated.name).toBe('Updated Group')
      expect(updated.price).toBe(800000)
    })

    it('should handle non-existent group update', () => {
      expect(db.updateGroup(99999, { name: 'Ghost' })).toBeNull()
    })

    it('should delete group', () => {
      const tempGroup = db.createGroup({ name: 'Temp Group', createdBy: 1 })
      expect(db.deleteGroup(tempGroup.id)).toBe(true)
      expect(db.deleteGroup(99999)).toBe(false)
    })
  })

  describe('Students', () => {
    it('should create student with linked parent and student user accounts', () => {
      const s = db.createStudent({
        name: 'Extended Student',
        phone: '+998901234700',
        groupId: testGroupId,
        course: 'Python',
        parentName: 'Parent Name',
        parentPhone: '+998901234701',
        parentLogin: 'extended_parent',
        parentPassword: 'parent123',
        studentLogin: 'extended_student',
        studentPassword: 'student123',
        createdBy: 1,
        createdByName: 'System',
        createdByRole: 'superadmin',
      })
      expect(s).toBeDefined()
      expect(s.name).toBe('Extended Student')
      expect(Array.isArray(s.parentIds)).toBe(true)
      expect(s.parentIds.length).toBeGreaterThan(0)
      expect(s.studentUserId).toBeDefined()
      testStudentId = s.id
    })

    it('should deduplicate by phone number', () => {
      const dup = db.createStudent({
        name: 'Duplicate Student',
        phone: '+998901234700',
        createdBy: 1,
      })
      expect(dup.id).toBe(testStudentId)
    })

    it('should list students with filters', () => {
      const all = db.getStudents({})
      expect(all.length).toBeGreaterThan(0)
      const byGroup = db.getStudents({ groupId: testGroupId })
      expect(byGroup.length).toBeGreaterThan(0)
      expect(byGroup[0].groupName).toBeDefined()
      const bySearch = db.getStudents({ search: 'Extended' })
      expect(bySearch.length).toBeGreaterThan(0)
    })

    it('should update student', () => {
      const updated = db.updateStudent(testStudentId, { name: 'Updated Student', paymentStatus: 'paid' })
      expect(updated).toBeDefined()
      expect(updated.name).toBe('Updated Student')
      expect(updated.paymentStatus).toBe('paid')
    })

    it('should handle non-existent student update', () => {
      expect(db.updateStudent(99999, { name: 'Ghost' })).toBeNull()
    })

    it('should cascade delete student from group', () => {
      const tempStudent = db.createStudent({ name: 'Temp Student', phone: '+998901234799', groupId: testGroupId, createdBy: 1 })
      expect(db.deleteStudent(tempStudent.id)).toBe(true)
      const group = db.getGroups({}).find(g => g.id === testGroupId)
      expect(group).toBeDefined()
      expect(group.studentIds.includes(tempStudent.id)).toBe(false)
    })
  })

  describe('Payments', { timeout: 30000 }, () => {
    it('should create payments with all methods', () => {
      const methods = ['Naqd', 'Click', 'Payme', 'Uzum', 'Bank']
      for (const method of methods) {
        const p = db.createPayment({
          studentId: testStudentId,
          studentName: 'Extended Student',
          amount: 500000,
          method,
          date: '2026-06-15',
          groupId: testGroupId,
          createdBy: 1,
          createdByName: 'System',
          createdByRole: 'superadmin',
        })
        expect(p).toBeDefined()
        expect(p.method).toBe(method)
        expect(p.amount).toBe(500000)
      }
    })

    it('should create expense and verify deductions', () => {
      const e = db.createExpense({
        amount: 150000,
        description: 'Office supplies',
        category: 'Materials',
        date: '2026-06-15',
        createdBy: 1,
        createdByName: 'System',
        createdByRole: 'superadmin',
      })
      expect(e).toBeDefined()
      expect(e.amount).toBe(150000)
      expect(e.category).toBe('Materials')
    })

    it('should filter payments by date range', () => {
      const payments = db.getPayments({ startDate: '2026-01-01', endDate: '2026-12-31' })
      expect(payments.length).toBeGreaterThan(0)
      const noPayments = db.getPayments({ startDate: '2025-01-01', endDate: '2025-01-31' })
      expect(noPayments.length).toBe(0)
    })

    it('should handle payment update and delete', () => {
      const p = db.createPayment({ studentId: testStudentId, amount: 100000, date: '2026-06-20', createdBy: 1 })
      const updated = db.updatePayment(p.id, { amount: 200000 })
      expect(updated.amount).toBe(200000)
      expect(db.updatePayment(99999, { amount: 1 })).toBeNull()
      expect(db.deletePayment(p.id)).toBe(true)
      expect(db.deletePayment(99999)).toBe(false)
    })
  })

  describe('Attendance', () => {
    it('should mark and update attendance', () => {
      const a = db.markAttendance({
        studentId: testStudentId,
        date: '2026-06-16',
        status: 'present',
        markedBy: 1,
        markedByName: 'Teacher',
        markedByRole: 'teacher',
      })
      expect(a).toBeDefined()
      expect(a.status).toBe('present')
      const updated = db.markAttendance({ studentId: testStudentId, date: '2026-06-16', status: 'absent', markedBy: 1 })
      expect(updated.status).toBe('absent')
    })

    it('should track risk group after 3 absences', () => {
      for (let i = 0; i < 3; i++) {
        db.markAttendance({ studentId: testStudentId, date: `2026-06-${17 + i}`, status: 'absent', markedBy: 1 })
      }
      const student = db.getStudents({}).find(s => s.id === testStudentId)
      expect(student.riskGroup).toBe(true)
    })

    it('should filter attendance by date and group', () => {
      const byDate = db.getAttendance({ date: '2026-06-16' })
      expect(byDate.length).toBeGreaterThan(0)
      const byGroup = db.getAttendance({ groupId: testGroupId })
      expect(byGroup.length).toBeGreaterThan(0)
    })
  })

  describe('Homework', () => {
    it('should create homework with files', () => {
      const hw = db.createHomework({
        groupId: testGroupId,
        title: 'Extended Homework',
        description: 'Complete all tasks',
        deadline: '2026-07-01',
        files: ['/uploads/file1.pdf', '/uploads/file2.pdf'],
        createdBy: 1,
        createdByName: 'Teacher',
      })
      expect(hw).toBeDefined()
      expect(hw.title).toBe('Extended Homework')
      expect(hw.files.length).toBe(2)
      expect(hw.createdAt).toBeDefined()
    })

    it('should update and delete homework', () => {
      const hw = db.createHomework({ groupId: testGroupId, title: 'Temp HW', createdBy: 1 })
      const updated = db.updateHomework(hw.id, { title: 'Updated HW' })
      expect(updated.title).toBe('Updated HW')
      expect(db.updateHomework(99999, {})).toBeNull()
      expect(db.deleteHomework(hw.id)).toBe(true)
      expect(db.deleteHomework(99999)).toBe(false)
    })

    it('should filter homework by group', () => {
      const list = db.getHomework({ groupId: testGroupId })
      expect(list.length).toBeGreaterThan(0)
    })
  })

  describe('Grades', () => {
    it('should create grades for multiple subjects', () => {
      const subjects = ['Math', 'Physics', 'English', 'History']
      for (const subject of subjects) {
        const g = db.createGrade({
          studentId: testStudentId,
          subject,
          grade: Math.floor(Math.random() * 5) + 1,
          createdBy: 1,
        })
        expect(g).toBeDefined()
        expect(g.subject).toBe(subject)
      }
    })

    it('should calculate grade statistics', () => {
      const stats = db.getGradeStats(testStudentId)
      expect(Array.isArray(stats)).toBe(true)
      expect(stats.length).toBeGreaterThanOrEqual(1)
      for (const s of stats) {
        expect(s.subject).toBeDefined()
        expect(s.average).toBeGreaterThan(0)
        expect(s.count).toBeGreaterThan(0)
      }
    })

    it('should filter grades by subject', () => {
      const grades = db.getGrades({ studentId: testStudentId, subject: 'Math' })
      expect(grades.length).toBeGreaterThan(0)
      for (const g of grades) {
        expect(g.subject).toBe('Math')
      }
    })
  })

  describe('Messages', () => {
    it('should send and retrieve messages', () => {
      const msg = db.sendMessage({
        content: 'Test message for extended tests',
        senderId: 1,
        senderName: 'Admin',
        senderRole: 'superadmin',
        receiverId: 2,
      })
      expect(msg).toBeDefined()
      expect(msg.content).toBe('Test message for extended tests')
      expect(msg.read).toBe(false)
      expect(msg.createdAt).toBeDefined()
      const msgs = db.getMessages({ parentId: 2, teacherId: 1 })
      expect(msgs.some(m => m.id === msg.id)).toBe(true)
    })

    it('should mark messages as read', () => {
      const msg = db.sendMessage({ content: 'Read test', senderId: 1, receiverId: 2 })
      db.markMessagesRead(2, 1)
      const msgs = db.getMessages({ parentId: 2, teacherId: 1 })
      for (const m of msgs) {
        if (m.receiverId === 2) expect(m.read).toBe(true)
      }
    })
  })

  describe('Library', () => {
    it('should manage books', () => {
      const book = db.createBook({
        title: 'Clean Code',
        author: 'Robert C. Martin',
        category: 'Programming',
        description: 'A handbook of agile software craftsmanship',
        createdBy: 1,
      })
      expect(book).toBeDefined()
      expect(book.title).toBe('Clean Code')
      const books = db.getBooks({ search: 'Clean' })
      expect(books.length).toBeGreaterThan(0)
      expect(books[0].title).toContain('Clean')
      expect(db.deleteBook(book.id)).toBe(true)
      expect(db.deleteBook(99999)).toBe(false)
    })
  })

  describe('Exams', () => {
    it('should create exam with questions', () => {
      const exam = db.createExam({
        title: 'JavaScript Final',
        groupId: testGroupId,
        questions: [
          { question: 'What is closure?', options: ['A', 'B', 'C', 'D'], correctAnswer: 0 },
          { question: 'What is hoisting?', options: ['A', 'B', 'C', 'D'], correctAnswer: 1 },
        ],
        timeLimit: 60,
        createdBy: 1,
      })
      expect(exam).toBeDefined()
      expect(exam.questions.length).toBe(2)
      const result = db.submitExamResult({
        examId: exam.id,
        studentId: testStudentId,
        answers: [0, 1],
      })
      expect(result).toBeDefined()
      expect(result.score).toBe(100)
      expect(result.correct).toBe(2)
      expect(result.total).toBe(2)
    })

    it('should get exam results', () => {
      const results = db.getExamResults({ studentId: testStudentId })
      expect(results.length).toBeGreaterThan(0)
    })
  })

  describe('Certificates', () => {
    it('should issue certificates', () => {
      const cert = db.createCertificate({
        studentId: testStudentId,
        studentName: 'Extended Student',
        courseName: 'Python',
        issuedBy: 1,
        issuedByName: 'Admin',
      })
      expect(cert).toBeDefined()
      expect(cert.studentName).toBe('Extended Student')
    })

    it('should filter certificates by student', () => {
      const certs = db.getCertificates({ studentId: testStudentId })
      expect(certs.length).toBeGreaterThan(0)
    })
  })

  describe('QR Codes', () => {
    it('should generate unique QR codes', () => {
      const qr1 = db.generateQRCode({ createdBy: 1 })
      const qr2 = db.generateQRCode({ createdBy: 1 })
      expect(qr1.code).not.toBe(qr2.code)
    })

    it('should verify QR code once (single-use)', () => {
      const qr = db.generateQRCode({ createdBy: 1 })
      expect(db.verifyQRCode(qr.code)).toBeDefined()
      expect(db.verifyQRCode(qr.code)).toBeNull()
    })

    it('should reject invalid QR codes', () => {
      expect(db.verifyQRCode('INVALID123')).toBeNull()
    })
  })

  describe('Audit', () => {
    it('should log audit entries', () => {
      db.logAudit({
        userId: 1,
        userName: 'Admin',
        userRole: 'superadmin',
        action: 'Test action',
        details: 'Testing audit system',
        type: 'test',
      })
      const logs = db.getAuditLogs({})
      expect(logs.length).toBeGreaterThan(0)
      expect(logs.some(l => l.action === 'Test action')).toBe(true)
    })

    it('should filter audit logs', () => {
      const byType = db.getAuditLogs({ type: 'test' })
      expect(byType.length).toBeGreaterThan(0)
    })
  })

  describe('Parent Portal', () => {
    let parentId

    beforeAll(() => {
      const parent = db.getUsers('parent').find(u => u.login === 'extended_parent')
      parentId = parent?.id
      // Link the pre-seeded portal_parent to the test student
      const portalParent = db.getUsers('parent').find(u => u.login === 'portal_parent')
      if (portalParent && testStudentId) {
        const student = db.getStudents({}).find(s => s.id === testStudentId)
        if (student && !student.parentIds.includes(portalParent.id)) {
          db.updateStudent(testStudentId, { parentIds: [...(student.parentIds || []), portalParent.id] })
        }
      }
    })

    it('should get parent children', () => {
      expect(parentId).toBeDefined()
      const children = db.getParentChildren(parentId)
      expect(children.length).toBeGreaterThan(0)
      expect(children[0].name).toBeDefined()
      expect(children[0].groupName).toBeDefined()
    })

    it('should get parent payments', () => {
      expect(parentId).toBeDefined()
      const payments = db.getParentPayments(parentId)
      expect(Array.isArray(payments)).toBe(true)
    })
  })

  describe('Student Portal', () => {
    it('should get student portal data', () => {
      const data = db.getStudentPortalData(testStudentId)
      expect(data).toBeDefined()
      expect(data.student).toBeDefined()
      expect(data.grades).toBeDefined()
      expect(data.payments).toBeDefined()
      expect(data.attendancePercent).toBeDefined()
    })
  })

  describe('Notifications', () => {
    it('should create and retrieve notifications', () => {
      db.createNotification({ title: 'Test Notification', message: 'This is a test', type: 'info' })
      db.createNotification({ title: 'Warning', message: 'This is a warning', type: 'warning', userId: 1 })
      const notifs = db.getNotifications(1)
      expect(notifs.length).toBeGreaterThan(0)
      expect(notifs.some(n => n.title === 'Warning')).toBe(true)
    })

    it('should mark notifications as read', () => {
      db.createNotification({ title: 'Fresh notif', message: 'test', type: 'info', userId: 1 })
      const raw1 = JSON.parse(readFileSync(TEST_DB_PATH, 'utf8'))
      const notif1 = raw1.notifications.find(n => n.title === 'Fresh notif')
      expect(notif1).toBeDefined()
      expect(notif1.read).toBe(false)
      db.markNotificationRead(notif1.id)
      const raw2 = JSON.parse(readFileSync(TEST_DB_PATH, 'utf8'))
      const notif2 = raw2.notifications.find(n => n.id === notif1.id)
      expect(notif2).toBeDefined()
      expect(notif2.read).toBe(true)
    })
  })

  describe('Reports', () => {
    it('should generate yearly reports', () => {
      const reports = db.getReports({ year: 2026 })
      expect(Array.isArray(reports)).toBe(true)
      expect(reports.length).toBe(12)
      for (const r of reports) {
        expect(r.month).toBeGreaterThanOrEqual(1)
        expect(r.month).toBeLessThanOrEqual(12)
        expect(r.monthName).toBeDefined()
        expect(typeof r.revenue).toBe('number')
        expect(typeof r.expense).toBe('number')
      }
    })
  })

  describe('Dashboard', () => {
    it('should return comprehensive stats', () => {
      const stats = db.getDashboardStats()
      expect(stats.totalStudents).toBeGreaterThan(0)
      expect(stats.totalGroups).toBeGreaterThan(0)
      expect(stats.totalRevenue).toBeGreaterThanOrEqual(0)
      expect(stats.totalExpense).toBeGreaterThanOrEqual(0)
      expect(stats.netProfit).toBeDefined()
      expect(stats.debtors).toBeDefined()
      expect(stats.presentToday).toBeDefined()
      expect(stats.attendancePercent).toBeGreaterThanOrEqual(0)
      expect(Array.isArray(stats.teacherRating)).toBe(true)
      expect(Array.isArray(stats.groupStats)).toBe(true)
      expect(Array.isArray(stats.courseStats)).toBe(true)
    })
  })

  describe('Devices', () => {
    it('should log and retrieve devices', () => {
      db.logDevice({ userId: 1, userName: 'Admin', userRole: 'superadmin', device: 'Chrome 120', ip: '127.0.0.1', platform: 'macOS' })
      const devices = db.getDevices({})
      expect(devices.length).toBeGreaterThan(0)
      expect(devices.some(d => d.userId === 1)).toBe(true)
    })
  })

  describe('User Management', () => {
    it('should update user', () => {
      const updated = db.updateUser(1, { name: 'Updated Admin' })
      expect(updated).toBeDefined()
      expect(updated.name).toBe('Updated Admin')
    })

    it('should delete user', () => {
      const newUser = db.createUser({ login: 'delete_me', password: 'test123', name: 'Delete Me', role: 'employee', createdBy: 1 })
      expect(db.deleteUser(newUser.id)).toBe(true)
      expect(db.deleteUser(99999)).toBe(false)
    })
  })

  describe('Database Reset', () => {
    it('should reset database to defaults', () => {
      const data = db.resetDB()
      expect(data).toBeDefined()
      expect(data.users.length).toBe(3)
      expect(data.students.length).toBe(0)
    })
  })
})
