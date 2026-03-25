'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ClipboardList,
  FileText,
  MessageSquare,
  Loader2,
  ChevronRight,
  Stethoscope,
} from 'lucide-react';
import {
  useMyMedicalRecords,
  useMyPrescriptions,
  usePatientChatConversations,
  useMyAppointments,
  useOpenPatientConversation,
} from '@/hooks/useApi';
import { downloadPrescriptionPdf } from '@/lib/download-prescription';
import { toast } from 'sonner';

export type HealthTab = 'records' | 'prescriptions' | 'messages';

const VALID_TABS: HealthTab[] = ['records', 'prescriptions', 'messages'];

function parseTab(raw: string | null): HealthTab {
  if (raw && VALID_TABS.includes(raw as HealthTab)) return raw as HealthTab;
  return 'records';
}

/**
 * Health hub with tabs synced to `/health?tab=records|prescriptions|messages`.
 */
export function HealthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTabState] = useState<HealthTab>(() => parseTab(searchParams.get('tab')));

  useEffect(() => {
    setTabState(parseTab(searchParams.get('tab')));
  }, [searchParams]);

  const setTab = useCallback(
    (t: HealthTab) => {
      setTabState(t);
      router.replace(`/health?tab=${t}`, { scroll: false });
    },
    [router],
  );

  const { data: records = [], isLoading: recLoading } = useMyMedicalRecords();
  const { data: rx = [], isLoading: rxLoading } = useMyPrescriptions();
  const { data: conversations = [], isLoading: convLoading } = usePatientChatConversations();
  const { data: appointments = [] } = useMyAppointments();
  const { mutateAsync: openChat, isPending: opening } = useOpenPatientConversation();

  const doctorsFromAppts = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const a of appointments as Array<{ doctor?: { id: string; user?: { firstName?: string; lastName?: string } } }>) {
      const d = a.doctor;
      if (!d?.id) continue;
      const name = d.user
        ? `Dr. ${d.user.firstName ?? ''} ${d.user.lastName ?? ''}`.trim()
        : 'Doctor';
      if (!map.has(d.id)) map.set(d.id, { id: d.id, name });
    }
    return Array.from(map.values());
  }, [appointments]);

  const startChat = async (doctorId: string) => {
    try {
      const conv = await openChat({ doctorId });
      router.push(`/messages/${conv.id}`);
    } catch {
      toast.error('Could not open chat. You may need a shared appointment first.');
    }
  };

  const chatCount = conversations.length;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      <nav className="glass sticky top-0 z-40 border-b border-gray-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="font-display font-bold text-cyan-600">
            Dochain
          </Link>
          <span className="text-sm font-medium text-gray-800">Health</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-6 flex gap-2 border-b border-gray-200 overflow-x-auto">
          {(
            [
              ['records', 'Records', ClipboardList],
              ['prescriptions', 'Prescriptions', FileText],
              ['messages', 'Messages', MessageSquare],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap ${
                tab === key
                  ? 'border-cyan-600 text-cyan-800'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span>{label}</span>
              {key === 'messages' && chatCount > 0 ? (
                <span
                  className="min-w-[1.125rem] rounded-full bg-cyan-600 px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none text-white"
                  aria-label={`${chatCount} conversation${chatCount === 1 ? '' : 's'}`}
                >
                  {chatCount > 99 ? '99+' : chatCount}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {tab === 'records' && (
          <div>
            <p className="mb-4 text-sm text-gray-600">
              Visit notes and diagnoses shared by your doctors (most recent first).
            </p>
            {recLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-cyan-600 mx-auto block" />
            ) : records.length === 0 ? (
              <div className="card p-8 text-center text-sm text-gray-600">
                <Stethoscope className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                No records yet.
              </div>
            ) : (
              <ul className="space-y-3">
                {(records as Array<{
                  id: string;
                  visitAt: string;
                  doctorNotes?: string;
                  diagnoses?: { label: string }[];
                  doctor?: { user?: { firstName?: string; lastName?: string } };
                }>).map((r) => (
                  <li key={r.id} className="card p-4 text-sm">
                    <div className="flex flex-wrap justify-between gap-2 text-xs text-gray-500">
                      <span>{new Date(r.visitAt).toLocaleString()}</span>
                      {r.doctor?.user ? (
                        <span>
                          Dr. {r.doctor.user.firstName} {r.doctor.user.lastName}
                        </span>
                      ) : null}
                    </div>
                    {r.doctorNotes ? <p className="mt-2 text-gray-800">{r.doctorNotes}</p> : null}
                    {r.diagnoses?.length ? (
                      <ul className="mt-2 list-inside list-disc text-gray-700">
                        {r.diagnoses.map((d, i) => (
                          <li key={i}>{d.label}</li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === 'prescriptions' && (
          <div>
            <p className="mb-4 text-sm text-gray-600">Prescriptions issued by your doctors.</p>
            {rxLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-cyan-600 mx-auto block" />
            ) : rx.length === 0 ? (
              <div className="card p-8 text-center text-sm text-gray-600">No prescriptions yet.</div>
            ) : (
              <ul className="space-y-3">
                {(rx as Array<{
                  id: string;
                  createdAt: string;
                  pdfUrl?: string;
                  doctor?: { user?: { firstName?: string; lastName?: string } };
                  payload?: { medicines?: { name: string }[] };
                }>).map((p) => (
                  <li key={p.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <div className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleString()}</div>
                      {p.doctor?.user ? (
                        <div className="mt-1 text-sm text-gray-900">
                          Dr. {p.doctor.user.firstName} {p.doctor.user.lastName}
                        </div>
                      ) : null}
                      <div className="text-xs text-gray-600 mt-1">
                        {p.payload?.medicines?.length ?? 0} medicine(s)
                      </div>
                    </div>
                    {p.pdfUrl ? (
                      <button
                        type="button"
                        onClick={() => void downloadPrescriptionPdf(p.id)}
                        className="text-cyan-600 text-sm font-medium hover:underline"
                      >
                        Download PDF
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === 'messages' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Your conversations</h2>
              {convLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-cyan-600" />
              ) : conversations.length === 0 ? (
                <p className="text-sm text-gray-600">No active chats.</p>
              ) : (
                <ul className="space-y-2">
                  {(conversations as Array<{ id: string; doctor?: { user?: { firstName?: string; lastName?: string } } }>).map(
                    (c) => {
                      const u = c.doctor?.user;
                      const name = u ? `Dr. ${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() : 'Doctor';
                      return (
                        <li key={c.id}>
                          <Link
                            href={`/messages/${c.id}`}
                            className="card flex items-center justify-between gap-3 p-4 hover:border-cyan-200"
                          >
                            <span className="font-medium text-gray-900">{name}</span>
                            <ChevronRight className="h-5 w-5 text-gray-400 shrink-0" />
                          </Link>
                        </li>
                      );
                    },
                  )}
                </ul>
              )}
            </div>

            {doctorsFromAppts.length > 0 ? (
              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-2">Message a doctor</h2>
                <p className="text-xs text-gray-600 mb-3">From your appointments.</p>
                <ul className="space-y-2">
                  {doctorsFromAppts.map((d) => (
                    <li key={d.id}>
                      <button
                        type="button"
                        onClick={() => startChat(d.id)}
                        disabled={opening}
                        className="card w-full flex items-center justify-between gap-3 p-4 text-left hover:border-cyan-200"
                      >
                        <span className="font-medium text-gray-900">{d.name}</span>
                        {opening ? (
                          <Loader2 className="h-4 w-4 animate-spin text-cyan-600" />
                        ) : (
                          <MessageSquare className="h-5 w-5 text-cyan-600 shrink-0" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                Book an appointment to message your doctor.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
