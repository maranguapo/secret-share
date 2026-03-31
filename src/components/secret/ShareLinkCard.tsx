'use client'

import { useState } from 'react'

export default function ShareLinkCard({ link }: { link: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="animate-fade-in space-y-4">
      <div className="text-center space-y-1">
        <div className="text-2xl">✓</div>
        <p className="text-sm font-bold" style={{ color:'var(--accent)' }}>
          segredo criado com sucesso
        </p>
        <p className="text-xs" style={{ color:'var(--text-secondary)' }}>
          copie o link abaixo e envie ao destinatário
        </p>
      </div>

      <div
        className="rounded-lg p-3 text-xs break-all leading-relaxed cursor-pointer"
        style={{
          background:   'var(--bg-input)',
          border:       '1px solid var(--border)',
          color:        'var(--accent)',
          fontFamily:   'monospace',
        }}
        onClick={handleCopy}
      >
        {link}
      </div>

      <button
        onClick={handleCopy}
        className="w-full rounded-lg py-3 text-sm font-bold tracking-widest transition-all"
        style={{
          background: copied ? 'var(--accent-dim)' : 'var(--accent)',
          color:      copied ? 'var(--accent)'     : '#000',
          border:     copied ? '1px solid var(--accent)' : '1px solid transparent',
        }}
      >
        {copied ? '✓ copiado!' : '→ copiar link'}
      </button>

      <p className="text-xs text-center" style={{ color:'var(--text-secondary)' }}>
        a passphrase está no fragmento{' '}
        <code style={{ color:'var(--accent)' }}>#</code>{' '}
        da URL — nunca enviada ao servidor
      </p>

      <button
        onClick={() => window.location.reload()}
        className="w-full text-xs py-2 rounded-lg transition-colors"
        style={{
          background: 'transparent',
          border:     '1px solid var(--border)',
          color:      'var(--text-secondary)',
        }}
      >
        criar outro segredo
      </button>
    </div>
  )
}