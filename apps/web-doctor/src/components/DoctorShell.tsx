'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, X } from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '@/store/auth.store';
import { getAppPath } from '@/lib/app-path';
import { PORTAL_NAV, portalTitleForPath } from '@/config/portal-nav';

/**
 * Persistent doctor portal layout: sidebar, mobile drawer, top bar, and main content area.
 */
export function DoctorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const appPath = getAppPath(pathname ?? '/');
  const title = portalTitleForPath(appPath);
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [appPath]);

  if (!user) {
    return null;
  }

  const signOut = () => {
    clearAuth();
    router.push('/auth/login');
  };

  const navLinkClass = (href: string) =>
    clsx(
      'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm',
      appPath === href || appPath.startsWith(`${href}/`)
        ? 'bg-violet-50 text-violet-800 font-medium'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <aside className="fixed left-0 top-0 z-40 hidden h-full w-56 flex-col border-r border-gray-200 bg-white md:flex">
        <div className="border-b border-gray-200 px-5 py-5">
          <Link href="/dashboard" className="text-lg font-bold text-violet-600">
            Dochain
          </Link>
          <div className="mt-0.5 text-xs text-gray-500">Doctor Portal</div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {PORTAL_NAV.map(({ href, label, Icon }) => (
            <Link key={href} href={href} className={navLinkClass(href)}>
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-gray-200 px-3 pb-4 pt-4">
          <div className="mb-3 flex items-center gap-3 px-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-sm font-bold text-violet-600">
              {user.firstName?.[0]}
              {user.lastName?.[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-gray-900">Dr. {user.firstName}</div>
              <div className="truncate text-xs text-gray-500">{user.email}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-600 transition-all hover:bg-gray-100 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sign out
          </button>
        </div>
      </aside>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-gray-900/50"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="animate-in absolute left-0 top-0 flex h-full w-64 flex-col border-r border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-5">
              <div>
                <Link href="/dashboard" className="text-lg font-bold text-violet-600">
                  Dochain
                </Link>
                <div className="mt-0.5 text-xs text-gray-600">Doctor Portal</div>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="p-1 text-gray-500 hover:text-gray-900"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
              {PORTAL_NAV.map(({ href, label, Icon }) => (
                <Link key={href} href={href} className={navLinkClass(href)}>
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  {label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-gray-200 px-3 pb-4 pt-4">
              <button
                type="button"
                onClick={signOut}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-600 transition-all hover:bg-gray-100 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                Sign out
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      <div className="md:pl-56">
        <header className="glass sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="-ml-2 p-2 text-gray-600 hover:text-gray-900 md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="truncate font-semibold text-gray-900">{title}</h1>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
