import { Router } from 'express'
import { asyncHandler, authorizeRoles } from '../../shared/middleware/index.js'
import prisma from '../../config/database.js'

const router = Router()

router.use(asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Token talab qilinadi', errors: ['NO_TOKEN'] })
  const token = authHeader.substring(7)
  const { verifyAccessToken } = await import('../../core/auth/auth.service.js')
  const payload = verifyAccessToken(token)
  if (!payload) return res.status(401).json({ success: false, message: 'Yaroqsiz token', errors: ['INVALID_TOKEN'] })
  req.user = payload
  next()
}))


// GET /api/students
router.get('/', asyncHandler(async (req, res) => {
  const students = await prisma.student.findMany({
    where: { organizationId: req.user.organizationId },
    include: { group: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ success: true, message: 'OK', data: students.map(s => ({ ...s, groupName: s.group?.name || 'N/A', group: undefined })), errors: [] })
}))

// POST /api/students
router.post('/', authorizeRoles('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  const { name, phone, groupId, course, parentName, parentPhone } = req.body
  const group = groupId ? await prisma.group.findUnique({ where: { id: groupId } }) : null
  const student = await prisma.student.create({
    data: { organizationId: req.user.organizationId, name, phone, groupId, course, parentName, parentPhone, paymentStatus: 'debt' },
  })
  if (group) {
    await prisma.notification.create({ data: { organizationId: req.user.organizationId, title: 'Yangi o\'quvchi', message: `${name} guruhga qo'shildi`, type: 'info' } })
    if (parentPhone) {
      const parentUser = await prisma.user.findFirst({
        where: { organizationId: req.user.organizationId, phone: parentPhone },
        include: { devices: { select: { deviceInfo: true } } },
      })
      if (parentUser?.email) {
        const { notifyStudentAccepted } = await import('../../services/notification.service.js')
        const startDate = group.startDate?.toLocaleDateString('uz-UZ') || 'N/A'
        notifyStudentAccepted(
          req.user.organizationId, name, group.name || 'N/A',
          group.teacherName || 'N/A', startDate,
          parentUser.email,
          parentUser.devices.map(d => d.deviceInfo).filter(Boolean) as string[]
        )
      }
    }
  }
  res.status(201).json({ success: true, message: "O'quvchi qo'shildi", data: { ...student, groupName: group?.name || 'N/A' }, errors: [] })
}))

// PUT /api/students/:id
router.put('/:id', authorizeRoles('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  const student = await prisma.student.update({ where: { id: req.params.id }, data: req.body })
  res.json({ success: true, message: "O'quvchi yangilandi", data: student, errors: [] })
}))

// DELETE /api/students/:id
router.delete('/:id', authorizeRoles('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  const { id } = req.params

  await prisma.$transaction([
    prisma.payment.deleteMany({ where: { studentId: id } }),
    prisma.attendance.deleteMany({ where: { studentId: id } }),
    prisma.grade.deleteMany({ where: { studentId: id } }),
    prisma.certificate.deleteMany({ where: { studentId: id } }),
    prisma.student.delete({ where: { id } }),
  ])

  res.json({ success: true, message: "O'quvchi o'chirildi", data: null, errors: [] })
}))

export default router