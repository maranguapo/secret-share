import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title:       'SecretShare — compartilhe segredos com segurança',
  description: 'Criptografia AES-256 no browser. Zero-knowledge. Auto-destruct.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
