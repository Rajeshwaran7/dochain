'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Search, Star, User, LogOut, Bell, HeartPulse } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useMyAppointments } from '@/hooks/useApi';
import { formatDate, formatTime, getStatusColor } from '@/lib/utils';

export default function DashboardPage() {
  const { user, isAuthenticated, hasHydrated, clearAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) router.push('/auth/login');
  }, [hasHydrated, isAuthenticated, router]);

  const { data: upcoming = [] } = useMyAppointments('confirmed');
  const { data: past = [] } = useMyAppointments('completed');

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Top nav */}
      <nav className="glass sticky top-0 z-40 border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-cyan-600">Dochain</Link>
          <div className="flex items-center gap-2">
            <button className="btn-ghost p-2"><Bell className="w-5 h-5" /></button>
            <button onClick={() => { clearAuth(); router.push('/'); }} className="btn-ghost p-2 text-gray-600 hover:text-red-600">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8 animate-in">
          <h1 className="font-display text-2xl font-bold text-gray-900">
            Hello, {user.firstName} 👋
          </h1>
          <p className="text-gray-600 mt-1">What do you need today?</p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          {[
            { icon: <Search className="w-5 h-5" />, label: 'Find Doctor', href: '/doctors', color: 'text-cyan-600' },
            { icon: <Calendar className="w-5 h-5" />, label: 'Appointments', href: '/appointments', color: 'text-violet-600' },
            { icon: <Star className="w-5 h-5" />, label: 'Reviews', href: '/appointments?tab=completed', color: 'text-amber-600' },
            { icon: <User className="w-5 h-5" />, label: 'My Profile', href: '/profile', color: 'text-emerald-600' },
            { icon: <HeartPulse className="w-5 h-5" />, label: 'Health & records', href: '/health', color: 'text-rose-600' },
          ].map((a) => (
            <Link key={a.label} href={a.href}
              className="card-hover p-5 flex flex-col items-center gap-2 text-center"
            >
              <div className={`${a.color}`}>{a.icon}</div>
              <span className="text-sm text-gray-900 font-medium">{a.label}</span>
            </Link>
          ))}
        </div>

        {/* Upcoming appointments */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Upcoming Appointments</h2>
            <Link href="/appointments" className="text-cyan-600 text-sm hover:underline">View all</Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="card p-8 text-center">
              <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 text-sm">No upcoming appointments</p>
              <Link href="/doctors" className="btn-primary text-sm mt-4 inline-block">Book now</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.slice(0, 3).map((appt: any) => {
                const doc = appt.doctor;
                const u = doc?.user || {};
                return (
                  <div key={appt.id} className="card p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 font-bold text-cyan-600">
                      {u.firstName?.[0]}{u.lastName?.[0]}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">Dr. {u.firstName} {u.lastName}</div>
                      <div className="text-gray-600 text-xs">{doc?.specialization}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-900 text-sm">{formatDate(appt.appointmentDate)}</div>
                      <div className="text-gray-600 text-xs">{formatTime(appt.startTime)}</div>
                    </div>
                    <span className={getStatusColor(appt.status)}>{appt.status}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Past visits */}
        {past.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-4">Recent Visits</h2>
            <div className="space-y-3">
              {past.slice(0, 3).map((appt: any) => {
                const doc = appt.doctor;
                const u = doc?.user || {};
                return (
                  <div key={appt.id} className="card p-4 flex items-center gap-4 opacity-60">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 font-bold text-gray-600">
                      {u.firstName?.[0]}{u.lastName?.[0]}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">Dr. {u.firstName} {u.lastName}</div>
                      <div className="text-gray-500 text-xs">{formatDate(appt.appointmentDate)}</div>
                    </div>
                    <span className={getStatusColor(appt.status)}>{appt.status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
