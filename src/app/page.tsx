import CreateSecretForm from '@/components/secret/CreateSecretForm'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">

      {/* Hero */}
      <div className="animate-fade-in text-center mb-12 space-y-3">
        <div className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full border mb-4"
          style={{ borderColor:'var(--accent)', color:'var(--accent)', background:'var(--accent-dim)' }}>
          <span className="animate-pulse-slow">●</span> zero-knowledge · aes-256-gcm · auto-destruct
        </div>
        <h1 className="text-4xl font-bold tracking-tight" style={{ color:'var(--text-primary)' }}>
          secret<span style={{ color:'var(--accent)' }}>share</span>
        </h1>
        <p className="text-sm max-w-sm mx-auto leading-relaxed" style={{ color:'var(--text-secondary)' }}>
          Seu segredo é cifrado no browser antes de sair do dispositivo.
          O servidor nunca vê o conteúdo.
        </p>
      </div>

      {/* Form card */}
      <div className="animate-fade-in w-full max-w-lg rounded-2xl border p-6 space-y-4"
        style={{ background:'var(--bg-card)', borderColor:'var(--border)', padding: 10}}>
        <CreateSecretForm />
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs" style={{ color:'var(--text-secondary)' }}>
        open source · sem logs · sem tracking
      </p>
    </main>
  )
}