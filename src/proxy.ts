import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {  // ← era "middleware", agora é "proxy"
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const isDev = process.env.NODE_ENV === 'development'

  const csp = `
    default-src 'self';
    script-src  'self' 'nonce-${nonce}' ${isDev ? "'unsafe-eval'" : ''};
    style-src   'self' 'unsafe-inline';
    connect-src 'self'
      ${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''}
      https://*.upstash.io;
    img-src     'self' data:;
    font-src    'self';
    frame-ancestors 'none';
    base-uri    'self';
    form-action 'self';
  `.replace(/\s+/g, ' ').trim()

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('content-security-policy', csp)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('content-security-policy', csp)
  response.headers.set('x-frame-options',        'DENY')
  response.headers.set('x-content-type-options', 'nosniff')
  response.headers.set('referrer-policy',         'no-referrer')
  response.headers.set('permissions-policy',      'camera=(), microphone=(), geolocation=()')

  if (!isDev) {
    response.headers.set(
      'strict-transport-security',
      'max-age=63072000; includeSubDomains; preload'
    )
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}