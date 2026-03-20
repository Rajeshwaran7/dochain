import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Must stay aligned with `basePath` in `next.config.js`. */
const BASE_PATH = '/doctor';
const AUTH_COOKIE = 'dochain_doctor_auth';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/appointments',
  '/profile',
  '/settings',
  '/availability',
  '/patients',
  '/reviews',
  '/subscription',
];

const AUTH_PAGES = ['/auth/login', '/auth/register'];

/**
 * Strips the Next.js `basePath` so route logic uses app-relative paths (e.g. `/dashboard`).
 */
function pathnameWithoutBase(pathname: string): string {
  if (pathname === BASE_PATH) return '/';
  if (pathname.startsWith(`${BASE_PATH}/`)) return pathname.slice(BASE_PATH.length);
  return pathname;
}

/**
 * Protects doctor routes: requires auth cookie for app sections.
 * Redirects authenticated users away from login/register to dashboard.
 */
export function middleware(request: NextRequest) {
  const pathname = pathnameWithoutBase(request.nextUrl.pathname);
  const hasAuth = request.cookies.get(AUTH_COOKIE)?.value === '1';

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  if (isProtected && !hasAuth) {
    const login = new URL(`${BASE_PATH}/auth/login`, request.url);
    login.searchParams.set('redirect', pathname);
    return NextResponse.redirect(login);
  }

  if (isAuthPage && hasAuth) {
    return NextResponse.redirect(new URL(`${BASE_PATH}/dashboard`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/doctor/dashboard/:path*',
    '/doctor/appointments/:path*',
    '/doctor/profile/:path*',
    '/doctor/settings/:path*',
    '/doctor/availability/:path*',
    '/doctor/patients/:path*',
    '/doctor/reviews/:path*',
    '/doctor/subscription/:path*',
    '/doctor/auth/login',
    '/doctor/auth/register',
  ],
};
