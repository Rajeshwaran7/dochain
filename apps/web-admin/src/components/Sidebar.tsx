'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Stethoscope, Users, CreditCard, LogOut, Shield,
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

  const handleLogout = () => {
    clearAuth();
    router.push('/auth/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-white border-r border-gray-200 flex flex-col z-40 hidden md:flex">
      <div className="px-5 py-5 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-blue-600 text-lg">Dochain</span>
        </div>
        <div className="text-gray-400 text-xs mt-0.5">Admin Panel</div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
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
            <div className="text-gray-800 text-sm font-medium truncate">{user?.firstName}</div>
            <div className="text-gray-400 text-xs truncate">{user?.email}</div>
          </div>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-gray-500 hover:text-red-600 hover:bg-gray-100 transition-all text-sm">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </aside>
  );
}
