import { Router } from 'express'
import { asyncHandler } from '../../shared/middleware/index.js'
import prisma from '../../config/database.js'
import redis from '../../config/redis.js'

const router = Router()

// GET /api/health
router.get('/', asyncHandler(async (_, res) => {
  const dbHealthy = await prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false)
  const redisHealthy = await redis.ping().then(() => true).catch(() => false)
  res.json({ success: true, message: 'OK', data: { status: 'healthy', uptime: process.uptime(), database: dbHealthy ? 'healthy' : 'unhealthy', redis: redisHealthy ? 'healthy' : 'unhealthy' }, errors: [] })
}))

// GET /api/health/detailed
router.get('/detailed', asyncHandler(async (_, res) => {
  const dbHealthy = await prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false)
  const redisHealthy = await redis.ping().then(() => true).catch(() => false)
  const mem = process.memoryUsage()
  res.json({ success: true, message: 'OK', data: { status: 'healthy', uptime: process.uptime(), database: dbHealthy ? 'healthy' : 'unhealthy', redis: redisHealthy ? 'healthy' : 'unhealthy', memory: { rss: Math.round(mem.rss / 1024 / 1024) + ' MB', heapUsed: Math.round(mem.heapUsed / 1024 / 1024) + ' MB', heapTotal: Math.round(mem.heapTotal / 1024 / 1024) + ' MB' }, nodeVersion: process.version }, errors: [] })
}))

export default router