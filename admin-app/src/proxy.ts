import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value
  const { pathname } = request.nextUrl

  // Normalize: strip basePath prefix if present (Next.js with basePath=/admin)
  // In proxy, pathname is the full path including basePath
  const isLoginPage =
    pathname === '/admin/login' ||
    pathname === '/login' ||
    pathname === '/admin/login/'

  if (!token && !isLoginPage) {
    const loginUrl = new URL('/admin/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  if (token && isLoginPage) {
    const channelsUrl = new URL('/admin/channels', request.url)
    return NextResponse.redirect(channelsUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all admin routes
    '/admin/:path*',
  ],
}
