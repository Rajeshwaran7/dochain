'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronLeft,
  Loader2,
  MessageSquare,
  FileText,
  Stethoscope,
  Plus,
  Trash2,
  MapPin,
  Droplet,
  AlertCircle,
  ClipboardList,
} from 'lucide-react';
import {
  useDoctorAppointments,
  useMedicalRecordsForPatient,
  useCreateMedicalRecord,
  usePrescriptionsForPatient,
  useCreatePrescription,
  useOpenConversation,
} from '@/hooks/useApi';
import { toast } from 'sonner';
import { downloadPrescriptionPdf } from '@/lib/download-prescription';

type Tab = 'records' | 'prescriptions';

type PatientFromAppointment = {
  user?: { firstName?: string; lastName?: string; email?: string; phone?: string };
  bloodGroup?: string | null;
  medicalHistory?: string | null;
  allergies?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
};

function formatPatientLocation(p: {
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
}): string | null {
  const parts = [p.city, p.state, p.pincode].filter(
    (x): x is string => typeof x === 'string' && x.trim().length > 0,
  );
  return parts.length > 0 ? parts.join(', ') : null;
}

function PatientCarePageInner() {
  const params = useParams<{ patientId: string }>();
  const patientId = params.patientId;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>('records');

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'prescriptions' || t === 'records') {
      setTab(t);
    }
  }, [searchParams]);

  const navigateTab = (next: Tab) => {
    setTab(next);
    router.replace(`${pathname}?tab=${next}`);
  };

  const { data: appointments = [], isLoading: apptLoading } = useDoctorAppointments();
  const patient = useMemo(() => {
    const a = appointments.find((x: { patientId: string }) => x.patientId === patientId);
    return a?.patient as PatientFromAppointment | undefined;
  }, [appointments, patientId]);

  const { data: records = [], isLoading: recLoading } = useMedicalRecordsForPatient(patientId);

  const visitDiagnosisLabels = useMemo(() => {
    const set = new Set<string>();
    for (const r of records as Array<{ diagnoses?: { label: string }[] }>) {
      r.diagnoses?.forEach((d) => {
        const t = d.label?.trim();
        if (t) set.add(t);
      });
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [records]);
  const { data: rx = [], isLoading: rxLoading } = usePrescriptionsForPatient(patientId);
  const { mutateAsync: createRecord, isPending: recPending } = useCreateMedicalRecord(patientId);
  const { mutateAsync: createRx, isPending: rxPending } = useCreatePrescription(patientId);
  const { mutateAsync: openChat, isPending: chatOpening } = useOpenConversation();

  const [notes, setNotes] = useState('');
  const [diagLines, setDiagLines] = useState('');
  const [rxInstructions, setRxInstructions] = useState('');
  const [meds, setMeds] = useState([
    { name: '', dosage: '', frequency: '', duration: '', notes: '' },
  ]);

  const handleAddVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    const diagnoses = diagLines
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((label) => ({ label }));
    try {
      await createRecord({
        doctorNotes: notes.trim() || undefined,
        diagnoses: diagnoses.length ? diagnoses : undefined,
      });
      setNotes('');
      setDiagLines('');
      toast.success('Visit record saved.');
    } catch {
      toast.error('Could not save visit record.');
    }
  };

  const handleAddRx = async (e: React.FormEvent) => {
    e.preventDefault();
    const medicines = meds
      .filter((m) => m.name.trim())
      .map((m) => ({
        name: m.name.trim(),
        dosage: m.dosage.trim() || '—',
        frequency: m.frequency.trim() || '—',
        duration: m.duration.trim() || '—',
        notes: m.notes.trim() || undefined,
      }));
    if (!medicines.length) return;
    try {
      await createRx({
        medicines,
        instructions: rxInstructions.trim() || undefined,
      });
      setRxInstructions('');
      setMeds([{ name: '', dosage: '', frequency: '', duration: '', notes: '' }]);
      toast.success('Prescription saved. PDF is available to the patient.');
    } catch {
      toast.error('Could not save prescription. Check Cloudinary and try again.');
    }
  };

  const openMessages = async () => {
    try {
      const conv = await openChat({ patientId });
      router.push(`/messages/${conv.id}`);
    } catch {
      toast.error('Could not open conversation.');
    }
  };

  if (apptLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" aria-hidden />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-gray-600">Patient not found in your appointments.</p>
        <Link href="/patients" className="mt-4 inline-block text-violet-600 hover:underline">
          Back to patients
        </Link>
      </div>
    );
  }

  const u = patient.user ?? {};
  const locationLine = formatPatientLocation(patient);

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/patients"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-violet-700"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Patients
        </Link>

        <div className="card mb-6 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {u.firstName} {u.lastName}
              </h1>
              <p className="mt-1 text-sm text-gray-600">{u.email}</p>
              {u.phone ? <p className="text-sm text-gray-600">{u.phone}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => openMessages()}
              disabled={chatOpening}
              className="btn-primary flex items-center gap-2"
            >
              {chatOpening ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageSquare className="h-4 w-4" aria-hidden />
              )}
              Message
            </button>
          </div>
        </div>

        <div className="card mb-6 border-violet-100 bg-gradient-to-b from-violet-50/40 to-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-violet-800">
            Medical Information
          </h2>
          <dl className="mt-4 space-y-4">
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-violet-600" aria-hidden />
                City / location
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{locationLine ?? 'Not provided'}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <Droplet className="h-3.5 w-3.5 shrink-0 text-violet-600" aria-hidden />
                Blood group
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{patient.bloodGroup ?? '—'}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-violet-600" aria-hidden />
                Allergies
              </dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
                {patient.allergies?.trim() ? patient.allergies : 'None recorded'}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <ClipboardList className="h-3.5 w-3.5 shrink-0 text-violet-600" aria-hidden />
                Disease / medical history (patient)
              </dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
                {patient.medicalHistory?.trim() ? patient.medicalHistory : 'Not provided'}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <Stethoscope className="h-3.5 w-3.5 shrink-0 text-violet-600" aria-hidden />
                Diagnoses from your visits
              </dt>
              <dd className="mt-1">
                {visitDiagnosisLabels.length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {visitDiagnosisLabels.map((label) => (
                      <li
                        key={label}
                        className="rounded-full border border-violet-200 bg-white px-3 py-0.5 text-xs text-violet-900"
                      >
                        {label}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-sm text-gray-600">None yet — add diagnoses in visit notes below.</span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mb-4 flex gap-2 border-b border-gray-200">
          <button
            type="button"
            onClick={() => navigateTab('records')}
            className={`flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              tab === 'records'
                ? 'border-violet-600 text-violet-800'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Stethoscope className="h-4 w-4" aria-hidden />
            Visit records
          </button>
          <button
            type="button"
            onClick={() => navigateTab('prescriptions')}
            className={`flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              tab === 'prescriptions'
                ? 'border-violet-600 text-violet-800'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="h-4 w-4" aria-hidden />
            Prescriptions
          </button>
        </div>

        {tab === 'records' ? (
          <div className="space-y-6">
            <form onSubmit={handleAddVisit} className="card space-y-4 p-6">
              <h2 className="font-semibold text-gray-900">Add visit note</h2>
              <div>
                <label className="label">Clinical notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input resize-none"
                  rows={4}
                  placeholder="Examination findings, plan…"
                />
              </div>
              <div>
                <label className="label">Diagnoses (one per line)</label>
                <textarea
                  value={diagLines}
                  onChange={(e) => setDiagLines(e.target.value)}
                  className="input resize-none font-mono text-sm"
                  rows={3}
                  placeholder="Hypertension&#10;Type 2 diabetes"
                />
              </div>
              <button type="submit" className="btn-primary" disabled={recPending}>
                {recPending ? 'Saving…' : 'Save visit record'}
              </button>
            </form>

            <div>
              <h2 className="mb-3 font-semibold text-gray-900">History</h2>
              {recLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
              ) : records.length === 0 ? (
                <p className="text-sm text-gray-500">No records yet.</p>
              ) : (
                <ul className="space-y-3">
                  {(records as Array<{
                    id: string;
                    visitAt: string;
                    doctorNotes?: string;
                    diagnoses?: { label: string; code?: string }[];
                  }>).map((r) => (
                    <li key={r.id} className="card p-4 text-sm">
                      <div className="text-xs text-gray-500">
                        {new Date(r.visitAt).toLocaleString()}
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
          </div>
        ) : (
          <div className="space-y-6">
            <form onSubmit={handleAddRx} className="card space-y-4 p-6">
              <h2 className="font-semibold text-gray-900">New prescription</h2>
              {meds.map((m, idx) => (
                <div key={idx} className="rounded-lg border border-gray-100 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Medicine {idx + 1}</span>
                    {meds.length > 1 ? (
                      <button
                        type="button"
                        className="text-gray-400 hover:text-red-600"
                        onClick={() => setMeds((prev) => prev.filter((_, i) => i !== idx))}
                        aria-label="Remove row"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                  <input
                    className="input text-sm"
                    placeholder="Name"
                    value={m.name}
                    onChange={(e) =>
                      setMeds((prev) =>
                        prev.map((row, i) => (i === idx ? { ...row, name: e.target.value } : row)),
                      )
                    }
                  />
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input
                      className="input text-sm"
                      placeholder="Dosage"
                      value={m.dosage}
                      onChange={(e) =>
                        setMeds((prev) =>
                          prev.map((row, i) => (i === idx ? { ...row, dosage: e.target.value } : row)),
                        )
                      }
                    />
                    <input
                      className="input text-sm"
                      placeholder="Frequency"
                      value={m.frequency}
                      onChange={(e) =>
                        setMeds((prev) =>
                          prev.map((row, i) => (i === idx ? { ...row, frequency: e.target.value } : row)),
                        )
                      }
                    />
                    <input
                      className="input text-sm"
                      placeholder="Duration"
                      value={m.duration}
                      onChange={(e) =>
                        setMeds((prev) =>
                          prev.map((row, i) => (i === idx ? { ...row, duration: e.target.value } : row)),
                        )
                      }
                    />
                  </div>
                  <input
                    className="input text-sm"
                    placeholder="Notes (optional)"
                    value={m.notes}
                    onChange={(e) =>
                      setMeds((prev) =>
                        prev.map((row, i) => (i === idx ? { ...row, notes: e.target.value } : row)),
                      )
                    }
                  />
                </div>
              ))}
              <button
                type="button"
                className="btn-secondary inline-flex items-center gap-1 text-sm"
                onClick={() =>
                  setMeds((prev) => [...prev, { name: '', dosage: '', frequency: '', duration: '', notes: '' }])
                }
              >
                <Plus className="h-4 w-4" aria-hidden />
                Add medicine
              </button>
              <div>
                <label className="label">Instructions (optional)</label>
                <textarea
                  value={rxInstructions}
                  onChange={(e) => setRxInstructions(e.target.value)}
                  className="input resize-none text-sm"
                  rows={2}
                />
              </div>
              <button type="submit" className="btn-primary" disabled={rxPending}>
                {rxPending ? 'Generating PDF…' : 'Save prescription'}
              </button>
            </form>

            <div>
              <h2 className="mb-3 font-semibold text-gray-900">Past prescriptions</h2>
              {rxLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
              ) : rx.length === 0 ? (
                <p className="text-sm text-gray-500">None yet.</p>
              ) : (
                <ul className="space-y-3">
                  {(rx as Array<{ id: string; createdAt: string; pdfUrl?: string; payload?: { medicines?: unknown[] } }>).map(
                    (p) => (
                      <li key={p.id} className="card flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                        <div>
                          <div className="text-xs text-gray-500">
                            {new Date(p.createdAt).toLocaleString()}
                          </div>
                          <div className="mt-1 text-gray-800">
                            {(p.payload?.medicines as { name: string }[] | undefined)?.length ?? 0} medicine(s)
                          </div>
                        </div>
                        {p.pdfUrl ? (
                          <button
                            type="button"
                            onClick={() => void downloadPrescriptionPdf(p.id)}
                            className="text-violet-600 hover:underline"
                          >
                            PDF
                          </button>
                        ) : null}
                      </li>
                    ),
                  )}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Patient care with URL `?tab=records|prescriptions` (e.g. after completing an appointment).
 */
export default function PatientCarePage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" aria-hidden />
        </div>
      }
    >
      <PatientCarePageInner />
    </Suspense>
  );
}
