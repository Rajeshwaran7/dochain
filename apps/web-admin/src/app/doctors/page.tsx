'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Stethoscope, CheckCircle, XCircle, Ban, Loader2,
  ChevronLeft, ChevronRight, Mail, MapPin, Clock,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useDoctors, useApproveDoctor, useRejectDoctor, useSuspendDoctor } from '@/hooks/useApi';
import Sidebar from '@/components/Sidebar';

const STATUS_TABS = [
  { label: 'All',       value: '' },
  { label: 'Pending',   value: 'pending' },
  { label: 'Approved',  value: 'approved' },
  { label: 'Rejected',  value: 'rejected' },
  { label: 'Suspended', value: 'suspended' },
];

const STATUS_BADGE: Record<string, string> = {
  pending:   'badge-yellow',
  approved:  'badge-green',
  rejected:  'badge-red',
  suspended: 'badge-gray',
};

export default function DoctorsPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => { if (!isAuthenticated) router.push('/auth/login'); }, [isAuthenticated]);

  const { data, isLoading } = useDoctors({ status: status || undefined, page, limit: 15 });
  const { mutateAsync: approve, isPending: approving } = useApproveDoctor();
  const { mutateAsync: reject, isPending: rejecting } = useRejectDoctor();
  const { mutateAsync: suspend, isPending: suspending } = useSuspendDoctor();

  const doctors = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="md:pl-56">
        <header className="glass sticky top-0 z-30 border-b border-gray-200 px-6 h-14 flex items-center">
          <Stethoscope className="w-5 h-5 text-blue-600 mr-2" />
          <h1 className="font-semibold text-gray-900">Doctor Management</h1>
        </header>

        <main className="p-6 space-y-6">
          {/* Status tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 max-w-xl">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setStatus(tab.value); setPage(1); }}
                className={`flex-1 py-2 text-sm rounded-lg font-medium transition-all ${
                  status === tab.value
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-gray-600">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading doctors…
            </div>
          ) : doctors.length === 0 ? (
            <div className="card p-12 text-center">
              <Stethoscope className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-600">No doctors found</h3>
            </div>
          ) : (
            <div className="space-y-3">
              {doctors.map((doc: Record<string, unknown>) => {
                const user = (doc.user ?? {}) as Record<string, unknown>;
                const clinic = (doc.clinic ?? null) as Record<string, unknown> | null;
                const docStatus = doc.status as string;
                const docId = doc.id as string;

                return (
                  <div key={docId} className="card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                          <span className="font-bold text-blue-600">
                            {(user.firstName as string)?.[0]}{(user.lastName as string)?.[0]}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            Dr. {user.firstName as string} {user.lastName as string}
                          </div>
                          <div className="text-blue-600 text-sm">{doc.specialization as string}</div>
                          <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {user.email as string}
                            </span>
                            {doc.city ? (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {String(doc.city)}
                              </span>
                            ) : null}
                            {doc.experienceYears != null &&
                            Number(doc.experienceYears) > 0 ? (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {Number(doc.experienceYears)} yrs exp
                              </span>
                            ) : null}
                            {clinic ? (
                              <span className="text-gray-600">Clinic: {String(clinic.name ?? '')}</span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={STATUS_BADGE[docStatus] ?? 'badge-gray'}>
                          {docStatus}
                        </span>

                        {docStatus === 'pending' && (
                          <>
                            <button
                              onClick={() => approve(docId)}
                              disabled={approving}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 text-xs font-medium transition-all"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => reject({ id: docId })}
                              disabled={rejecting}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 text-xs font-medium transition-all"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        )}

                        {docStatus === 'approved' && (
                          <button
                            onClick={() => suspend(docId)}
                            disabled={suspending}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200 text-xs font-medium transition-all"
                          >
                            <Ban className="w-3.5 h-3.5" /> Suspend
                          </button>
                        )}

                        {docStatus === 'suspended' && (
                          <button
                            onClick={() => approve(docId)}
                            disabled={approving}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 text-xs font-medium transition-all"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Reactivate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-ghost p-2 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-gray-600 text-sm">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-ghost p-2 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
