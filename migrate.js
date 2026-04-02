const { drizzle } = require('drizzle-orm/postgres-js')
const { migrate }  = require('drizzle-orm/postgres-js/migrator')
const postgres     = require('postgres')

async function main() {
  const url = process.env.DATABASE_URL || process.env.SECRETSHARE_DB_URL
  if (!url) throw new Error('SECRETSHARE_DB_URL não definida')

  const sql = postgres(url, { max: 1 })
  const db  = drizzle(sql)

  await migrate(db, { migrationsFolder: './drizzle' })
  console.log('✓ Migrations concluídas')

  await sql.end()
}

main().catch(err => {
  console.error('✗ Erro nas migrations:', err)
  process.exit(1)
})