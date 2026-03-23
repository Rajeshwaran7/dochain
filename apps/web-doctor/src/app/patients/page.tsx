'use client';
import Link from 'next/link';
import { ChevronLeft, Users, Calendar, Phone, Mail, Loader2 } from 'lucide-react';
import { useDoctorAppointments } from '@/hooks/useApi';

export default function DoctorPatientsPage() {
  const { data: appointments = [], isLoading } = useDoctorAppointments({ status: 'completed', limit: 100 });

  // Deduplicate patients by patientId
  const uniquePatients = Array.from(
    new Map(appointments.map((a: any) => [a.patientId, a.patient])).entries()
  ).map(([id, patient]) => ({ id, patient }));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="glass sticky top-0 z-30 border-b border-gray-200 px-6 h-14 flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm">
          <ChevronLeft className="w-4 h-4" /> Dashboard
        </Link>
        <h1 className="font-semibold text-gray-900">My Patients</h1>
        <span className="ml-auto badge badge-purple">{uniquePatients.length} patients</span>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center py-16 text-gray-600">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading patients…
          </div>
        ) : uniquePatients.length === 0 ? (
          <div className="card p-12 text-center">
            <Users className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">No patients yet. Complete appointments to build your patient list.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {uniquePatients.map(({ id, patient }: any) => {
              const u = patient?.user || {};
              const visits = appointments.filter((a: any) => a.patientId === id).length;
              return (
                <div key={id} className="card p-5">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 font-bold shrink-0">
                      {u.firstName?.[0]}{u.lastName?.[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{u.firstName} {u.lastName}</div>
                      <div className="text-gray-600 text-xs flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {visits} visit{visits !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    {u.email ? (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{String(u.email)}</span>
                      </div>
                    ) : null}
                    {u.phone ? (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        {String(u.phone)}
                      </div>
                    ) : null}
                    {patient?.bloodGroup ? (
                      <div className="text-gray-600 text-xs">
                        Blood group: <span className="text-gray-800">{String(patient.bloodGroup)}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
