'use server'

import { headers }        from 'next/headers'
import { eq }             from 'drizzle-orm'
import { getDb }          from '@/lib/db/client'
import { secrets }        from '@/lib/db/schema'
import { checkRateLimit } from '@/lib/ratelimit'
import type { CreateSecretInput, ConsumedSecret } from '@/types/secret'

async function getIP(): Promise<string> {
  const h = await headers()
  return (
    h.get('x-forwarded-for')?.split(',')[0].trim() ??
    h.get('x-real-ip') ??
    '127.0.0.1'
  )
}

export async function createSecret(input: CreateSecretInput): Promise<string> {
  try {
    const ip = await getIP()
    console.log('[create_secret] iniciando, IP:', ip)

    const { success, remaining, reset } = await checkRateLimit(ip)
    console.log('[create_secret] rate limit:', { success, remaining })

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000)
      throw new Error(`rate_limited:${retryAfter}`)
    }

    const db = getDb()
    const [row] = await db
      .insert(secrets)
      .values({
        ciphertext:  input.ciphertext,
        iv:          input.iv,
        salt:        input.salt,
        hint:        input.hint ?? null,
        burnOnRead:  input.burn_on_read,
        expiresAt:   input.expires_at ? new Date(input.expires_at) : null,
        maxViews:    input.max_views ?? null,
      })
      .returning({ id: secrets.id })

    console.log('[create_secret] inserido com id:', row.id)
    return row.id

  } catch (err) {
    console.error('[create_secret] ERRO COMPLETO:', err)
    throw err
  }
}

export async function readSecret(id: string): Promise<ConsumedSecret> {
  const db = getDb()

  return await db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(secrets)
      .where(eq(secrets.id, id))
      .for('update')

    if (!row) throw new Error('not_found_or_expired')

    if (row.expiresAt && row.expiresAt < new Date()) {
      await tx.delete(secrets).where(eq(secrets.id, id))
      throw new Error('not_found_or_expired')
    }

    if (row.maxViews !== null && row.viewCount >= row.maxViews) {
      await tx.delete(secrets).where(eq(secrets.id, id))
      throw new Error('not_found_or_expired')
    }

    if (row.burnOnRead) {
      await tx.delete(secrets).where(eq(secrets.id, id))
      return {
        ciphertext: row.ciphertext,
        iv:         row.iv,
        salt:       row.salt,
        hint:       row.hint,
        remaining:  0,
        expires_at: row.expiresAt?.toISOString(),
      } satisfies ConsumedSecret
    }

    await tx
      .update(secrets)
      .set({ viewCount: row.viewCount + 1, accessedAt: new Date() })
      .where(eq(secrets.id, id))

    const remaining = row.maxViews !== null
      ? row.maxViews - (row.viewCount + 1)
      : null

    return {
      ciphertext: row.ciphertext,
      iv:         row.iv,
      salt:       row.salt,
      hint:       row.hint,
      remaining,
      expires_at: row.expiresAt?.toISOString(),
    } satisfies ConsumedSecret
  })
}