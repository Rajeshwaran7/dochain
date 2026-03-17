'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Stethoscope, Users, CreditCard, LogOut, Shield, Menu,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

const NAV_ITEMS = [
  { icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard',     href: '/' },
  { icon: <Stethoscope     className="w-4 h-4" />, label: 'Doctors',       href: '/doctors' },
  { icon: <Users           className="w-4 h-4" />, label: 'Patients',      href: '/patients' },
  { icon: <CreditCard      className="w-4 h-4" />, label: 'Subscriptions', href: '/subscriptions' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    router.push('/auth/login');
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-3 left-3 z-50 md:hidden bg-white border border-gray-200 rounded-xl p-2.5 shadow-sm"
      >
        <Menu className="w-5 h-5 text-gray-700" />
      </button>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-gray-900/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col animate-in">
            <div className="px-5 py-5 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-blue-600 text-lg">Dochain</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-900 p-1">✕</button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                      isActive ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }`}>
                    {item.icon} {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="px-3 pb-4 border-t border-gray-200 pt-4">
              <div className="flex items-center gap-3 px-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-gray-900 text-sm font-medium truncate">{user?.firstName}</div>
                  <div className="text-gray-600 text-xs truncate">{user?.email}</div>
                </div>
              </div>
              <button onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-gray-600 hover:text-red-600 hover:bg-gray-100 transition-all text-sm">
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop sidebar (unchanged) */}
      <aside className="fixed left-0 top-0 h-full w-56 bg-white border-r border-gray-200 flex flex-col z-40 hidden md:flex">
        <div className="px-5 py-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-blue-600 text-lg">Dochain</span>
          </div>
          <div className="text-gray-600 text-xs mt-0.5">Admin Panel</div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isActive ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}>
                {item.icon} {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 pb-4 border-t border-gray-200 pt-4">
          <div className="flex items-center gap-3 px-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-gray-900 text-sm font-medium truncate">{user?.firstName}</div>
              <div className="text-gray-600 text-xs truncate">{user?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-gray-600 hover:text-red-600 hover:bg-gray-100 transition-all text-sm">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
