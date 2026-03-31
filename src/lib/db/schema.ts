import { pgTable, uuid, text, boolean, integer, timestamp } from 'drizzle-orm/pg-core'

export const secrets = pgTable('secrets', {
  id:          uuid('id').primaryKey().defaultRandom(),
  ciphertext:  text('ciphertext').notNull(),
  iv:          text('iv').notNull(),
  salt:        text('salt').notNull(),
  hint:        text('hint'),
  burnOnRead:  boolean('burn_on_read').notNull().default(false),
  viewCount:   integer('view_count').notNull().default(0),
  maxViews:    integer('max_views'),
  expiresAt:   timestamp('expires_at', { withTimezone: true }),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  accessedAt:  timestamp('accessed_at', { withTimezone: true }),
})

export type Secret       = typeof secrets.$inferSelect
export type SecretInsert = typeof secrets.$inferInsert