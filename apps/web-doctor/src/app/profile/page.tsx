'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { ChevronLeft, Save, Loader2, Building2 } from 'lucide-react';
import { useMyProfile, useUpdateProfile } from '@/hooks/useApi';
import { doctorApi } from '@/lib/api';

const SPECIALIZATIONS = [
  'General Physician','Cardiologist','Dermatologist','Neurologist',
  'Orthopedic','Pediatrician','Gynecologist','ENT Specialist',
  'Ophthalmologist','Psychiatrist','Urologist','Oncologist',
  'Gastroenterologist','Pulmonologist','Endocrinologist','Radiologist',
];

const LANGUAGES = ['English','Hindi','Tamil','Telugu','Kannada','Malayalam','Bengali','Marathi','Gujarati','Punjabi'];

export default function DoctorProfilePage() {
  const { data: profile, isLoading } = useMyProfile();
  const { mutateAsync: update, isPending } = useUpdateProfile();
  const router = useRouter();

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (profile) {
      reset({
        specialization:     profile.specialization || '',
        subSpecialization:  profile.subSpecialization || '',
        experienceYears:    profile.experienceYears || 0,
        qualification:      profile.qualification || '',
        registrationNumber: profile.registrationNumber || '',
        bio:                profile.bio || '',
        consultationFee:    profile.consultationFee || 0,
        city:               profile.city || '',
        state:              profile.state || '',
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data: any) => {
    await update(data);
    router.refresh();
  };

  // Clinic form — separate save
  const { register: regClinic, handleSubmit: handleClinic } = useForm({
    defaultValues: profile?.clinic || {},
  });

  const saveClinic = async (data: any) => {
    await doctorApi.createClinic(data);
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="glass sticky top-0 z-30 border-b border-gray-200 px-6 h-14 flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 flex items-center gap-1 text-sm">
          <ChevronLeft className="w-4 h-4" /> Dashboard
        </Link>
        <h1 className="font-semibold text-gray-800">My Profile</h1>
        {profile?.status && (
          <span className={`badge ml-auto ${
            profile.status === 'approved'  ? 'badge-green' :
            profile.status === 'pending'   ? 'badge-yellow' :
            profile.status === 'rejected'  ? 'badge-red' : 'badge-gray'
          }`}>
            {profile.status}
          </span>
        )}
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Professional Info */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="card p-6">
            <h2 className="font-semibold text-gray-800 mb-5">Professional Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Specialization *</label>
                <select {...register('specialization', { required: true })} className="input">
                  <option value="">Select…</option>
                  {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Sub-specialization</label>
                <input {...register('subSpecialization')} className="input" placeholder="e.g. Interventional Cardiology" />
              </div>
              <div>
                <label className="label">Experience (years)</label>
                <input {...register('experienceYears')} type="number" min="0" max="60" className="input" />
              </div>
              <div>
                <label className="label">Consultation Fee (₹)</label>
                <input {...register('consultationFee')} type="number" min="0" className="input" placeholder="500" />
              </div>
              <div>
                <label className="label">Qualification</label>
                <input {...register('qualification')} className="input" placeholder="MBBS, MD (Cardiology)" />
              </div>
              <div>
                <label className="label">Registration Number</label>
                <input {...register('registrationNumber')} className="input" placeholder="MCI-XXXXX" />
              </div>
              <div>
                <label className="label">City</label>
                <input {...register('city')} className="input" placeholder="Chennai" />
              </div>
              <div>
                <label className="label">State</label>
                <input {...register('state')} className="input" placeholder="Tamil Nadu" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Bio / About</label>
                <textarea
                  {...register('bio')}
                  className="input resize-none"
                  rows={4}
                  placeholder="Tell patients about your expertise, experience, and approach to care…"
                />
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

        {/* Clinic Info */}
        <form onSubmit={handleClinic(saveClinic)} className="space-y-5">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-5">
              <Building2 className="w-5 h-5 text-violet-600" />
              <h2 className="font-semibold text-gray-800">Clinic Information</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Clinic Name *</label>
                <input {...regClinic('name', { required: true })} className="input" placeholder="City Heart Clinic" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Description</label>
                <textarea {...regClinic('description')} className="input resize-none" rows={2} placeholder="Brief description of your clinic…" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Address Line 1 *</label>
                <input {...regClinic('addressLine1', { required: true })} className="input" placeholder="123, Anna Salai" />
              </div>
              <div>
                <label className="label">Address Line 2</label>
                <input {...regClinic('addressLine2')} className="input" placeholder="Near Metro Station" />
              </div>
              <div>
                <label className="label">Landmark</label>
                <input {...regClinic('landmark')} className="input" placeholder="Opp. Apollo Hospital" />
              </div>
              <div>
                <label className="label">City *</label>
                <input {...regClinic('city', { required: true })} className="input" placeholder="Chennai" />
              </div>
              <div>
                <label className="label">State *</label>
                <input {...regClinic('state', { required: true })} className="input" placeholder="Tamil Nadu" />
              </div>
              <div>
                <label className="label">Pincode *</label>
                <input {...regClinic('pincode', { required: true })} className="input" placeholder="600001" />
              </div>
              <div>
                <label className="label">Clinic Phone</label>
                <input {...regClinic('phone')} type="tel" className="input" placeholder="+91 44 2234 5678" />
              </div>
              <div>
                <label className="label">Clinic Email</label>
                <input {...regClinic('email')} type="email" className="input" placeholder="clinic@example.com" />
              </div>
              <div>
                <label className="label">Website</label>
                <input {...regClinic('website')} className="input" placeholder="https://yourclinic.com" />
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" /> Save Clinic
          </button>
        </form>
      </div>
    </div>
  );
}
