import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clean existing data
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.message.deleteMany(),
    prisma.certificate.deleteMany(),
    prisma.examResult.deleteMany(),
    prisma.exam.deleteMany(),
    prisma.book.deleteMany(),
    prisma.grade.deleteMany(),
    prisma.homework.deleteMany(),
    prisma.scheduleEntry.deleteMany(),
    prisma.attendance.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.paymentTransaction.deleteMany(),
    prisma.expense.deleteMany(),
    prisma.student.deleteMany(),
    prisma.group.deleteMany(),
    prisma.device.deleteMany(),
    prisma.session.deleteMany(),
    prisma.user.deleteMany(),
    prisma.organizationBranch.deleteMany(),
    prisma.organizationCourse.deleteMany(),
    prisma.subscription.deleteMany(),
    prisma.organization.deleteMany(),
  ])

  // Create default organization
  const org = await prisma.organization.create({
    data: {
      name: 'OpenCode Learning Center',
      slug: 'opencode',
      plan: 'pro',
      branches: { create: { name: 'Markaziy filial' } },
      courses: { create: [
        { name: 'Frontend' }, { name: 'Backend' }, { name: 'IELTS' },
        { name: 'Python' }, { name: 'Mobile' }, { name: 'Design' },
      ]},
    },
  })

  // Create default users
  const password = bcrypt.hashSync('admin123', 12)
  const teacherPwd = bcrypt.hashSync('teacher123', 12)

  const superAdmin = await prisma.user.create({
    data: {
      organizationId: org.id, login: 'superadmin', name: 'Super Admin',
      email: 'superadmin@opencode.uz', password, role: 'super_admin', phone: '+998901234567',
    },
  })

  await prisma.user.create({
    data: {
      organizationId: org.id, login: 'admin1', name: 'Admin Aziza',
      email: 'admin@opencode.uz', password, role: 'org_admin', phone: '+998901234568',
    },
  })

  const teacher = await prisma.user.create({
    data: {
      organizationId: org.id, login: 'teacher1', name: "O'qituvchi Bekzod",
      email: 'teacher@opencode.uz', password: teacherPwd, role: 'teacher', phone: '+998901234569',
    },
  })

  // Create subscription
  await prisma.subscription.create({
    data: {
      organizationId: org.id,
      plan: 'pro',
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  })

  // Create sample groups
  const group1 = await prisma.group.create({
    data: {
      organizationId: org.id, name: 'Frontend N14', course: 'Frontend',
      teacherId: teacher.id, teacherName: teacher.name, room: '201',
      price: 500000, startDate: new Date('2025-01-15'),
      daysOfWeek: JSON.stringify(['monday', 'wednesday', 'friday']),
      startTime: '14:00', endTime: '16:00', monthDuration: 3,
    },
  })

  const group2 = await prisma.group.create({
    data: {
      organizationId: org.id, name: 'IELTS Morning', course: 'IELTS',
      teacherId: teacher.id, teacherName: teacher.name, room: '105',
      price: 600000, startDate: new Date('2025-02-01'),
      daysOfWeek: JSON.stringify(['tuesday', 'thursday', 'saturday']),
      startTime: '09:00', endTime: '11:00', monthDuration: 4,
    },
  })

  // Create sample students
  const student1 = await prisma.student.create({
    data: {
      organizationId: org.id, name: 'Ali Valiyev', phone: '+998901234001',
      groupId: group1.id, course: 'Frontend', parentName: 'Vali Valiyev', parentPhone: '+998901234501',
      paymentStatus: 'paid',
    },
  })

  const student2 = await prisma.student.create({
    data: {
      organizationId: org.id, name: 'Zebo Karimova', phone: '+998901234002',
      groupId: group1.id, course: 'Frontend', parentName: 'Karim Karimov',
      paymentStatus: 'debt',
    },
  })

  const student3 = await prisma.student.create({
    data: {
      organizationId: org.id, name: 'Botir Abdullayev', phone: '+998901234003',
      groupId: group2.id, course: 'IELTS', parentName: 'Abdulla Abdullayev',
      paymentStatus: 'paid',
    },
  })

  // Create sample payments
  await prisma.payment.create({
    data: {
      organizationId: org.id, studentId: student1.id, studentName: student1.name,
      groupId: group1.id, groupName: group1.name,
      amount: 500000, method: 'Naqd', date: new Date('2026-01-05'),
      createdById: superAdmin.id, createdByName: superAdmin.name,
    },
  })

  await prisma.payment.create({
    data: {
      organizationId: org.id, studentId: student3.id, studentName: student3.name,
      groupId: group2.id, groupName: group2.name,
      amount: 600000, method: 'Click', date: new Date('2026-01-10'),
      createdById: superAdmin.id, createdByName: superAdmin.name,
    },
  })

  // Create sample attendance
  const today = new Date()
  await prisma.attendance.create({
    data: {
      organizationId: org.id, studentId: student1.id, date: today,
      status: 'present', markedById: teacher.id,
    },
  })

  await prisma.attendance.create({
    data: {
      organizationId: org.id, studentId: student2.id, date: today,
      status: 'absent', markedById: teacher.id,
    },
  })

  // Create sample homework
  await prisma.homework.create({
    data: {
      organizationId: org.id, groupId: group1.id,
      title: 'React Hooks amaliyot', description: 'useState va useEffect yordamida todo app yozish',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdById: teacher.id, createdByName: teacher.name,
    },
  })

  await prisma.homework.create({
    data: {
      organizationId: org.id, groupId: group2.id,
      title: 'IELTS Writing Task 2', description: '250 word essay on education topics',
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      createdById: teacher.id, createdByName: teacher.name,
    },
  })

  // Create sample grades
  await prisma.grade.create({
    data: { organizationId: org.id, studentId: student1.id, subject: 'JavaScript', score: 92, createdById: teacher.id },
  })
  await prisma.grade.create({
    data: { organizationId: org.id, studentId: student1.id, subject: 'React', score: 88, createdById: teacher.id },
  })
  await prisma.grade.create({
    data: { organizationId: org.id, studentId: student2.id, subject: 'JavaScript', score: 75, createdById: teacher.id },
  })

  // Create sample schedule
  await prisma.scheduleEntry.create({
    data: { organizationId: org.id, groupId: group1.id, subject: 'JavaScript', teacherId: teacher.id, day: 'monday', timeStart: '14:00', timeEnd: '15:30', room: '201' },
  })
  await prisma.scheduleEntry.create({
    data: { organizationId: org.id, groupId: group1.id, subject: 'React', teacherId: teacher.id, day: 'wednesday', timeStart: '14:00', timeEnd: '15:30', room: '201' },
  })
  await prisma.scheduleEntry.create({
    data: { organizationId: org.id, groupId: group2.id, subject: 'IELTS Reading', teacherId: teacher.id, day: 'tuesday', timeStart: '09:00', timeEnd: '10:30', room: '105' },
  })

  // Create sample messages
  await prisma.message.create({
    data: { organizationId: org.id, content: 'Assalomu alaykum, o\'g\'lingizning davomati yaxshi', senderId: teacher.id, receiverId: superAdmin.id },
  })

  // Create sample notifications
  await prisma.notification.create({
    data: { organizationId: org.id, title: 'Yangi o\'quvchi', message: 'Ali Valiyev tizimga qo\'shildi', type: 'info' },
  })
  await prisma.notification.create({
    data: { organizationId: org.id, title: 'To\'lov qilindi', message: 'Botir Abdullayev 600,000 so\'m to\'lov qildi', type: 'success' },
  })

  // Create sample library books
  await prisma.book.create({
    data: { organizationId: org.id, title: 'JavaScript: The Good Parts', author: 'Douglas Crockford', category: 'Programming' },
  })
  await prisma.book.create({
    data: { organizationId: org.id, title: 'IELTS 16 Academic', author: 'Cambridge', category: 'IELTS' },
  })

  console.log('✅ Seed completed successfully!')
  console.log(`\n📊 Statistics:`)
  console.log(`  Organization: ${org.name}`)
  console.log(`  Users: ${await prisma.user.count()}`)
  console.log(`  Groups: ${await prisma.group.count()}`)
  console.log(`  Students: ${await prisma.student.count()}`)
  console.log(`  Payments: ${await prisma.payment.count()}`)
  console.log(`  Attendance: ${await prisma.attendance.count()}`)
  console.log(`  Homework: ${await prisma.homework.count()}`)
  console.log(`  Grades: ${await prisma.grade.count()}`)
  console.log(`  Messages: ${await prisma.message.count()}`)
  console.log(`  Notifications: ${await prisma.notification.count()}`)
  console.log(`\n🔑 Loginlarni eslab qoling:`)
  console.log(`  superadmin / admin123 (Super Admin)`)
  console.log(`  admin1 / admin123 (Org Admin)`)
  console.log(`  teacher1 / teacher123 (Teacher)`)
}

main()
  .catch((e) => { console.error('❌ Seed error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
