import pg from 'pg'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/opencode_crm',
})

const getToday = () => new Date().toLocaleDateString('en-CA')

export async function initDB() {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS course_groups (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        teacher TEXT NOT NULL,
        price INTEGER NOT NULL,
        days TEXT NOT NULL,
        time TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        group_id INTEGER NOT NULL REFERENCES course_groups(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        payment_status TEXT NOT NULL DEFAULT 'debt'
      );

      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        UNIQUE(student_id, date)
      );

      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        student_name TEXT NOT NULL,
        group_name TEXT NOT NULL,
        amount INTEGER NOT NULL,
        method TEXT NOT NULL DEFAULT 'Naqd',
        date TEXT NOT NULL
      );
    `)

    const { rowCount } = await client.query('SELECT COUNT(*) as c FROM course_groups')
    if (parseInt(rowCount[0]?.c || '0') === 0) await seedData(client)
  } finally {
    client.release()
  }
}

async function seedData(client) {
  const today = getToday()

  const g1 = (await client.query(
    `INSERT INTO course_groups (name, teacher, price, days, time) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    ['Frontend (HTML, CSS, JS)', 'Sardorov S.', 500000, 'Dushanba / Chorshanba / Juma', '15:00 - 17:00']
  )).rows[0].id

  const g2 = (await client.query(
    `INSERT INTO course_groups (name, teacher, price, days, time) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    ['IELTS', 'Johnson R.', 800000, 'Seshanba / Payshanba / Shanba', '10:00 - 12:00']
  )).rows[0].id

  const g3 = (await client.query(
    `INSERT INTO course_groups (name, teacher, price, days, time) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    ['Python', 'Kadyrov T.', 600000, 'Dushanba / Chorshanba / Juma', '17:00 - 19:00']
  )).rows[0].id

  const students = [
    [g1, 'Aliyev Aziz', '+998901234567', 'paid'],
    [g1, 'Karimova Nilufar', '+998901234568', 'debt'],
    [g1, 'Toshmatov Jahongir', '+998901234569', 'paid'],
    [g1, 'Rahimova Zilola', '+998901234570', 'paid'],
    [g2, 'Umarov Sardor', '+998901234571', 'debt'],
    [g2, 'Qodirova Madina', '+998901234572', 'paid'],
    [g2, 'Xasanov Bekzod', '+998901234573', 'paid'],
    [g2, 'Sultonova Dilnoza', '+998901234574', 'debt'],
    [g3, 'Norov Jasur', '+998901234575', 'paid'],
    [g3, 'Ismailova Aziza', '+998901234576', 'debt'],
    [g3, 'Rahimov Timur', '+998901234577', 'paid'],
    [g3, 'Yusupova Guzal', '+998901234578', 'paid'],
  ]

  const studentIds = []
  for (const [gid, name, phone, status] of students) {
    const r = await client.query(
      `INSERT INTO students (group_id, name, phone, payment_status) VALUES ($1,$2,$3,$4) RETURNING id`,
      [gid, name, phone, status]
    )
    studentIds.push(r.rows[0].id)
  }

  // Mark today's attendance for some students
  await client.query(
    `INSERT INTO attendance (student_id, date, status) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
    [studentIds[0], today, 'present']
  )
  await client.query(
    `INSERT INTO attendance (student_id, date, status) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
    [studentIds[6], today, 'present']
  )
  await client.query(
    `INSERT INTO attendance (student_id, date, status) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
    [studentIds[11], today, 'present']
  )

  // Sample payments
  await client.query(
    `INSERT INTO payments (student_id, student_name, group_name, amount, method, date) VALUES ($1,$2,$3,$4,$5,$6)`,
    [studentIds[0], 'Aliyev Aziz', 'Frontend (HTML, CSS, JS)', 500000, 'Naqd', '2026-06-01']
  )
  await client.query(
    `INSERT INTO payments (student_id, student_name, group_name, amount, method, date) VALUES ($1,$2,$3,$4,$5,$6)`,
    [studentIds[5], 'Qodirova Madina', 'IELTS', 800000, 'Plastik', '2026-06-02']
  )
  await client.query(
    `INSERT INTO payments (student_id, student_name, group_name, amount, method, date) VALUES ($1,$2,$3,$4,$5,$6)`,
    [studentIds[8], 'Norov Jasur', 'Python', 600000, 'Naqd', '2026-06-03']
  )
}

// ───── Groups ─────

export async function getGroups() {
  const { rows: groups } = await pool.query('SELECT * FROM course_groups ORDER BY id')
  const { rows: students } = await pool.query('SELECT * FROM students ORDER BY id')
  const { rows: attendanceRows } = await pool.query('SELECT * FROM attendance')

  const attMap = {}
  for (const a of attendanceRows) {
    if (!attMap[a.student_id]) attMap[a.student_id] = {}
    attMap[a.student_id][a.date] = a.status
  }

  return groups.map((g) => ({
    id: g.id,
    name: g.name,
    teacher: g.teacher,
    price: g.price,
    days: g.days,
    time: g.time,
    students: students
      .filter((s) => s.group_id === g.id)
      .map((s) => ({
        id: s.id,
        groupId: g.id,
        name: s.name,
        phone: s.phone,
        paymentStatus: s.payment_status,
        attendance: attMap[s.id] || {},
      })),
  }))
}

export async function createGroup({ name, teacher, price, days, time }) {
  const { rows } = await pool.query(
    `INSERT INTO course_groups (name, teacher, price, days, time) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [name, teacher, price, days, time]
  )
  const g = rows[0]
  return { id: g.id, name: g.name, teacher: g.teacher, price: g.price, days: g.days, time: g.time, students: [] }
}

