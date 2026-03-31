/**
 * Gera o link compartilhável. A passphrase fica no fragmento (#),
 * que não é enviado ao servidor nem logado em qualquer proxy.
 *
 * Formato: https://app.com/s/[uuid]#[passphrase-base64url]
 */
export function buildShareLink(secretId: string, passphrase: string): string {
  const encoded = btoa(passphrase)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')    // base64url sem padding

  const base = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL ?? ''

  return `${base}/s/${secretId}#${encoded}`
}

/**
 * Extrai a passphrase do fragmento da URL na página de leitura.
 * Retorna null se não houver fragmento (link incompleto ou manipulado).
 */
export function extractPassphrase(): string | null {
  if (typeof window === 'undefined') return null
  const fragment = window.location.hash.slice(1)  // remove o '#'
  if (!fragment) return null

  try {
    // Desfaz o base64url e decodifica
    const b64 = fragment
      .replace(/-/g, '+')
      .replace(/_/g, '/')
    return atob(b64)
  } catch {
    return null
  }
}