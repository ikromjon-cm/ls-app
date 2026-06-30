import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as any

function createPrismaClient() {
  const url = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/opencode_crm'
  const isNeon = url.includes('neon.tech')

  return new PrismaClient({
    datasources: {
      db: { url },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    transactionOptions: {
      maxWait: 5000,
      timeout: 10000,
    },
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