export async function updateGroup(id, data) {
  const fields = []
  const values = []
  let i = 1
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      const col = key === 'teacher' ? 'teacher' : key === 'price' ? 'price' : key === 'days' ? 'days' : key === 'time' ? 'time' : key === 'name' ? 'name' : null
      if (col) {
        fields.push(`${col} = $${i++}`)
        values.push(val)
      }
    }
  }
  if (fields.length === 0) return null
  values.push(id)
  const { rows } = await pool.query(
    `UPDATE course_groups SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  )
  if (rows.length === 0) return null
  const g = rows[0]
  return { id: g.id, name: g.name, teacher: g.teacher, price: g.price, days: g.days, time: g.time }
}

export async function deleteGroup(id) {
  const { rowCount } = await pool.query('DELETE FROM course_groups WHERE id = $1', [id])
  return rowCount > 0
}

// ───── Students ─────

export async function addStudent(groupId, { name, phone }) {
  const { rows } = await pool.query(
    `INSERT INTO students (group_id, name, phone, payment_status) VALUES ($1,$2,$3,'debt') RETURNING *`,
    [groupId, name, phone]
  )
  const s = rows[0]
  return { id: s.id, groupId: s.group_id, name: s.name, phone: s.phone, paymentStatus: s.payment_status, attendance: {} }
}

export async function updateStudent(id, { name, phone }) {
  const fields = []
  const values = []
  let i = 1
  if (name !== undefined) { fields.push(`name = $${i++}`); values.push(name) }
  if (phone !== undefined) { fields.push(`phone = $${i++}`); values.push(phone) }
  if (fields.length === 0) return null
  values.push(id)
  const { rows } = await pool.query(
    `UPDATE students SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  )
  if (rows.length === 0) return null
  const s = rows[0]
  return { id: s.id, groupId: s.group_id, name: s.name, phone: s.phone, paymentStatus: s.payment_status }
}

export async function deleteStudent(id) {
  const { rowCount } = await pool.query('DELETE FROM students WHERE id = $1', [id])
  return rowCount > 0
}

// ───── Payments ─────

export async function markPayment(studentId, { amount, method }) {
  const { rows: sRows } = await pool.query('SELECT * FROM students WHERE id = $1', [studentId])
  if (sRows.length === 0) return null
  const s = sRows[0]
  const { rows: gRows } = await pool.query('SELECT * FROM course_groups WHERE id = $1', [s.group_id])
  const g = gRows[0]

  await pool.query("UPDATE students SET payment_status = 'paid' WHERE id = $1", [studentId])
  const { rows: pRows } = await pool.query(
    `INSERT INTO payments (student_id, student_name, group_name, amount, method, date) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [studentId, s.name, g.name, amount || g.price, method || 'Naqd', getToday()]
  )
  return pRows[0]
}

export async function getPayments() {
  const { rows } = await pool.query('SELECT * FROM payments ORDER BY date DESC, id DESC')
  return rows
}

// ───── Attendance ─────

export async function markAttendance(studentId, { date, status }) {
  const { rowCount } = await pool.query('SELECT 1 FROM students WHERE id = $1', [studentId])
  if (rowCount === 0) return null
  await pool.query(
    `INSERT INTO attendance (student_id, date, status) VALUES ($1,$2,$3) ON CONFLICT (student_id, date) DO UPDATE SET status = $3`,
    [studentId, date, status]
  )
  return { studentId, date, status }
}

// ───── Stats ─────

export async function getStats() {
  const { rows: ts } = await pool.query('SELECT COUNT(*) as c FROM students')
  const totalStudents = parseInt(ts[0].c)
  const { rows: ag } = await pool.query('SELECT COUNT(*) as c FROM course_groups')
  const activeGroups = parseInt(ag[0].c)
  const { rows: db } = await pool.query("SELECT COUNT(*) as c FROM students WHERE payment_status = 'debt'")
  const debtors = parseInt(db[0].c)
  const { rows: rev } = await pool.query(`
    SELECT COALESCE(SUM(g.price), 0) as rev FROM students s
    JOIN course_groups g ON s.group_id = g.id
    WHERE s.payment_status = 'paid'
  `)
  const totalRevenue = parseInt(rev[0].rev)

  const today = getToday()
  const { rows: pt } = await pool.query(
    "SELECT COUNT(*) as c FROM attendance WHERE date = $1 AND status = 'present'", [today]
  )
  const presentToday = parseInt(pt[0].c)

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

export async function getDebtors(search = '') {
  const like = `%${search}%`
  const { rows } = await pool.query(`
    SELECT s.id, s.name, s.phone, s.payment_status, g.name as "groupName", g.price as "groupPrice", g.id as "groupId"
    FROM students s JOIN course_groups g ON s.group_id = g.id
    WHERE s.payment_status = 'debt'
    AND (s.name ILIKE $1 OR s.phone ILIKE $1 OR g.name ILIKE $1)
    ORDER BY s.name
  `, [like])
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    paymentStatus: r.payment_status,
    groupName: r.groupName,
    groupPrice: r.groupPrice,
    groupId: r.groupId,
  }))
}

export { getToday }
