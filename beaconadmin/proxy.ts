import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession, needsPasswordChange } from '@/lib/auth/auth-utils'

export default async function proxy(request: NextRequest) {
  // Skip middleware for static files and API routes we don't want to protect
  const { pathname } = request.nextUrl

  // Skip middleware for specific paths
  const skipPaths = [
    '/login',
    '/change-password',
    '/api/admin/change-password',
    '/api/login',
    '/_next',
    '/favicon.ico',
    '/public'
  ]

  const shouldSkip = skipPaths.some(path => pathname.startsWith(path))

  if (shouldSkip) {
    return NextResponse.next()
  }

  try {
    // Validate admin session
    const admin = await validateAdminSession()

    // If no valid session, redirect to login
    if (!admin) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Check if admin needs to change password
    if (needsPasswordChange(admin) && pathname !== '/change-password') {
      const changePasswordUrl = new URL('/change-password', request.url)
      changePasswordUrl.searchParams.set('forced', 'true')
      return NextResponse.redirect(changePasswordUrl)
    }

    // Add admin role and community access to headers for API routes
    if (pathname.startsWith('/api/')) {
      const response = NextResponse.next()
      response.headers.set('x-admin-id', admin.id)
      response.headers.set('x-admin-role', admin.role)

      if (admin.assigned_communities) {
        response.headers.set('x-admin-communities', JSON.stringify(admin.assigned_communities))
      }

      return response
    }

    // For regular pages, continue with the request
    return NextResponse.next()

  } catch (error) {
    console.error('Middleware error:', error)

    // On error, redirect to login
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/login (login endpoint)
     * - api/admin/change-password (password change endpoint)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - login (login page)
     * - change-password (password change page)
     */
    '/((?!api/login|api/admin/change-password|_next/static|_next/image|favicon.ico|public|login|change-password).*)',
  ],
}