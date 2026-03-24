'use client';

import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Calendar, Users, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '@/store/auth.store';
import {
  useDoctorAppointments,
  useDoctorStats,
  useDoctorMonthlyStats,
  useMyProfile,
} from '@/hooks/useApi';

interface StatCardProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: string | number | undefined;
  sub?: string;
  color: string;
}

function StatCard({ href, icon, label, value, sub, color }: StatCardProps) {
  return (
    <Link
      href={href}
      className={clsx(
        'stat-card group block rounded-2xl border border-transparent transition-all duration-200',
        'hover:border-violet-200 hover:shadow-md',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2',
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-gray-600">{label}</span>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color}`}>{icon}</div>
      </div>
      <div className="text-2xl font-bold tabular-nums text-gray-900">{value ?? '—'}</div>
      {sub ? <div className="mt-1 text-xs text-gray-500">{sub}</div> : null}
      <div className="mt-3 flex items-center justify-end text-xs font-semibold text-violet-600">
        <span className="opacity-0 transition-opacity group-hover:opacity-100">Open</span>
        <ChevronRight
          className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </div>
    </Link>
  );
}

export default function DoctorDashboard() {
  const { user } = useAuthStore();

  const today = new Date().toISOString().split('T')[0];
  const { data: stats } = useDoctorStats();
  const { data: todayAppointments = [] } = useDoctorAppointments({ date: today });
  const { data: profile } = useMyProfile();
  const { data: chartData = [] } = useDoctorMonthlyStats();

  if (!user) {
    return null;
  }

  return (
    <main className="space-y-6 p-6">
      <div className="animate-in">
        <h2 className="text-xl font-bold text-gray-900">
          Good {getGreeting()}, Dr. {user.firstName} 👋
        </h2>
        <p className="mt-1 text-sm text-gray-600">Here&apos;s what&apos;s happening with your practice today.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          href="/appointments?tab=today"
          icon={<Calendar className="h-4 w-4 text-violet-600" />}
          label="Today's Appointments"
          value={stats?.todayCount ?? 0}
          sub="Today’s schedule"
          color="bg-violet-50"
        />
        <StatCard
          href="/patients"
          icon={<Users className="h-4 w-4 text-sky-600" />}
          label="Total Patients"
          value={stats?.totalPatients ?? 0}
          sub="From completed visits"
          color="bg-sky-50"
        />
        <StatCard
          href="/appointments?tab=completed"
          icon={<CheckCircle className="h-4 w-4 text-emerald-600" />}
          label="Completed"
          value={stats?.completed ?? 0}
          sub="Past visits"
          color="bg-emerald-50"
        />
        <StatCard
          href="/appointments?tab=pending"
          icon={<Clock className="h-4 w-4 text-amber-600" />}
          label="Pending"
          value={stats?.pending ?? 0}
          sub="Awaiting action"
          color="bg-amber-50"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="card p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="font-semibold text-gray-900">Appointments (Last 6 months)</h3>
            <Link
              href="/appointments?tab=today"
              className="hidden shrink-0 text-xs font-semibold text-violet-600 hover:text-violet-700 sm:inline-flex sm:items-center sm:gap-0.5"
            >
              Manage
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  color: '#1f2937',
                }}
                cursor={{ fill: '#f3f4f6' }}
              />
              <Bar dataKey="appointments" fill="#7c3aed" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5 lg:col-span-2">
          <h3 className="mb-4 font-semibold text-gray-900">Today&apos;s Schedule</h3>
          {todayAppointments.length === 0 ? (
            <div className="py-8 text-center">
              <Calendar className="mx-auto mb-2 h-8 w-8 text-gray-400" />
              <p className="text-sm text-gray-500">No appointments today</p>
              <Link
                href="/availability"
                className="mt-3 inline-block text-sm font-medium text-violet-600 hover:underline"
              >
                Set availability
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppointments.slice(0, 5).map((appt: { id: string; status: string; startTime: string; patient?: { user?: { firstName?: string; lastName?: string } } }) => {
                const p = appt.patient?.user ?? {};
                return (
                  <div key={appt.id} className="flex items-center gap-3 rounded-xl bg-gray-50 p-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-xs font-bold text-violet-600">
                      {p.firstName?.[0]}
                      {p.lastName?.[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-gray-900">
                        {p.firstName} {p.lastName}
                      </div>
                      <div className="text-xs text-gray-600">{appt.startTime}</div>
                    </div>
                    <span
                      className={`badge ${appt.status === 'confirmed' ? 'badge-green' : 'badge-yellow'}`}
                    >
                      {appt.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <Link
            href="/appointments?tab=today"
            className="mt-4 flex items-center justify-center gap-1 text-center text-sm font-semibold text-violet-600 hover:text-violet-700"
          >
            View all appointments
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>

      {profile && profile.status === 'pending' ? (
        <div className="card border-amber-500/30 bg-amber-500/5 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">Profile under review</div>
              <div className="text-sm text-gray-600">
                Your doctor profile is being verified. This usually takes 24-48 hours.
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) {
    return 'morning';
  }
  if (h < 17) {
    return 'afternoon';
  }
  return 'evening';
}
