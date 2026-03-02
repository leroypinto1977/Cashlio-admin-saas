import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(req: NextRequest) {
  const sessionToken = req.cookies.get('better-auth.session_token')
  const isLoggedIn = !!sessionToken
  const isDashboardRoute = req.nextUrl.pathname.startsWith('/dashboard')
  const isLoginPage = req.nextUrl.pathname === '/login'

  if (isDashboardRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
