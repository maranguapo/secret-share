import Redis from 'ioredis'

type RedisClient = Redis
const globalForRedis = globalThis as unknown as { redis: RedisClient | undefined }

function getRedis(): RedisClient {
  if (globalForRedis.redis) return globalForRedis.redis

  const url = process.env.REDIS_URL ?? process.env.SECRET_SHARE_REDIS_URL
  if (!url) throw new Error('SECRET_SHARE_REDIS_URL não definida')

  globalForRedis.redis = new Redis(url, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
  })
  return globalForRedis.redis
}

export async function checkRateLimit(ip: string): Promise<{
  success: boolean
  remaining: number
  reset: number
}> {
  const redis      = getRedis()
  const key        = `rl:create_secret:${ip}`
  const now        = Date.now()
  const window     = 10 * 60 * 1000
  const limit      = 5
  const clearBefore = now - window

  const pipeline = redis.pipeline()
  pipeline.zremrangebyscore(key, '-inf', clearBefore)
  pipeline.zadd(key, now, `${now}-${Math.random()}`)
  pipeline.zcard(key)
  pipeline.pexpire(key, window)

  const results   = await pipeline.exec()
  const count     = (results?.[2]?.[1] as number) ?? 0
  const success   = count <= limit
  const remaining = Math.max(0, limit - count)
  const reset     = now + window

  return { success, remaining, reset }
}