import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const isDev = process.env.NODE_ENV === 'development'

  const csp = [
    "default-src 'self'",
    isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "connect-src 'self' data:",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  const response = NextResponse.next()
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
