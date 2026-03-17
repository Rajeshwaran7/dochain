'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useSubscriptions } from '@/hooks/useApi';
import Sidebar from '@/components/Sidebar';

const STATUS_BADGE: Record<string, string> = {
  active:    'badge-green',
  pending:   'badge-yellow',
  cancelled: 'badge-red',
  expired:   'badge-gray',
};

export default function SubscriptionsPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [page, setPage] = useState(1);

  useEffect(() => { if (!isAuthenticated) router.push('/auth/login'); }, [isAuthenticated]);

  const { data, isLoading } = useSubscriptions({ page, limit: 20 });

  const subs = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="md:pl-56">
        <header className="glass sticky top-0 z-30 border-b border-gray-200 px-6 h-14 flex items-center">
          <CreditCard className="w-5 h-5 text-blue-600 mr-2" />
          <h1 className="font-semibold text-gray-800">Subscriptions</h1>
        </header>

        <main className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading subscriptions…
            </div>
          ) : subs.length === 0 ? (
            <div className="card p-12 text-center">
              <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-500">No subscriptions found</h3>
            </div>
          ) : (
            <>
              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 text-left">
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Doctor</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Plan</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Amount</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Period</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subs.map((sub: Record<string, unknown>) => {
                      const doctor = (sub.doctor ?? {}) as Record<string, unknown>;
                      const docUser = (doctor.user ?? {}) as Record<string, unknown>;
                      const subStatus = sub.status as string;

                      return (
                        <tr key={sub.id as string} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="text-gray-800 text-sm font-medium">
                              Dr. {docUser.firstName as string} {docUser.lastName as string}
                            </div>
                            <div className="text-gray-500 text-xs">{doctor.specialization as string}</div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="capitalize text-gray-700 text-sm font-medium">{sub.plan as string}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-gray-800 text-sm font-medium">
                              ₹{Number(sub.amount).toLocaleString('en-IN')}
                            </span>
                            <span className="text-gray-400 text-xs">/mo</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={STATUS_BADGE[subStatus] ?? 'badge-gray'}>
                              {subStatus}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-gray-500 text-sm">
                            {sub.currentPeriodStart
                              ? `${new Date(sub.currentPeriodStart as string).toLocaleDateString('en-IN')} — ${new Date(sub.currentPeriodEnd as string).toLocaleDateString('en-IN')}`
                              : '—'
                            }
                          </td>
                          <td className="px-5 py-4 text-gray-500 text-sm">
                            {new Date(sub.createdAt as string).toLocaleDateString('en-IN')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost p-2 disabled:opacity-30">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-gray-500 text-sm">Page {page} of {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-ghost p-2 disabled:opacity-30">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
