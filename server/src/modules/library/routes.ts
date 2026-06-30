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


// GET /api/library
router.get('/', asyncHandler(async (req, res) => {
  const where: any = { organizationId: req.user.organizationId }
  if (req.query.search) {
    where.OR = [
      { title: { contains: req.query.search as string, mode: 'insensitive' } },
      { author: { contains: req.query.search as string, mode: 'insensitive' } },
    ]
  }
  const books = await prisma.book.findMany({ where, orderBy: { createdAt: 'desc' } })
  res.json({ success: true, message: 'OK', data: books, errors: [] })
}))

// POST /api/library
router.post('/', authorizeRoles('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  const { title, author, category, fileUrl, description } = req.body
  const book = await prisma.book.create({
    data: { organizationId: req.user.organizationId, title, author, category, fileUrl, description, createdById: req.user.userId },
  })
  res.status(201).json({ success: true, message: 'Kitob qo\'shildi', data: book, errors: [] })
}))

// DELETE /api/library/:id
router.delete('/:id', authorizeRoles('super_admin', 'org_admin'), asyncHandler(async (req, res) => {
  await prisma.book.delete({ where: { id: req.params.id } })
  res.json({ success: true, message: "Kitob o'chirildi", data: null, errors: [] })
}))

export default router