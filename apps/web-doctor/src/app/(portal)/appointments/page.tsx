'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Calendar,
  ChevronDown,
  Clock,
  Phone,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { useDoctorAppointments, useUpdateAppointment } from '@/hooks/useApi';

const TABS = [
  { label: 'Today', value: 'today' },
  { label: 'Upcoming', value: 'confirmed' },
  { label: 'Pending', value: 'pending' },
  { label: 'Completed', value: 'completed' },
] as const;

const TAB_VALUES = TABS.map((t) => t.value);
type TabValue = (typeof TAB_VALUES)[number];

function isTabValue(s: string | null): s is TabValue {
  return s !== null && TAB_VALUES.includes(s as TabValue);
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

/** Use noon UTC anchor so the calendar day does not shift across time zones. */
function formatBookingDateLabel(isoDate: string) {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function appointmentStatusBadgeClass(status: string): string {
  if (status === 'confirmed') {
    return 'badge-green';
  }
  if (status === 'pending') {
    return 'badge-yellow';
  }
  if (status === 'completed') {
    return 'badge-blue';
  }
  return 'badge-gray';
}

function DoctorAppointmentsInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabValue>('today');
  const [doctorNotes, setDoctorNotes] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (isTabValue(t)) {
      setActiveTab(t);
    }
  }, [searchParams]);

  const navigateTab = (next: TabValue) => {
    setActiveTab(next);
    router.replace(`${pathname}?tab=${next}`);
  };

  const today = new Date().toISOString().split('T')[0];
  const params = activeTab === 'today' ? { date: today } : { status: activeTab };

  const { data: appointments = [], isLoading } = useDoctorAppointments(params);
  const { mutateAsync: update, isPending } = useUpdateAppointment();

  const runUpdate = async (action: () => Promise<unknown>, okMessage: string) => {
    try {
      await action();
      toast.success(okMessage);
    } catch {
      toast.error('Could not update appointment. Please try again.');
    }
  };

  const handleConfirm = (id: string) =>
    runUpdate(() => update({ id, status: 'confirmed' }), 'Appointment confirmed.');

  const handleComplete = async (appointmentId: string, patientId: string) => {
    try {
      await update({
        id: appointmentId,
        status: 'completed',
        notes: doctorNotes[appointmentId],
      });
      toast.success('Marked as completed.');
      router.push(`/patients/${patientId}?tab=prescriptions`);
    } catch {
      toast.error('Could not update appointment. Please try again.');
    }
  };

  const handleCancel = (id: string) =>
    runUpdate(() => update({ id, status: 'cancelled' }), 'Appointment cancelled.');

  return (
    <div className="relative px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex gap-1 rounded-xl bg-gray-100 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => navigateTab(tab.value)}
              disabled={isPending}
              className={clsx(
                'flex-1 rounded-lg py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50',
                activeTab === tab.value
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-600 hover:text-gray-900',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16 text-gray-600">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" aria-hidden />
            Loading…
          </div>
        ) : appointments.length === 0 ? (
          <div className="card p-12 text-center">
            <Calendar className="mx-auto mb-3 h-10 w-10 text-gray-400" />
            <p className="text-sm text-gray-600">No {activeTab} appointments</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appt: Record<string, unknown>) => {
              const id = String(appt.id);
              const patientId = String(appt.patientId ?? '');
              const p = (appt.patient as { user?: Record<string, unknown> } | undefined)?.user ?? {};
              const expanded = expandedId === id;
              const symptoms = appt.symptoms;
              return (
                <div key={id} className="card overflow-hidden">
                  <button
                    type="button"
                    className="w-full p-5 text-left transition-colors hover:bg-gray-50"
                    onClick={() => setExpandedId(expanded ? null : id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-sm font-bold text-violet-600">
                          {String(p.firstName ?? '').charAt(0)}
                          {String(p.lastName ?? '').charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-gray-900">
                            {String(p.firstName ?? '')} {String(p.lastName ?? '')}
                          </div>
                          <div className="mt-1.5 flex flex-col gap-1.5 text-sm text-gray-800 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1">
                            <span className="flex items-start gap-1.5">
                              <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500" aria-hidden />
                              <span>{formatBookingDateLabel(String(appt.appointmentDate))}</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 shrink-0 text-violet-500" aria-hidden />
                              <span className="font-medium">
                                {formatTime(String(appt.startTime))}
                                {appt.endTime ? (
                                  <>
                                    {' '}
                                    – {formatTime(String(appt.endTime))}
                                  </>
                                ) : null}
                              </span>
                            </span>
                          </div>
                          {p.phone ? (
                            <div className="mt-1.5 flex items-center gap-1 text-xs text-gray-600">
                              <Phone className="h-3 w-3" aria-hidden />
                              {String(p.phone)}
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className={`badge ${appointmentStatusBadgeClass(String(appt.status))}`}>
                          {String(appt.status)}
                        </span>
                        <ChevronDown
                          className={clsx(
                            'h-5 w-5 shrink-0 text-gray-400 transition-transform',
                            expanded ? 'rotate-180' : '',
                          )}
                          aria-hidden
                        />
                      </div>
                    </div>
                    {symptoms ? (
                      <p className="mt-3 pl-14 text-xs text-gray-500">
                        Symptoms: {String(symptoms)}
                      </p>
                    ) : null}
                  </button>

                  {expanded ? (
                    <div className="space-y-4 border-t border-gray-200 bg-gray-100/50 p-5">
                      <div className="rounded-xl border border-violet-200 bg-white px-4 py-3 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                          Patient booking
                        </p>
                        <p className="mt-1 text-sm font-medium text-gray-900">
                          {formatBookingDateLabel(String(appt.appointmentDate))}
                        </p>
                        <p className="mt-0.5 text-sm text-gray-700">
                          <span className="font-medium">Time: </span>
                          {formatTime(String(appt.startTime))}
                          {appt.endTime ? (
                            <>
                              {' '}
                              – {formatTime(String(appt.endTime))}
                            </>
                          ) : null}
                        </p>
                      </div>
                      <div>
                        <label className="label text-xs" htmlFor={`notes-${id}`}>
                          Doctor Notes / Prescription
                        </label>
                        <textarea
                          id={`notes-${id}`}
                          value={doctorNotes[id] ?? String(appt.doctorNotes ?? '')}
                          onChange={(e) =>
                            setDoctorNotes((n) => ({ ...n, [id]: e.target.value }))
                          }
                          className="input resize-none text-sm"
                          rows={3}
                          placeholder="Add clinical notes or prescription…"
                        />
                      </div>
                      <div className="flex gap-3">
                        {appt.status === 'pending' ? (
                          <button
                            type="button"
                            onClick={() => handleConfirm(id)}
                            disabled={isPending}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-2 text-sm font-medium text-emerald-600 transition-all hover:bg-emerald-100"
                          >
                            <Check className="h-4 w-4" aria-hidden />
                            Confirm
                          </button>
                        ) : null}
                        {appt.status === 'confirmed' || appt.status === 'pending' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => void handleComplete(id, patientId)}
                              disabled={isPending || !patientId}
                              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 py-2 text-sm font-medium text-sky-600 transition-all hover:bg-sky-100"
                            >
                              <Check className="h-4 w-4" aria-hidden />
                              Mark Complete
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancel(id)}
                              disabled={isPending}
                              className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-100"
                            >
                              <X className="h-4 w-4" aria-hidden />
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Appointments list; `?tab=today|confirmed|pending|completed` for deep links (e.g. from dashboard).
 */
export default function DoctorAppointmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center px-4 py-20">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" aria-hidden />
        </div>
      }
    >
      <DoctorAppointmentsInner />
    </Suspense>
  );
}
