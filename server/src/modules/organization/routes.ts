import { Router } from 'express'
import { asyncHandler, authorizeRoles } from '../../shared/middleware/index.js'
import { hashPassword } from '../../core/auth/auth.service.js'
import prisma from '../../config/database.js'

const router = Router()

// POST /api/organizations/register
router.post('/register', asyncHandler(async (req, res) => {
  const { name, slug, adminName, adminEmail, adminPassword } = req.body
  if (!name || !slug || !adminName || !adminEmail || !adminPassword) return res.status(400).json({ success: false, message: 'Barcha maydonlar talab qilinadi', errors: [] })
  const existing = await prisma.organization.findUnique({ where: { slug } })
  if (existing) return res.status(409).json({ success: false, message: 'Bunday slug mavjud', errors: [] })
  const org = await prisma.organization.create({
    data: {
      name, slug, plan: 'starter',
      branches: { create: { name: 'Asosiy filial' } },
      courses: { create: [{ name: 'Frontend' }, { name: 'Backend' }, { name: 'IELTS' }, { name: 'Python' }, { name: 'Mobile' }, { name: 'Design' }] },
    },
  })
  const user = await prisma.user.create({
    data: { organizationId: org.id, login: adminEmail, email: adminEmail, name: adminName, password: hashPassword(adminPassword), role: 'org_admin' },
  })
  res.status(201).json({ success: true, message: 'Tashkilot yaratildi', data: { organization: org, user: { id: user.id, name: user.name, email: user.email, role: user.role } }, errors: [] })
}))

export default router