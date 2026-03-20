'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Loader2, ChevronLeft, ChevronRight, MoreVertical, X } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useSubscriptions, useCancelSubscription, useUpdateSubscriptionStatus } from '@/hooks/useApi';
import Sidebar from '@/components/Sidebar';

const STATUS_BADGE: Record<string, string> = {
  active:    'badge-green',
  pending:   'badge-yellow',
  cancelled: 'badge-red',
  expired:   'badge-gray',
  inactive:  'badge-gray',
};

const STATUS_OPTIONS = ['active', 'pending', 'cancelled', 'expired', 'inactive'] as const;

export default function SubscriptionsPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [cancelModal, setCancelModal] = useState<{ id: string } | null>(null);
  const [statusModal, setStatusModal] = useState<{ id: string; current: string } | null>(null);

  useEffect(() => { if (!isAuthenticated) router.push('/auth/login'); }, [isAuthenticated]);

  const params = { page, limit: 20, ...(statusFilter ? { status: statusFilter } : {}) };
  const { data, isLoading } = useSubscriptions(params);
  const { mutateAsync: cancelSub, isPending: isCancelling } = useCancelSubscription();
  const { mutateAsync: updateStatus, isPending: isUpdating } = useUpdateSubscriptionStatus();

  const subs = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handleCancel = async () => {
    if (!cancelModal) return;
    await cancelSub({ id: cancelModal.id });
    setCancelModal(null);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!statusModal) return;
    await updateStatus({ id: statusModal.id, status: newStatus });
    setStatusModal(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="md:pl-56">
        <header className="glass sticky top-0 z-30 border-b border-gray-200 px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-blue-600 shrink-0" />
            <h1 className="font-semibold text-gray-900">Subscriptions</h1>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700"
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </header>

        <main className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-gray-600">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading subscriptions…
            </div>
          ) : subs.length === 0 ? (
            <div className="card p-12 text-center">
              <CreditCard className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-600">No subscriptions found</h3>
            </div>
          ) : (
            <>
              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 text-left">
                      <th className="px-5 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide">Doctor</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide">Plan</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide">Amount</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide">Status</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide">Period</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide">Created</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide">Actions</th>
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
                            <div className="text-gray-900 text-sm font-medium">
                              Dr. {docUser.firstName as string} {docUser.lastName as string}
                            </div>
                            <div className="text-gray-600 text-xs">{doctor.specialization as string}</div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="capitalize text-gray-900 text-sm font-medium">{sub.plan as string}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-gray-900 text-sm font-medium">
                              ₹{Number(sub.amount).toLocaleString('en-IN')}
                            </span>
                            <span className="text-gray-600 text-xs">/mo</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={STATUS_BADGE[subStatus] ?? 'badge-gray'}>
                              {subStatus}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-gray-600 text-sm">
                            {sub.currentPeriodStart
                              ? `${new Date(sub.currentPeriodStart as string).toLocaleDateString('en-IN')} — ${new Date(sub.currentPeriodEnd as string).toLocaleDateString('en-IN')}`
                              : '—'
                            }
                          </td>
                          <td className="px-5 py-4 text-gray-600 text-sm">
                            {new Date(sub.createdAt as string).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              {(subStatus === 'active' || subStatus === 'pending') && (
                                <button
                                  type="button"
                                  onClick={() => setCancelModal({ id: sub.id as string })}
                                  disabled={isCancelling}
                                  className="text-xs text-red-600 hover:text-red-700 hover:underline disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setStatusModal({ id: sub.id as string, current: subStatus })}
                                disabled={isUpdating}
                                className="p-1 text-gray-500 hover:text-gray-700 rounded disabled:opacity-50"
                                title="Change status"
                                aria-label="Change status"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {cancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="admin-cancel-title">
                  <div className="card max-w-md w-full p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 id="admin-cancel-title" className="font-semibold text-gray-900">Cancel this subscription?</h3>
                      <button type="button" onClick={() => setCancelModal(null)} className="p-1 text-gray-500 hover:text-gray-700 rounded" aria-label="Close">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                      The subscription will be cancelled. Razorpay will be notified if linked.
                    </p>
                    <div className="flex gap-2 justify-end">
                      <button type="button" onClick={() => setCancelModal(null)} className="btn-ghost py-2 px-4 rounded-lg">
                        Keep
                      </button>
                      <button type="button" onClick={handleCancel} disabled={isCancelling} className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50">
                        {isCancelling ? 'Cancelling…' : 'Cancel subscription'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {statusModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="admin-status-title">
                  <div className="card max-w-md w-full p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 id="admin-status-title" className="font-semibold text-gray-900">Change subscription status</h3>
                      <button type="button" onClick={() => setStatusModal(null)} className="p-1 text-gray-500 hover:text-gray-700 rounded" aria-label="Close">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">Current: <span className="font-medium capitalize">{statusModal.current}</span></p>
                    <div className="flex flex-wrap gap-2">
                      {STATUS_OPTIONS.filter((s) => s !== statusModal.current).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleStatusChange(s)}
                          disabled={isUpdating}
                          className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 capitalize"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost p-2 disabled:opacity-30">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-gray-600 text-sm">Page {page} of {totalPages}</span>
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
