import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = join(__dirname, 'crm.json')

function read() {
  if (!existsSync(DB_PATH)) return null
  return JSON.parse(readFileSync(DB_PATH, 'utf8'))
}

function write(data) {
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
}

const getToday = () => new Date().toLocaleDateString('en-CA')

const defaultData = () => ({
  groups: [
    { id: 1, name: 'Frontend (HTML, CSS, JS)', teacher: 'Sardorov S.', price: 500000, days: 'Dushanba / Chorshanba / Juma', time: '15:00 - 17:00', students: [
      { id: 1, groupId: 1, name: 'Aliyev Aziz', phone: '+998901234567', paymentStatus: 'paid', attendance: {} },
      { id: 2, groupId: 1, name: 'Karimova Nilufar', phone: '+998901234568', paymentStatus: 'debt', attendance: {} },
      { id: 3, groupId: 1, name: 'Toshmatov Jahongir', phone: '+998901234569', paymentStatus: 'paid', attendance: {} },
      { id: 4, groupId: 1, name: 'Rahimova Zilola', phone: '+998901234570', paymentStatus: 'paid', attendance: {} },
    ]},
    { id: 2, name: 'IELTS', teacher: 'Johnson R.', price: 800000, days: 'Seshanba / Payshanba / Shanba', time: '10:00 - 12:00', students: [
      { id: 5, groupId: 2, name: 'Umarov Sardor', phone: '+998901234571', paymentStatus: 'debt', attendance: {} },
      { id: 6, groupId: 2, name: 'Qodirova Madina', phone: '+998901234572', paymentStatus: 'paid', attendance: {} },
      { id: 7, groupId: 2, name: 'Xasanov Bekzod', phone: '+998901234573', paymentStatus: 'paid', attendance: {} },
      { id: 8, groupId: 2, name: 'Sultonova Dilnoza', phone: '+998901234574', paymentStatus: 'debt', attendance: {} },
    ]},
    { id: 3, name: 'Python', teacher: 'Kadyrov T.', price: 600000, days: 'Dushanba / Chorshanba / Juma', time: '17:00 - 19:00', students: [
      { id: 9, groupId: 3, name: 'Norov Jasur', phone: '+998901234575', paymentStatus: 'paid', attendance: {} },
      { id: 10, groupId: 3, name: 'Ismailova Aziza', phone: '+998901234576', paymentStatus: 'debt', attendance: {} },
      { id: 11, groupId: 3, name: 'Rahimov Timur', phone: '+998901234577', paymentStatus: 'paid', attendance: {} },
      { id: 12, groupId: 3, name: 'Yusupova Guzal', phone: '+998901234578', paymentStatus: 'paid', attendance: {} },
    ]},
  ],
  payments: [
    { id: 1, studentId: 1, studentName: 'Aliyev Aziz', groupName: 'Frontend (HTML, CSS, JS)', amount: 500000, method: 'Naqd', date: '2026-06-01' },
    { id: 2, studentId: 6, studentName: 'Qodirova Madina', groupName: 'IELTS', amount: 800000, method: 'Plastik', date: '2026-06-02' },
    { id: 3, studentId: 9, studentName: 'Norov Jasur', groupName: 'Python', amount: 600000, method: 'Naqd', date: '2026-06-03' },
  ],
  nextGroupId: 4,
  nextStudentId: 13,
  nextPaymentId: 4,
})

function getDB() {
  const db = read()
  if (!db) {
    const seed = defaultData()
    write(seed)
    return seed
  }
  return db
}

// ───── Initialise ─────
export function initDB() {
  getDB()
}

// ───── Groups ─────
export function getGroups() {
  return getDB().groups
}

export function createGroup({ name, teacher, price, days, time }) {
  const db = getDB()
  const group = { id: db.nextGroupId++, name, teacher, price, days, time, students: [] }
  db.groups.push(group)
  write(db)
  return { ...group }
}

