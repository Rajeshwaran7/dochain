import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE = 'dochain_doctor_auth';

/**
 * Protects doctor app routes: requires auth cookie for dashboard and other protected paths.
 * Redirects authenticated users away from login/register to dashboard.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAuth = request.cookies.get(AUTH_COOKIE)?.value === '1';

  const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/appointments') || pathname.startsWith('/profile') || pathname.startsWith('/settings');
  const isAuthPage = pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register');

  if (isProtected && !hasAuth) {
    const login = new URL('/auth/login', request.url);
    login.searchParams.set('redirect', pathname);
    return NextResponse.redirect(login);
  }

  if (isAuthPage && hasAuth) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/appointments/:path*', '/profile/:path*', '/settings/:path*', '/auth/login', '/auth/register'],
};
