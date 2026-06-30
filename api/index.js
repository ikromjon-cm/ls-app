// Vercel Serverless Entry Point
// This file enables the Express app to run on Vercel

import express from 'express'
import { createServer } from 'http'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import { rateLimit } from 'express-rate-limit'
import { existsSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yaml'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

// Load env for Vercel (process.env already has Vercel env vars)
const env = {
  NODE_ENV: process.env.NODE_ENV || 'production',
  PORT: process.env.PORT || 3001,
  DATABASE_URL: process.env.DATABASE_URL || '',
  REDIS_URL: process.env.REDIS_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'change-me',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'change-me-too',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@opencode.uz',
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || 'OpenCode CRM',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || '',
}

import('./loader.js').catch(() => {})

const app = express()
const distPath = join(rootDir, 'dist')

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }))
app.use(cors({ origin: env.CORS_ORIGIN, methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-Id'], credentials: true }))
app.use(rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false, message: { success: false, message: "Ko'p so'rov yuborildi", errors: ['RATE_LIMIT'] } }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(compression())

function ok(res, data, message = 'OK') { return res.json({ success: true, message, data, errors: [] }) }
function fail(res, status, message, errors = []) { return res.status(status).json({ success: false, message, data: null, errors: Array.isArray(errors) ? errors : [errors] }) }

app.all('/api/health', (_, res) => ok(res, { status: 'healthy', uptime: process.uptime(), mode: 'vercel-serverless' }))

// Swagger
try {
  const swaggerPath = join(rootDir, 'server', 'docs', 'openapi.yml')
  if (existsSync(swaggerPath)) {
    const swaggerDoc = YAML.parse(readFileSync(swaggerPath, 'utf8'))
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc, { customCss: '.swagger-ui .topbar { display: none }', customSiteTitle: 'OpenCode CRM API Docs' }))
  }
} catch {}

// Redirect all other /api routes to the main server
import('../server/dist/index.js').then(m => {
  app.use('/api', m.default || m)
}).catch(() => {
  app.use('/api/*', (req, res) => fail(res, 503, 'Server starting...'))
})

// SPA
if (existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get('*', (_, res) => res.sendFile(join(distPath, 'index.html')))
}

app.use((_, res) => res.status(404).json({ success: false, message: 'Not found', errors: ['NOT_FOUND'] }))

export default app
