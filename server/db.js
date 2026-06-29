import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = join(__dirname, 'crm.json')

const getToday = () => new Date().toLocaleDateString('en-CA')

const defaultData = {
  groups: [
    {
      id: 1, name: 'Frontend (HTML, CSS, JS)', teacher: 'Sardorov S.', price: 500000,
      days: 'Dushanba / Chorshanba / Juma', time: '15:00 - 17:00',
      students: [
        { id: 101, name: 'Aliyev Aziz', phone: '+998901234567', paymentStatus: 'paid', attendance: { [getToday()]: 'present' } },
        { id: 102, name: 'Karimova Nilufar', phone: '+998901234568', paymentStatus: 'debt', attendance: {} },
        { id: 103, name: 'Toshmatov Jahongir', phone: '+998901234569', paymentStatus: 'paid', attendance: {} },
        { id: 104, name: 'Rahimova Zilola', phone: '+998901234570', paymentStatus: 'paid', attendance: {} },
      ],
    },
    {
      id: 2, name: 'IELTS', teacher: 'Johnson R.', price: 800000,
      days: 'Seshanba / Payshanba / Shanba', time: '10:00 - 12:00',
      students: [
        { id: 201, name: 'Umarov Sardor', phone: '+998901234571', paymentStatus: 'debt', attendance: {} },
        { id: 202, name: 'Qodirova Madina', phone: '+998901234572', paymentStatus: 'paid', attendance: {} },
        { id: 203, name: 'Xasanov Bekzod', phone: '+998901234573', paymentStatus: 'paid', attendance: { [getToday()]: 'present' } },
        { id: 204, name: 'Sultonova Dilnoza', phone: '+998901234574', paymentStatus: 'debt', attendance: {} },
      ],
    },
    {
      id: 3, name: 'Python', teacher: 'Kadyrov T.', price: 600000,
      days: 'Dushanba / Chorshanba / Juma', time: '17:00 - 19:00',
      students: [
        { id: 301, name: 'Norov Jasur', phone: '+998901234575', paymentStatus: 'paid', attendance: {} },
        { id: 302, name: 'Ismailova Aziza', phone: '+998901234576', paymentStatus: 'debt', attendance: {} },
        { id: 303, name: 'Rahimov Timur', phone: '+998901234577', paymentStatus: 'paid', attendance: {} },
        { id: 304, name: 'Yusupova Guzal', phone: '+998901234578', paymentStatus: 'paid', attendance: { [getToday()]: 'present' } },
      ],
    },
  ],
  payments: [
    { id: 1, studentId: 101, studentName: 'Aliyev Aziz', groupName: 'Frontend (HTML, CSS, JS)', amount: 500000, date: '2026-06-01', method: 'Naqd' },
    { id: 2, studentId: 202, studentName: 'Qodirova Madina', groupName: 'IELTS', amount: 800000, date: '2026-06-02', method: 'Plastik' },
    { id: 3, studentId: 301, studentName: 'Norov Jasur', groupName: 'Python', amount: 600000, date: '2026-06-03', method: 'Naqd' },
  ],
  nextGroupId: 4,
  nextStudentId: 305,
  nextPaymentId: 4,
}

let data = null

export function initDB() {
  if (existsSync(DB_PATH)) {
    data = JSON.parse(readFileSync(DB_PATH, 'utf-8'))
  } else {
    data = JSON.parse(JSON.stringify(defaultData))
    saveDB()
  }
}

function saveDB() {
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
}

// ───── Groups ─────

export function getGroups() {
  return data.groups.map((g) => ({
    id: g.id,
    name: g.name,
    teacher: g.teacher,
    price: g.price,
    days: g.days,
    time: g.time,
    students: g.students.map((s) => ({
      id: s.id,
      groupId: g.id,
      name: s.name,
      phone: s.phone,
      paymentStatus: s.paymentStatus,
      attendance: s.attendance || {},
    })),
  }))
}

export function createGroup({ name, teacher, price, days, time }) {
  const group = { id: data.nextGroupId++, name, teacher, price, days, time, students: [] }
  data.groups.push(group)
  saveDB()
  return { ...group, students: [] }
}

