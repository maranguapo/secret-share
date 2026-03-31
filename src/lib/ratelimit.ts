import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as { redis: Redis }

const redis = globalForRedis.redis ?? new Redis(process.env.REDIS_URL!, {
  lazyConnect:       true,
  maxRetriesPerRequest: 3,
})

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

// Sliding window via sorted set — 5 requests por IP a cada 10 minutos
export async function checkRateLimit(ip: string): Promise<{
  success:   boolean
  remaining: number
  reset:     number
}> {
  const key       = `rl:create_secret:${ip}`
  const now       = Date.now()
  const window    = 10 * 60 * 1000   // 10 minutos em ms
  const limit     = 5
  const clearBefore = now - window

  const pipeline = redis.pipeline()
  pipeline.zremrangebyscore(key, '-inf', clearBefore)   // remove entradas antigas
  pipeline.zadd(key, now, `${now}-${Math.random()}`)    // adiciona request atual
  pipeline.zcard(key)                                    // conta requests na janela
  pipeline.pexpire(key, window)                          // TTL automático

  const results  = await pipeline.exec()
  const count    = (results?.[2]?.[1] as number) ?? 0
  const success  = count <= limit
  const remaining = Math.max(0, limit - count)
  const reset    = now + window

  return { success, remaining, reset }
}