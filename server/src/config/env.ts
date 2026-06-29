import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/opencode_crm'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().default('super-secret-jwt-key-change-in-production'),
  JWT_REFRESH_SECRET: z.string().default('super-secret-refresh-key-change-in-production'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('*'),
  CLICK_MERCHANT_ID: z.string().optional(),
  CLICK_SECRET_KEY: z.string().optional(),
  CLICK_SERVICE_ID: z.string().optional(),
  PAYME_MERCHANT_ID: z.string().optional(),
  PAYME_SECRET_KEY: z.string().optional(),
  UZUM_MERCHANT_ID: z.string().optional(),
  UZUM_SECRET_KEY: z.string().optional(),
  UZUM_TERMINAL_ID: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMS_API_KEY: z.string().optional(),
  SMS_API_URL: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_BUCKET_NAME: z.string().optional(),
  AWS_REGION: z.string().optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
export default env
