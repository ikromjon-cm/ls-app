import Redis from 'ioredis'
import env from './env.js'

const globalForRedis = globalThis

export const redis = globalForRedis.__redis || new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) return null
    return Math.min(times * 200, 2000)
  },
  lazyConnect: true,
})

redis.on('connect', () => console.log('[Redis] Connected'))
redis.on('error', (err) => console.error('[Redis] Error:', err.message))

if (process.env.NODE_ENV !== 'production') globalForRedis.__redis = redis

export default redis