export function updateGroup(id, data) {
  const db = getDB()
  const g = db.groups.find((g) => g.id === id)
  if (!g) return null
  Object.assign(g, data)
  write(db)
  return { id: g.id, name: g.name, teacher: g.teacher, price: g.price, days: g.days, time: g.time }
}

export function deleteGroup(id) {
  const db = getDB()
  const idx = db.groups.findIndex((g) => g.id === id)
  if (idx === -1) return false
  db.groups.splice(idx, 1)
  write(db)
  return true
}

// ───── Students ─────
export function addStudent(groupId, { name, phone }) {
  const db = getDB()
  const g = db.groups.find((g) => g.id === groupId)
  if (!g) return null
  const student = { id: db.nextStudentId++, groupId, name, phone, paymentStatus: 'debt', attendance: {} }
  g.students.push(student)
  write(db)
  return { ...student }
}

export function updateStudent(id, { name, phone }) {
  const db = getDB()
  let found = null
  for (const g of db.groups) {
    const s = g.students.find((s) => s.id === id)
    if (s) { found = s; break }
  }
  if (!found) return null
  if (name !== undefined) found.name = name
  if (phone !== undefined) found.phone = phone
  write(db)
  return { id: found.id, groupId: found.groupId, name: found.name, phone: found.phone, paymentStatus: found.paymentStatus }
}

export function deleteStudent(id) {
  const db = getDB()
  for (const g of db.groups) {
    const idx = g.students.findIndex((s) => s.id === id)
    if (idx !== -1) { g.students.splice(idx, 1); write(db); return true }
  }
  return false
}

// ───── Payments ─────
export function markPayment(studentId, { amount, method }) {
  const db = getDB()
  let student = null
  let group = null
  for (const g of db.groups) {
    const s = g.students.find((s) => s.id === studentId)
    if (s) { student = s; group = g; break }
  }
  if (!student) return null
  student.paymentStatus = 'paid'
  const payment = {
    id: db.nextPaymentId++,
    studentId,
    studentName: student.name,
    groupName: group.name,
    amount: amount || group.price,
    method: method || 'Naqd',
    date: getToday(),
  }
  db.payments.push(payment)
  write(db)
  return { ...payment }
}

export function getPayments() {
  return getDB().payments.slice().sort((a, b) => b.id - a.id)
}

// ───── Attendance ─────
export function markAttendance(studentId, { date, status }) {
  const db = getDB()
  let student = null
  for (const g of db.groups) {
    const s = g.students.find((s) => s.id === studentId)
    if (s) { student = s; break }
  }
  if (!student) return null
  if (!student.attendance) student.attendance = {}
  student.attendance[date] = status
  write(db)
  return { studentId, date, status }
}

// ───── Stats ─────
export function getStats() {
  const db = getDB()
  const all = db.groups.flatMap((g) => g.students)
  const totalStudents = all.length
  const activeGroups = db.groups.length
  const debtors = all.filter((s) => s.paymentStatus === 'debt').length
  const totalRevenue = all.filter((s) => s.paymentStatus === 'paid').reduce((sum, s) => {
    const g = db.groups.find((g) => g.id === s.groupId)
    return sum + (g ? g.price : 0)
  }, 0)
  const today = getToday()
  const presentToday = all.filter((s) => s.attendance?.[today] === 'present').length
  return {
    totalStudents,
    activeGroups,
    totalRevenue,
    debtors,
    paidCount: totalStudents - debtors,
    presentToday,
    totalToday: totalStudents,
    attendancePercent: totalStudents > 0 ? Math.round((presentToday / totalStudents) * 100) : 0,
  }
}

export function getDebtors(search = '') {
  const db = getDB()
  const result = []
  for (const g of db.groups) {
    for (const s of g.students) {
      if (s.paymentStatus !== 'debt') continue
      if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.phone.includes(search) && !g.name.toLowerCase().includes(search.toLowerCase())) continue
      result.push({ id: s.id, name: s.name, phone: s.phone, paymentStatus: s.paymentStatus, groupName: g.name, groupPrice: g.price, groupId: g.id })
    }
  }
  return result
}

export { getToday }
