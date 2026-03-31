import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Singleton para não abrir múltiplas conexões em dev (hot reload)
const globalForDb = globalThis as unknown as { db: ReturnType<typeof drizzle> }

function createDb() {
  const sql = postgres(process.env.DATABASE_URL!, {
    max: 10,
    idle_timeout: 30,
  })
  return drizzle(sql, { schema })
}

export const db = globalForDb.db ?? createDb()

if (process.env.NODE_ENV !== 'production') globalForDb.db = db