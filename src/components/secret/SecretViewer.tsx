'use client'

import { useState, useEffect } from 'react'
import { decrypt } from '@/lib/crypto'
import type { ConsumedSecret } from '@/types/secret'

function Countdown({ expiresAt }: { expiresAt?: string }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    if (!expiresAt) return
    const target = new Date(expiresAt).getTime()

    function tick() {
      const diff = target - Date.now()
      if (diff <= 0) { setTimeLeft('expirado'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${h}h ${m}m ${s}s`)
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  if (!timeLeft) return null
  return (
    <span style={{ color: 'var(--warning)', fontFamily: 'monospace' }}>
      expira em {timeLeft}
    </span>
  )
}

type Phase = 'form' | 'decrypting' | 'revealed' | 'error'

export default function SecretViewer({
  secret,
}: {
  secret: ConsumedSecret & { expires_at?: string }
}) {
  const [phase,      setPhase]      = useState<Phase>('form')
  const [passphrase, setPassphrase] = useState('')
  const [plaintext,  setPlaintext]  = useState<string | null>(null)
  const [errorMsg,   setErrorMsg]   = useState<string | null>(null)
  const [revealed,   setRevealed]   = useState(false)

  async function handleDecrypt(e: React.FormEvent) {
    e.preventDefault()
    if (!passphrase) return
    setPhase('decrypting')

    try {

      //DEBUG
      console.log('[debug] passphrase digitada:', passphrase)
      console.log('[debug] secret recebido:', secret)
      //DEBUG

      const result = await decrypt(
        { ciphertext: secret.ciphertext, iv: secret.iv, salt: secret.salt },
        passphrase
      )
      setPlaintext(result)
      setPhase('revealed')
    } catch {
      setErrorMsg('Passphrase incorreta ou dado adulterado.')
      setPhase('error')
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg space-y-4">

        {/* Header */}
        <div className="text-center space-y-1 mb-8">
          <h1 className="text-2xl font-bold tracking-tight">
            secret<span style={{ color: 'var(--accent)' }}>share</span>
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            mensagem segura recebida
          </p>
        </div>

        <div
          className="rounded-2xl border p-6 space-y-4 animate-fade-in"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', padding: 10 }}
        >

          {/* ── Formulário de passphrase ── */}
          {(phase === 'form' || phase === 'error') && (
            <form onSubmit={handleDecrypt} className="space-y-4">
              <div className="text-center space-y-1 pb-2">
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  digite a passphrase para revelar
                </p>
                {secret.hint && (
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    dica: {secret.hint}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <input
                  type="password"
                  required
                  autoFocus
                  value={passphrase}
                  onChange={e => { setPassphrase(e.target.value); setErrorMsg(null) }}
                  placeholder="passphrase"
                  className="w-full rounded-lg p-3 text-sm outline-none transition-colors font-mono"
                  style={{
                    background:  'var(--bg-input)',
                    border:      `1px solid ${phase === 'error' ? 'var(--danger)' : 'var(--border)'}`,
                    color:       'var(--text-primary)',
                  }}
                  onFocus={e => {
                    if (phase !== 'error') e.target.style.borderColor = 'var(--border-focus)'
                  }}
                  onBlur={e => {
                    if (phase !== 'error') e.target.style.borderColor = 'var(--border)'
                  }}
                />
                {errorMsg && (
                  <p
                    className="text-xs px-1"
                    style={{ color: 'var(--danger)' }}
                  >
                    {errorMsg} — tente novamente.
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full rounded-lg py-3 text-sm font-bold tracking-widest transition-all"
                style={{
                  background: 'var(--accent)',
                  color:      '#000',
                  border:     '1px solid transparent',
                }}
              >
                → descriptografar
              </button>
            </form>
          )}

          {/* ── Descriptografando ── */}
          {phase === 'decrypting' && (
            <div className="text-center py-8 space-y-2">
              <p
                className="text-xs animate-pulse-slow"
                style={{ color: 'var(--accent)' }}
              >
                descriptografando...
              </p>
            </div>
          )}

          {/* ── Segredo revelado ── */}
          {phase === 'revealed' && plaintext && (
            <>
              <div
                className="flex justify-between text-xs"
                style={{ color: 'var(--text-secondary)' }}
              >
                {secret.hint && <span>dica: {secret.hint}</span>}
                <Countdown expiresAt={secret.expires_at} />
              </div>

              <div className="relative">
                <pre
                  className="rounded-lg p-4 text-sm whitespace-pre-wrap break-all leading-relaxed"
                  style={{
                    background:  'var(--bg-input)',
                    border:      '1px solid var(--border)',
                    color:       'var(--text-primary)',
                    filter:      revealed ? 'none' : 'blur(6px)',
                    transition:  'filter .3s ease',
                    userSelect:  revealed ? 'text' : 'none',
                    minHeight:   '80px',
                  }}
                >
                  {plaintext}
                </pre>
                {!revealed && (
                  <button
                    onClick={() => setRevealed(true)}
                    className="absolute inset-0 flex items-center justify-center text-sm rounded-lg"
                    style={{ color: 'var(--accent)' }}
                  >
                    clique para revelar
                  </button>
                )}
              </div>

              {secret.remaining !== null && (
                <p
                  className="text-xs text-right"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {secret.remaining === 0
                    ? 'este era o último acesso permitido'
                    : `${secret.remaining} acesso(s) restante(s)`}
                </p>
              )}
            </>
          )}

        </div>

        <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
          descriptografado localmente · servidor nunca viu este conteúdo
        </p>

      </div>
    </main>
  )
}