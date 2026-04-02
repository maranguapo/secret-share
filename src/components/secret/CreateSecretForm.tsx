'use client'

import { useState, useEffect } from 'react'
import { encrypt } from '@/lib/crypto'
import { buildShareLink } from '@/lib/crypto/shareLink'
import { createSecret } from '@/lib/actions'
import { generatePassphrase } from '@/lib/crypto/passphrase'
import ShareLinkCard from './ShareLinkCard'

// ── Força da passphrase ──────────────────────────────────────────────────────

type Strength = { label: string; color: string; width: string }

function measureStrength(p: string): Strength {
  if (!p)        return { label: '',       color: 'transparent',    width: '0%'   }
  if (p.length < 8)  return { label: 'fraca',  color: 'var(--danger)',  width: '25%'  }
  if (p.length < 14) return { label: 'média',  color: 'var(--warning)', width: '55%'  }
  if (p.length < 20) return { label: 'boa',    color: 'var(--accent)',  width: '75%'  }
  return               { label: 'forte',  color: 'var(--accent)',  width: '100%' }
}

// ── Componente ───────────────────────────────────────────────────────────────

export default function CreateSecretForm() {
  const [shareLink,   setShareLink]   = useState<string | null>(null)
  const [loading,     setLoading]     = useState(false)
  const [passphrase,  setPassphrase]  = useState('')
  const [error,       setError]       = useState<string | null>(null)
  const [expiresIn,   setExpiresIn]   = useState('24h')
  const [charCount,   setCharCount]   = useState(0)
  const MAX_CHARS = 10_000

  const strength = measureStrength(passphrase)

  // Gera passphrase forte automaticamente no primeiro render
  useEffect(() => { setPassphrase(generatePassphrase()) }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!passphrase) { setError('Defina uma passphrase.'); return }
    setLoading(true)
    setError(null)

    const form       = e.currentTarget
    const plaintext  = (form.elements.namedItem('secret')   as HTMLTextAreaElement).value
    const burnOnRead = (form.elements.namedItem('burn')      as HTMLInputElement).checked
    const hint       = (form.elements.namedItem('hint')      as HTMLInputElement).value

    const msMap: Record<string, number> = {
      '1h':  1  * 3600 * 1000,
      '24h': 24 * 3600 * 1000,
      '7d':  7  * 86400 * 1000,
    }

    try {
      const payload = await encrypt(plaintext, passphrase)
      
      const id = await createSecret({
        ...payload,
        hint,
        burn_on_read: burnOnRead,
        expires_at: new Date(Date.now() + msMap[expiresIn]).toISOString(),
      })

      setShareLink(buildShareLink(id, passphrase))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.startsWith('rate_limited:')) {
        const seconds = msg.split(':')[1]
        setError(`Limite atingido. Tente em ${seconds}s.`)
      } else {
        setError('Erro ao criar o segredo. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (shareLink) return <ShareLinkCard link={shareLink} />

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Segredo */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs" style={{ color:'var(--text-secondary)' }}>
          <span>segredo</span>
          <span style={{ color: charCount > MAX_CHARS * 0.9 ? 'var(--danger)' : 'var(--text-secondary)' }}>
            {charCount}/{MAX_CHARS}
          </span>
        </div>
        <textarea
          name="secret"
          required
          maxLength={MAX_CHARS}
          onChange={e => setCharCount(e.target.value.length)}
          placeholder="Cole o segredo aqui..."
          rows={5}
          className="w-full rounded-lg p-3 text-sm resize-none outline-none transition-colors"
          style={{
            background:  'var(--bg-input)',
            border:      '1px solid var(--border)',
            color:       'var(--text-primary)',
          }}
          onFocus={e  => e.target.style.borderColor = 'var(--border-focus)'}
          onBlur={e   => e.target.style.borderColor = 'var(--border)'}
        />
      </div>

      {/* Passphrase + força */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs" style={{ color:'var(--text-secondary)' }}>
          <span>passphrase</span>
          {strength.label && (
            <span style={{ color: strength.color }}>
              força: {strength.label}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            required
            value={passphrase}
            onChange={e => setPassphrase(e.target.value)}
            placeholder="passphrase"
            className="flex-1 rounded-lg p-3 text-sm outline-none transition-colors font-mono"
            style={{
              background: 'var(--bg-input)',
              border:     '1px solid var(--border)',
              color:      'var(--text-primary)',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
            onBlur={e  => e.target.style.borderColor = 'var(--border)'}
          />
          <button
            type="button"
            onClick={() => setPassphrase(generatePassphrase())}
            className="rounded-lg px-3 text-xs transition-colors whitespace-nowrap"
            style={{
              background:   'var(--bg-input)',
              border:       '1px solid var(--border)',
              color:        'var(--accent)',
            }}
          >
            gerar
          </button>
        </div>

        {/* Barra de força */}
        <div className="h-0.5 rounded-full overflow-hidden" style={{ background:'var(--border)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: strength.width, background: strength.color }}
          />
        </div>
      </div>

      {/* Dica */}
      <div className="space-y-1">
        <label className="text-xs" style={{ color:'var(--text-secondary)' }}>
          dica (opcional, armazenada em claro)
        </label>
        <input
          name="hint"
          type="text"
          placeholder="ex: credenciais do projeto x"
          className="w-full rounded-lg p-3 text-sm outline-none transition-colors"
          style={{
            background: 'var(--bg-input)',
            border:     '1px solid var(--border)',
            color:      'var(--text-primary)',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
          onBlur={e  => e.target.style.borderColor = 'var(--border)'}
        />
      </div>

      {/* Opções */}
      <div className="flex flex-wrap gap-4 text-sm">

        {/* Expiração */}
        <div className="space-y-1 flex-1 min-w-32">
          <label className="text-xs" style={{ color:'var(--text-secondary)' }}>expira em</label>
          <select
            value={expiresIn}
            onChange={e => setExpiresIn(e.target.value)}
            className="w-full rounded-lg p-2 text-sm outline-none"
            style={{
              background: 'var(--bg-input)',
              border:     '1px solid var(--border)',
              color:      'var(--text-primary)',
            }}
          >
            <option value="1h">1 hora</option>
            <option value="24h">24 horas</option>
            <option value="7d">7 dias</option>
          </select>
        </div>

        {/* Burn on read */}
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-xs cursor-pointer select-none"
            style={{ color:'var(--text-secondary)' }}>
            <input
              name="burn"
              type="checkbox"
              defaultChecked
              className="accent-[#00c896] w-4 h-4"
            />
            apagar após primeira leitura
          </label>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <p className="text-xs text-center py-2 rounded-lg"
          style={{ color:'var(--danger)', background:'#ff444411', border:'1px solid #ff444433' }}>
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg py-3 text-sm font-bold tracking-widest transition-all"
        style={{
          background:  loading ? 'var(--bg-input)' : 'var(--accent)',
          color:       loading ? 'var(--text-secondary)' : '#000',
          border:      '1px solid transparent',
          cursor:      loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? '⠋ cifrando...' : '→ gerar link seguro'}
      </button>

    </form>
  )
}