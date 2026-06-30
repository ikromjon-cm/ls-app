import { Router } from 'express'
import { asyncHandler } from '../../shared/middleware/index.js'

const router = Router()

// GET /api/docs
router.get('/docs', asyncHandler(async (_, res) => {
  res.json({ success: true, message: 'API Documentation', data: { swagger: '/api/docs', openapi: '/api/docs.json' }, errors: [] })
}))

// GET /api/docs.json
router.get('/docs.json', asyncHandler(async (_, res) => {
  res.json({ success: true, message: 'OpenAPI Spec', data: {}, errors: [] })
}))

export default router