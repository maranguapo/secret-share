import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

type DrizzleDb = ReturnType<typeof drizzle>
const globalForDb = globalThis as unknown as { db: DrizzleDb | undefined }

export function getDb(): DrizzleDb {
  if (globalForDb.db) return globalForDb.db

  const url = process.env.DATABASE_URL ?? process.env.SECRETSHARE_DB_URL
  if (!url) throw new Error('SECRETSHARE_DB_URL não definida')

  const sql = postgres(url, { max: 10, idle_timeout: 30 })
  globalForDb.db = drizzle(sql, { schema })
  return globalForDb.db
}