import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const isProduction = process.env.NODE_ENV === 'production'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),

  // Database - required, no defaults for production
  DATABASE_URL: z.string().url().refine(url => url.startsWith('postgresql://') || url.startsWith('postgres://'), {
    message: 'DATABASE_URL must be a valid PostgreSQL connection string',
  }),
  DATABASE_URL_UNPOOLED: z.string().url().optional(),

  // Cache
  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  // JWT - MUST be provided, no defaults for security
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().regex(/^\d+[smhd]$/, 'JWT_EXPIRES_IN must be like 24h, 7d, etc.').default('24h'),
  JWT_REFRESH_EXPIRES_IN: z.string().regex(/^\d+[smhd]$/, 'JWT_REFRESH_EXPIRES_IN must be like 24h, 7d, etc.').default('7d'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),

  // CORS - required in production
  CORS_ORIGIN: isProduction ? z.string().url() : z.string().default('*'),

  // Resend Email
  RESEND_API_KEY: z.string().startsWith('re_').optional().or(z.literal('')),
  EMAIL_FROM: z.string().default('noreply@example.com'),
  EMAIL_FROM_NAME: z.string().default('OpenCode CRM'),

  // Firebase Cloud Messaging
  FIREBASE_API_KEY: z.string().optional().or(z.literal('')),
  FIREBASE_PROJECT_ID: z.string().optional().or(z.literal('')),
  FIREBASE_APP_ID: z.string().optional().or(z.literal('')),
  FIREBASE_MESSAGING_SENDER_ID: z.string().optional().or(z.literal('')),
  FIREBASE_CLIENT_EMAIL: z.string().email().optional().or(z.literal('')),
  FIREBASE_PRIVATE_KEY: z.string().min(100, 'FIREBASE_PRIVATE_KEY must be a valid PEM key').optional().or(z.literal('')),

  // Payment Providers
  CLICK_MERCHANT_ID: z.string().optional().or(z.literal('')),
  CLICK_SECRET_KEY: z.string().optional().or(z.literal('')),
  CLICK_SERVICE_ID: z.string().optional().or(z.literal('')),
  PAYME_MERCHANT_ID: z.string().optional().or(z.literal('')),
  PAYME_SECRET_KEY: z.string().optional().or(z.literal('')),
  UZUM_MERCHANT_ID: z.string().optional().or(z.literal('')),
  UZUM_SECRET_KEY: z.string().optional().or(z.literal('')),
  UZUM_TERMINAL_ID: z.string().optional().or(z.literal('')),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional().or(z.literal('')),

  // SMS
  SMS_API_KEY: z.string().optional().or(z.literal('')),
  SMS_API_URL: z.string().url().optional().or(z.literal('')),

  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().optional().or(z.literal('')),

  // Monitoring
  SENTRY_DSN: z.string().url().optional().or(z.literal('')),

  // Storage
  AWS_ACCESS_KEY_ID: z.string().optional().or(z.literal('')),
  AWS_SECRET_ACCESS_KEY: z.string().optional().or(z.literal('')),
  AWS_BUCKET_NAME: z.string().optional().or(z.literal('')),
  AWS_REGION: z.string().optional().or(z.literal('')),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const errors = parsed.error.flatten().fieldErrors
  console.error('\n❌ Invalid environment variables:')
  Object.entries(errors).forEach(([field, messages]) => {
    console.error(`  ${field}: ${messages.join(', ')}`)
  })
  console.error('\n📋 Copy server/.env.example to server/.env and fill in the values\n')
  process.exit(1)
}

if (isProduction) {
  const weakSecrets: string[] = []
  if (parsed.data.JWT_SECRET.length < 64) weakSecrets.push('JWT_SECRET (use 64+ chars)')
  if (parsed.data.JWT_REFRESH_SECRET.length < 64) weakSecrets.push('JWT_REFRESH_SECRET (use 64+ chars)')
  if (parsed.data.SESSION_SECRET.length < 64) weakSecrets.push('SESSION_SECRET (use 64+ chars)')
  if (weakSecrets.length > 0) {
    console.error('\n⚠️  Production security warning:')
    weakSecrets.forEach(s => console.error(`  ${s} should be 64+ characters for production`))
  }
}

export const env = parsed.data
export default env