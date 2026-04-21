import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Path yang bisa diakses tanpa login
const PUBLIC_PATHS = ['/', '/login', '/register', '/status', '/forgot-password', '/reset-password', '/about', '/faq']

// Path yang hanya bisa diakses role tertentu
const ROLE_PATHS: Record<string, string[]> = {
  '/dashboard/member': ['MEMBER'],
  '/dashboard/staff': ['STAFF'],
  '/dashboard/manager': ['MANAGER'],
  '/dashboard/chairman': ['CHAIRMAN'],
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('access_token')?.value
  const role = request.cookies.get('user_role')?.value

  // Kalau public path, langsung lanjut
  const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith('/_next'))
  if (isPublic) return NextResponse.next()

  // Kalau belum login, redirect ke login
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Cek role-based access
  for (const [path, allowedRoles] of Object.entries(ROLE_PATHS)) {
    if (pathname.startsWith(path) && role && !allowedRoles.includes(role)) {
      // Redirect ke dashboard sesuai role-nya
      const roleRedirect: Record<string, string> = {
        MEMBER: '/dashboard/member',
        STAFF: '/dashboard/staff',
        MANAGER: '/dashboard/manager',
        CHAIRMAN: '/dashboard/chairman',
      }
      return NextResponse.redirect(new URL(roleRedirect[role] || '/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg).*)',
  ],
}