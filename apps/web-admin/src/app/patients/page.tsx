'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Loader2, ChevronLeft, ChevronRight, Mail, MapPin, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { usePatients, useToggleUser } from '@/hooks/useApi';
import Sidebar from '@/components/Sidebar';

export default function PatientsPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [page, setPage] = useState(1);

  useEffect(() => { if (!isAuthenticated) router.push('/auth/login'); }, [isAuthenticated]);

  const { data, isLoading } = usePatients({ page, limit: 20 });
  const { mutateAsync: toggleUser } = useToggleUser();

  const patients = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="md:pl-56">
        <header className="glass sticky top-0 z-30 border-b border-gray-200 px-6 h-14 flex items-center">
          <Users className="w-5 h-5 text-blue-600 mr-2" />
          <h1 className="font-semibold text-gray-800">Patient Management</h1>
        </header>

        <main className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading patients…
            </div>
          ) : patients.length === 0 ? (
            <div className="card p-12 text-center">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-500">No patients found</h3>
            </div>
          ) : (
            <>
              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 text-left">
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Patient</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Contact</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Location</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((patient: Record<string, unknown>) => {
                      const user = (patient.user ?? {}) as Record<string, unknown>;
                      const isActive = user.isActive as boolean;
                      return (
                        <tr key={patient.id as string} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xs">
                                {(user.firstName as string)?.[0]}{(user.lastName as string)?.[0]}
                              </div>
                              <div>
                                <div className="text-gray-800 text-sm font-medium">
                                  {user.firstName as string} {user.lastName as string}
                                </div>
                                <div className="text-gray-500 text-xs">{patient.gender as string ?? '—'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1 text-gray-500 text-sm">
                              <Mail className="w-3 h-3" /> {user.email as string}
                            </div>
                            {user.phone && (
                              <div className="text-gray-500 text-xs mt-0.5">{user.phone as string}</div>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            {patient.city ? (
                              <span className="flex items-center gap-1 text-gray-500 text-sm">
                                <MapPin className="w-3 h-3" /> {patient.city as string}{patient.state ? `, ${patient.state as string}` : ''}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span className={isActive ? 'badge-green' : 'badge-red'}>
                              {isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <button
                              onClick={() => toggleUser(user.id as string)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                isActive
                                  ? 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100'
                                  : 'bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                              }`}
                            >
                              {isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                              {isActive ? 'Deactivate' : 'Activate'}
                            </button>
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
