'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  Calendar, Users, Star, CreditCard, Settings,
  LogOut, Bell, CheckCircle, Clock, TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useDoctorAppointments, useDoctorStats, useDoctorMonthlyStats, useMyProfile } from '@/hooks/useApi';

function StatCard({ icon, label, value, sub, color }: any) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-500 text-sm">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
      </div>
      <div className="font-bold text-2xl text-gray-900">{value ?? '—'}</div>
      {sub && <div className="text-gray-400 text-xs mt-1">{sub}</div>}
    </div>
  );
}

export default function DoctorDashboard() {
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => { if (!isAuthenticated) router.push('/auth/login'); }, [isAuthenticated]);

  const { data: stats } = useDoctorStats();
  const { data: appointments = [] } = useDoctorAppointments({ limit: 5 });
  const { data: profile } = useMyProfile();
  const { data: chartData = [] } = useDoctorMonthlyStats();

  if (!user) return null;

  const todayAppts = appointments.filter((a: any) => {
    const today = new Date().toISOString().split('T')[0];
    return a.appointmentDate === today;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-56 bg-white border-r border-gray-200 flex flex-col z-40 hidden md:flex">
        <div className="px-5 py-5 border-b border-gray-200">
          <Link href="/dashboard" className="font-bold text-violet-600 text-lg">Dochain</Link>
          <div className="text-gray-400 text-xs mt-0.5">Doctor Portal</div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {[
            { icon: <TrendingUp className="w-4 h-4"/>, label: 'Dashboard',    href: '/dashboard' },
            { icon: <Calendar   className="w-4 h-4"/>, label: 'Appointments', href: '/appointments' },
            { icon: <Clock      className="w-4 h-4"/>, label: 'Availability', href: '/availability' },
            { icon: <Users      className="w-4 h-4"/>, label: 'Patients',     href: '/patients' },
            { icon: <Star       className="w-4 h-4"/>, label: 'Reviews',      href: '/reviews' },
            { icon: <CreditCard className="w-4 h-4"/>, label: 'Subscription', href: '/subscription' },
            { icon: <Settings   className="w-4 h-4"/>, label: 'Profile',      href: '/profile' },
          ].map((item) => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all text-sm"
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-3 pb-4 border-t border-gray-200 pt-4">
          <div className="flex items-center gap-3 px-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600 font-bold text-sm">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-gray-800 text-sm font-medium truncate">Dr. {user.firstName}</div>
              <div className="text-gray-400 text-xs truncate">{user.email}</div>
            </div>
          </div>
          <button onClick={() => { clearAuth(); router.push('/auth/login'); }}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-gray-500 hover:text-red-600 hover:bg-gray-100 transition-all text-sm">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="md:pl-56">
        {/* Top bar */}
        <header className="glass sticky top-0 z-30 border-b border-gray-200 px-6 h-14 flex items-center justify-between">
          <h1 className="font-semibold text-gray-800">Dashboard</h1>
          <div className="flex items-center gap-2">
            <button className="btn-ghost p-2"><Bell className="w-4 h-4" /></button>
          </div>
        </header>

        <main className="p-6 space-y-6">
          {/* Greeting */}
          <div className="animate-in">
            <h2 className="text-xl font-bold text-gray-900">Good {getGreeting()}, Dr. {user.firstName} 👋</h2>
            <p className="text-gray-500 text-sm mt-1">Here's what's happening with your practice today.</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Calendar className="w-4 h-4 text-violet-600"/>}
              label="Today's Appointments"
              value={stats?.todayCount ?? 0}
              color="bg-violet-50"
            />
            <StatCard
              icon={<Users className="w-4 h-4 text-sky-600"/>}
              label="Total Patients"
              value={stats?.total ?? 0}
              color="bg-sky-50"
            />
            <StatCard
              icon={<CheckCircle className="w-4 h-4 text-emerald-600"/>}
              label="Completed"
              value={stats?.completed ?? 0}
              color="bg-emerald-50"
            />
            <StatCard
              icon={<Clock className="w-4 h-4 text-amber-600"/>}
              label="Pending"
              value={stats?.pending ?? 0}
              color="bg-amber-50"
            />
          </div>

          <div className="grid lg:grid-cols-5 gap-5">
            {/* Chart */}
            <div className="card p-5 lg:col-span-3">
              <h3 className="font-semibold text-gray-800 mb-4">Appointments (Last 6 months)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', color: '#1f2937' }}
                    cursor={{ fill: '#f3f4f6' }}
                  />
                  <Bar dataKey="appointments" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Today's schedule */}
            <div className="card p-5 lg:col-span-2">
              <h3 className="font-semibold text-gray-800 mb-4">Today's Schedule</h3>
              {todayAppts.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No appointments today</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayAppts.slice(0, 5).map((appt: any) => {
                    const p = appt.patient?.user || {};
                    return (
                      <div key={appt.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50">
                        <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600 text-xs font-bold shrink-0">
                          {p.firstName?.[0]}{p.lastName?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-gray-800 text-sm truncate">{p.firstName} {p.lastName}</div>
                          <div className="text-gray-500 text-xs">{appt.startTime}</div>
                        </div>
                        <span className={`badge ${appt.status === 'confirmed' ? 'badge-green' : 'badge-yellow'}`}>
                          {appt.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              <Link href="/appointments" className="block text-center text-violet-600 text-sm mt-4 hover:underline">
                View all →
              </Link>
            </div>
          </div>

          {/* Profile status */}
          {profile && profile.status === 'pending' && (
            <div className="card p-5 border-amber-500/30 bg-amber-500/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-800">Profile under review</div>
                  <div className="text-gray-500 text-sm">Your doctor profile is being verified. This usually takes 24-48 hours.</div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
