import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get('admin-session')

  // Protect all routes except login
  const isProtectedRoute = pathname.startsWith('/') && !pathname.startsWith('/login')
  const isLoginRoute = pathname.startsWith('/login')

  if (isProtectedRoute && !sessionCookie) {
    // Redirect to login if accessing protected route without session
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isLoginRoute && sessionCookie) {
    // Redirect to dashboard if already logged in
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}