import express from 'express'
import { createServer } from 'http'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import { rateLimit } from 'express-rate-limit'
import { existsSync, mkdirSync, appendFileSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import env from './config/env.js'
import prisma from './config/database.js'
import redis from './config/redis.js'
import { setupSocketIO } from './config/socket.js'
import { sanitizeInput, checkOrganization } from './shared/middleware/index.js'
import apiRoutes from './routes/api.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distPath = join(__dirname, '..', '..', 'dist')
const logDir = join(__dirname, '..', 'logs')

const app = express()
const httpServer = createServer(app)

setupSocketIO(httpServer)

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'", 'ws:', 'wss:'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
}))
// Healthcheck — must be before rate-limit, auth, etc.
app.get('/health', (_req, res) => res.json({ success: true, message: 'OK', errors: [] }))

app.use(cors({ origin: env.CORS_ORIGIN, methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-Id'], credentials: true }))
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false, message: { success: false, message: "Ko'p so'rov yuborildi", errors: ['RATE_LIMIT'] } }))

app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))
app.use(compression())
app.use(sanitizeInput)
app.use(checkOrganization)

if (!existsSync(logDir)) mkdirSync(logDir)
const logStream = { write: (msg) => { const d = new Date().toISOString().split('T')[0]; appendFileSync(join(logDir, `access-${d}.log`), msg, 'utf8') } }
app.use(morgan('combined', { stream: logStream }))
app.use(morgan('dev'))

function ok(res, data, message = 'OK') { return res.json({ success: true, message, data, errors: [] }) }
function created(res, data, message = 'Created') { return res.status(201).json({ success: true, message, data, errors: [] }) }
function fail(res, status, message, errors = []) { return res.status(status).json({ success: false, message, data: null, errors: Array.isArray(errors) ? errors : [errors] }) }

app.use('/api', apiRoutes)

if (existsSync(distPath)) {
  app.use(express.static(distPath, { maxAge: '7d', etag: true, lastModified: true }))
  app.get('*', (_, res) => res.sendFile(join(distPath, 'index.html')))
}

app.use((err, _req, res, _next) => {
  const status = err.status || 500
  const message = status === 500 ? 'Serverda xatolik yuz berdi' : (err.message || 'Serverda xatolik yuz berdi')
  if (status >= 500) {
    console.error(`[ERROR ${status}]`, err.stack || err.message || err)
    try {
      const d = new Date().toISOString().split('T')[0]
      appendFileSync(join(logDir, `error-${d}.log`), `[${new Date().toISOString()}] ${err.stack || err}\n`, 'utf8')
    } catch {}
  }
  if (env.NODE_ENV === 'production' && status === 500) {
    res.status(500).json({ success: false, message: 'Serverda xatolik yuz berdi', errors: ['SERVER_ERROR'] })
  } else {
    res.status(status).json({ success: false, message, errors: ['SERVER_ERROR'] })
  }
})

const PORT = env.PORT
httpServer.listen(PORT, async () => {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`  🚀 Enterprise CRM Server`)
  console.log(`  📡 Port: ${PORT}`)
  console.log(`  🌍 Env: ${env.NODE_ENV}`)
  console.log(`  🗄️  Database: PostgreSQL`)
  console.log(`  ⚡ Cache: Redis`)
  console.log(`  🔌 Socket.io: Ready`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
  try { await redis.connect(); console.log('  ✓ Redis connected') } catch { console.log('  ⚠ Redis not available (optional)') }
})

export default app