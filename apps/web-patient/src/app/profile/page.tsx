'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { ChevronLeft, Save, Loader2, User } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function PatientProfilePage() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore();
  const router  = useRouter();
  const qc      = useQueryClient();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) router.push('/auth/login');
  }, [hasHydrated, isAuthenticated, router]);

  const { data: profile } = useQuery({
    queryKey: ['patient-profile'],
    queryFn:  () => api.get('/patients/me').then(r => r.data),
    enabled:  isAuthenticated,
  });

  const { mutateAsync: update, isPending } = useMutation({
    mutationFn: (d: any) => api.put('/patients/me', d).then(r => r.data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['patient-profile'] }),
  });

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (profile) reset({
      dateOfBirth:          profile.dateOfBirth   || '',
      gender:               profile.gender        || '',
      bloodGroup:           profile.bloodGroup    || '',
      medicalHistory:       profile.medicalHistory || '',
      allergies:            profile.allergies      || '',
      emergencyContactName: profile.emergencyContactName || '',
      emergencyContactPhone:profile.emergencyContactPhone || '',
      city:                 profile.city  || '',
      state:                profile.state || '',
      pincode:              profile.pincode || '',
    });
  }, [profile, reset]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <nav className="glass sticky top-0 z-40 border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm">
            <ChevronLeft className="w-4 h-4" /> Dashboard
          </Link>
          <span className="text-gray-500">|</span>
          <span className="font-semibold text-gray-900">My Profile</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Avatar header */}
        <div className="card p-6 flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-cyan-50 flex items-center justify-center">
            <User className="w-8 h-8 text-cyan-600" />
          </div>
          <div>
            <h2 className="font-bold text-xl text-gray-900">{user.firstName} {user.lastName}</h2>
            <p className="text-gray-600 text-sm">{user.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(update)} className="space-y-5">
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Date of Birth</label>
                <input {...register('dateOfBirth')} type="date" className="input" />
              </div>
              <div>
                <label className="label">Gender</label>
                <select {...register('gender')} className="select">
                  <option value="">Select…</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Blood Group</label>
                <select {...register('bloodGroup')} className="select">
                  <option value="">Select…</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">City</label>
                <input {...register('city')} className="input" placeholder="Chennai" />
              </div>
              <div>
                <label className="label">State</label>
                <input {...register('state')} className="input" placeholder="Tamil Nadu" />
              </div>
              <div>
                <label className="label">Pincode</label>
                <input {...register('pincode')} className="input" placeholder="600001" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Medical Information</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Medical History</label>
                <textarea {...register('medicalHistory')} className="input resize-none" rows={3} placeholder="Any existing conditions, surgeries, etc." />
              </div>
              <div>
                <label className="label">Allergies</label>
                <textarea {...register('allergies')} className="input resize-none" rows={2} placeholder="List any known allergies…" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Emergency Contact</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Contact Name</label>
                <input {...register('emergencyContactName')} className="input" placeholder="Full name" />
              </div>
              <div>
                <label className="label">Contact Phone</label>
                <input {...register('emergencyContactPhone')} type="tel" className="input" placeholder="+91 98765 43210" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={isPending} className="btn-primary flex items-center gap-2">
            {isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              : <><Save className="w-4 h-4" /> Save Profile</>
            }
          </button>
        </form>
      </div>
    </div>
  );
}
