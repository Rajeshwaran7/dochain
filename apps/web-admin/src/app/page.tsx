'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  Stethoscope, Users, Calendar, CreditCard, Clock, CheckCircle, TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useDashboard } from '@/hooks/useApi';
import Sidebar from '@/components/Sidebar';

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-600 text-sm">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
      </div>
      <div className="font-bold text-2xl text-gray-900">{value}</div>
      {sub && <div className="text-gray-600 text-xs mt-1">{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const { data: stats } = useDashboard();

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login');
  }, [isAuthenticated]);

  if (!user) return null;

  const monthly = stats?.monthlyAppointments ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="md:pl-56">
        <header className="glass sticky top-0 z-30 border-b border-gray-200 px-6 h-14 flex items-center">
          <h1 className="font-semibold text-gray-900">Dashboard</h1>
        </header>

        <main className="p-6 space-y-6">
          <div className="animate-in">
            <h2 className="text-xl font-bold text-gray-900">Welcome, {user.firstName}</h2>
            <p className="text-gray-600 text-sm mt-1">Platform overview and key metrics.</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Stethoscope className="w-4 h-4 text-blue-600" />}
              label="Total Doctors"
              value={stats?.doctors?.total ?? 0}
              sub={`${stats?.doctors?.pending ?? 0} pending approval`}
              color="bg-blue-50"
            />
            <StatCard
              icon={<Users className="w-4 h-4 text-emerald-600" />}
              label="Total Patients"
              value={stats?.patients?.total ?? 0}
              color="bg-emerald-50"
            />
            <StatCard
              icon={<Calendar className="w-4 h-4 text-violet-600" />}
              label="Appointments"
              value={stats?.appointments?.total ?? 0}
              sub={`${stats?.appointments?.completed ?? 0} completed`}
              color="bg-fuchsia-50"
            />
            <StatCard
              icon={<CreditCard className="w-4 h-4 text-amber-600" />}
              label="Monthly Revenue"
              value={`₹${(stats?.revenue?.monthly ?? 0).toLocaleString('en-IN')}`}
              sub={`${stats?.subscriptions?.active ?? 0} active subscriptions`}
              color="bg-amber-50"
            />
          </div>

          <div className="grid lg:grid-cols-5 gap-5">
            <div className="card p-5 lg:col-span-3">
              <h3 className="font-semibold text-gray-900 mb-4">Appointments (Last 6 months)</h3>
              {monthly.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthly} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', color: '#1f2937' }}
                      cursor={{ fill: '#f3f4f6' }}
                    />
                    <Bar dataKey="count" name="Appointments" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-gray-600 text-sm">No data yet</div>
              )}
            </div>

            <div className="card p-5 lg:col-span-2">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-amber-600" />
                    </div>
                    <span className="text-gray-600 text-sm">Pending Doctors</span>
                  </div>
                  <span className="font-bold text-gray-900">{stats?.doctors?.pending ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-gray-600 text-sm">Approved Doctors</span>
                  </div>
                  <span className="font-bold text-gray-900">{stats?.doctors?.approved ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-gray-600 text-sm">Active Subscriptions</span>
                  </div>
                  <span className="font-bold text-gray-900">{stats?.subscriptions?.active ?? 0}</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
