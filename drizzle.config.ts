import type { Config } from 'drizzle-kit'

export default {
  schema:    './src/lib/db/schema.ts',
  out:       './drizzle',
  dialect:   'postgresql',
  dbCredentials: {
    url: process.env.SECRETSHARE_DB_URL!,
  },
} satisfies Config