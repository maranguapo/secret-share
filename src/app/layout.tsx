import type { Metadata } from 'next'
import { headers } from 'next/headers'
import './globals.css'

export const metadata: Metadata = {
  title:       'SecretShare — compartilhe segredos com segurança',
  description: 'Criptografia AES-256 no browser. Zero-knowledge. Auto-destruct.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const nonce = headersList.get('x-nonce') ?? ''

  return (
    <html lang="pt-BR">
      <head>
        <meta httpEquiv="Content-Security-Policy"
          content={headersList.get('content-security-policy') ?? ''} />
      </head>
      <body>{children}</body>
    </html>
  )
}