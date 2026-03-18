import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = ['/dashboard', '/appointments', '/profile'];
const AUTH_PAGES = ['/auth/login', '/auth/register'];
const AUTH_COOKIE = 'dochain_auth';

/**
 * Protects routes: requires auth cookie for dashboard/appointments/profile.
 * Redirects authenticated users away from login/register to dashboard.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAuth = request.cookies.get(AUTH_COOKIE)?.value === '1';

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

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
  matcher: ['/dashboard/:path*', '/appointments/:path*', '/profile/:path*', '/auth/login', '/auth/register'],
};
