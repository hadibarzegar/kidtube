import { NextRequest, NextResponse } from 'next/server'

const PROTECTED_PATHS = ['/subscriptions', '/bookmarks', '/account']

export function proxy(request: NextRequest) {
  const token = request.cookies.get('site_token')?.value
  const { pathname } = request.nextUrl

  // Redirect guests from protected pages to login with return URL
  if (!token && PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('return', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect logged-in users away from login/register pages to homepage
  if (token && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/login',
    '/register',
    '/subscriptions/:path*',
    '/bookmarks/:path*',
    '/account/:path*',
  ],
}