export function updateGroup(id, { name, teacher, price, days, time }) {
  const idx = data.groups.findIndex((g) => g.id === id)
  if (idx === -1) return null
  const g = data.groups[idx]
  if (name !== undefined) g.name = name
  if (teacher !== undefined) g.teacher = teacher
  if (price !== undefined) g.price = price
  if (days !== undefined) g.days = days
  if (time !== undefined) g.time = time
  saveDB()
  return { ...g, students: g.students.map((s) => ({ ...s, attendance: s.attendance || {} })) }
}

export function deleteGroup(id) {
  const idx = data.groups.findIndex((g) => g.id === id)
  if (idx === -1) return false
  data.groups.splice(idx, 1)
  data.payments = data.payments.filter((p) => !data.groups.some((g) => g.students.some((s) => s.id === p.studentId)))
  saveDB()
  return true
}

// ───── Students ─────

export function addStudent(groupId, { name, phone }) {
  const group = data.groups.find((g) => g.id === groupId)
  if (!group) return null
  const student = { id: data.nextStudentId++, name, phone, paymentStatus: 'debt', attendance: {} }
  group.students.push(student)
  saveDB()
  return { ...student, groupId }
}

export function updateStudent(id, { name, phone }) {
  for (const g of data.groups) {
    const s = g.students.find((s) => s.id === id)
    if (s) {
      if (name !== undefined) s.name = name
      if (phone !== undefined) s.phone = phone
      saveDB()
      return { ...s, groupId: g.id }
    }
  }
  return null
}

export function deleteStudent(id) {
  for (const g of data.groups) {
    const idx = g.students.findIndex((s) => s.id === id)
    if (idx !== -1) {
      g.students.splice(idx, 1)
      saveDB()
      return true
    }
  }
  return false
}

// ───── Payments ─────

export function markPayment(studentId, { amount, method }) {
  for (const g of data.groups) {
    const s = g.students.find((s) => s.id === studentId)
    if (s) {
      s.paymentStatus = 'paid'
      const payment = {
        id: data.nextPaymentId++,
        studentId,
        studentName: s.name,
        groupName: g.name,
        amount: amount || g.price,
        method: method || 'Naqd',
        date: getToday(),
      }
      data.payments.push(payment)
      saveDB()
      return payment
    }
  }
  return null
}

export function getPayments() {
  return [...data.payments].reverse()
}

// ───── Attendance ─────

export function markAttendance(studentId, { date, status }) {
  for (const g of data.groups) {
    const s = g.students.find((s) => s.id === studentId)
    if (s) {
      if (!s.attendance) s.attendance = {}
      s.attendance[date] = status
      saveDB()
      return { studentId, date, status }
    }
  }
  return null
}

// ───── Stats ─────

export function getStats() {
  const totalStudents = data.groups.reduce((sum, g) => sum + g.students.length, 0)
  const activeGroups = data.groups.length
  const debtors = data.groups.reduce((sum, g) => sum + g.students.filter((s) => s.paymentStatus === 'debt').length, 0)
  const revenue = data.groups.reduce((sum, g) => sum + g.students.filter((s) => s.paymentStatus === 'paid').length * g.price, 0)

  const today = getToday()
  let presentToday = 0
  for (const g of data.groups) {
    for (const s of g.students) {
      if (s.attendance?.[today] === 'present') presentToday++
    }
  }

  return {
    totalStudents,
    activeGroups,
    totalRevenue: revenue,
    debtors,
    paidCount: totalStudents - debtors,
    presentToday,
    totalToday: totalStudents,
    attendancePercent: totalStudents > 0 ? Math.round((presentToday / totalStudents) * 100) : 0,
  }
}

export function getDebtors(search = '') {
  const result = []
  for (const g of data.groups) {
    for (const s of g.students) {
      if (s.paymentStatus === 'debt') {
        if (!search || s.name.toLowerCase().includes(search.toLowerCase()) || s.phone.includes(search) || g.name.toLowerCase().includes(search.toLowerCase())) {
          result.push({ id: s.id, name: s.name, phone: s.phone, paymentStatus: s.paymentStatus, groupName: g.name, groupPrice: g.price, groupId: g.id })
        }
      }
    }
  }
  return result
}
