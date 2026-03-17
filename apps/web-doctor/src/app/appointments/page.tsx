'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Calendar, Clock, Phone, Check, X, Loader2 } from 'lucide-react';
import { useDoctorAppointments, useUpdateAppointment } from '@/hooks/useApi';

const TABS = [
  { label: 'Today',     value: 'today' },
  { label: 'Upcoming',  value: 'confirmed' },
  { label: 'Pending',   value: 'pending' },
  { label: 'Completed', value: 'completed' },
];

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function DoctorAppointmentsPage() {
  const [activeTab, setActiveTab] = useState('today');
  const [doctorNotes, setDoctorNotes] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string|null>(null);

  const today = new Date().toISOString().split('T')[0];
  const params = activeTab === 'today'
    ? { date: today }
    : { status: activeTab };

  const { data: appointments = [], isLoading } = useDoctorAppointments(params);
  const { mutateAsync: update, isPending } = useUpdateAppointment();

  const handleConfirm = (id: string) => update({ id, status: 'confirmed' });
  const handleComplete = (id: string) => update({ id, status: 'completed', notes: doctorNotes[id] });
  const handleCancel  = (id: string) => update({ id, status: 'cancelled' });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="glass sticky top-0 z-30 border-b border-gray-200 px-6 h-14 flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm">
          <ChevronLeft className="w-4 h-4" /> Dashboard
        </Link>
        <h1 className="font-semibold text-gray-900">Appointments</h1>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          {TABS.map(tab => (
            <button key={tab.value} onClick={() => setActiveTab(tab.value)}
              className={`flex-1 py-2 text-sm rounded-lg font-medium transition-all ${
                activeTab === tab.value ? 'bg-violet-600 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16 text-gray-600">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…
          </div>
        ) : appointments.length === 0 ? (
          <div className="card p-12 text-center">
            <Calendar className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">No {activeTab} appointments</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appt: any) => {
              const p = appt.patient?.user || {};
              const expanded = expandedId === appt.id;
              return (
                <div key={appt.id} className="card overflow-hidden">
                  <div
                    className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedId(expanded ? null : appt.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 font-bold text-sm shrink-0">
                          {p.firstName?.[0]}{p.lastName?.[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{p.firstName} {p.lastName}</div>
                          {p.phone && (
                            <div className="text-gray-600 text-xs flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3" /> {p.phone}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                          <div className="text-gray-800 text-sm flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-500" />
                            {formatDate(appt.appointmentDate)}
                          </div>
                          <div className="text-gray-600 text-xs flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" /> {formatTime(appt.startTime)}
                          </div>
                        </div>
                        <span className={`badge ${
                          appt.status === 'confirmed' ? 'badge-green' :
                          appt.status === 'pending'   ? 'badge-yellow' :
                          appt.status === 'completed' ? 'badge-blue' : 'badge-gray'
                        }`}>{appt.status}</span>
                      </div>
                    </div>
                    {appt.symptoms && (
                      <p className="text-gray-500 text-xs mt-3 pl-14">Symptoms: {appt.symptoms}</p>
                    )}
                  </div>

                  {/* Expanded panel */}
                  {expanded && (
                    <div className="border-t border-gray-200 p-5 bg-gray-100/50 space-y-4">
                      <div>
                        <label className="label text-xs">Doctor Notes / Prescription</label>
                        <textarea
                          value={doctorNotes[appt.id] || appt.doctorNotes || ''}
                          onChange={e => setDoctorNotes(n => ({ ...n, [appt.id]: e.target.value }))}
                          className="input text-sm resize-none"
                          rows={3}
                          placeholder="Add clinical notes or prescription…"
                        />
                      </div>
                      <div className="flex gap-3">
                        {appt.status === 'pending' && (
                          <button onClick={() => handleConfirm(appt.id)} disabled={isPending}
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 text-sm font-medium transition-all">
                            <Check className="w-4 h-4" /> Confirm
                          </button>
                        )}
                        {(appt.status === 'confirmed' || appt.status === 'pending') && (
                          <>
                            <button onClick={() => handleComplete(appt.id)} disabled={isPending}
                              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 hover:bg-sky-100 text-sm font-medium transition-all">
                              <Check className="w-4 h-4" /> Mark Complete
                            </button>
                            <button onClick={() => handleCancel(appt.id)} disabled={isPending}
                              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 text-sm font-medium transition-all">
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
