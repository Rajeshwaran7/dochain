'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Save, Loader2, Building2, Info, Camera } from 'lucide-react';
import {
  useMyProfile,
  useUpdateProfile,
  useSaveClinic,
  useUploadAvatar,
  useDeleteAvatar,
} from '@/hooks/useApi';

/** Clinic form fields (aligned with `CreateClinicDto`). */
interface ClinicFormValues {
  name: string;
  description?: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  phone?: string;
  email?: string;
  website?: string;
}

const SPECIALIZATIONS = [
  'General Physician',
  'Cardiologist',
  'Dermatologist',
  'Neurologist',
  'Orthopedic',
  'Pediatrician',
  'Gynecologist',
  'ENT Specialist',
  'Ophthalmologist',
  'Psychiatrist',
  'Urologist',
  'Oncologist',
  'Gastroenterologist',
  'Pulmonologist',
  'Endocrinologist',
  'Radiologist',
];

export default function DoctorProfilePage() {
  const { data: profile, isLoading } = useMyProfile();
  const { mutateAsync: update, isPending: profilePending } = useUpdateProfile();
  const { mutateAsync: saveClinicMut, isPending: clinicPending } = useSaveClinic();
  const { mutateAsync: uploadAvatar, isPending: avatarUploading } = useUploadAvatar();
  const { mutateAsync: deleteAvatar, isPending: avatarDeleting } = useDeleteAvatar();
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty: profileDirty },
  } = useForm({ mode: 'onChange' });

  useEffect(() => {
    if (profile) {
      reset({
        specialization: profile.specialization ?? '',
        subSpecialization: profile.subSpecialization ?? '',
        experienceYears: profile.experienceYears ?? 0,
        qualification: profile.qualification ?? '',
        registrationNumber: profile.registrationNumber ?? '',
        bio: profile.bio ?? '',
        city: profile.city ?? '',
        state: profile.state ?? '',
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data: Record<string, unknown>) => {
    await update(data);
    router.refresh();
  };

  const {
    register: regClinic,
    handleSubmit: handleClinicForm,
    reset: resetClinic,
    formState: { isDirty: clinicDirty },
  } = useForm<ClinicFormValues>({ mode: 'onChange', defaultValues: {} });

  useEffect(() => {
    if (profile?.clinic) {
      resetClinic(profile.clinic as Partial<ClinicFormValues>);
    }
  }, [profile?.clinic, resetClinic]);

  const onClinicSubmit = async (data: ClinicFormValues) => {
    await saveClinicMut(data as unknown as Record<string, unknown>);
    router.refresh();
  };

  const savingAny = profilePending || clinicPending || avatarUploading || avatarDeleting;

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" aria-hidden />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {profile?.status ? (
          <span
            className={`badge ${
              profile.status === 'approved'
                ? 'badge-green'
                : profile.status === 'pending'
                  ? 'badge-yellow'
                  : profile.status === 'rejected'
                    ? 'badge-red'
                    : 'badge-gray'
            }`}
          >
            {profile.status}
          </span>
        ) : null}
      </div>

      <div className="card flex gap-3 border-violet-200 bg-violet-50/80 p-4 text-sm text-violet-900">
        <Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <p>
          Professional details and clinic details are saved separately. Use <strong>Save Profile</strong> for your
          practice info and <strong>Save Clinic</strong> for location and contact details.
        </p>
      </div>

      <div className="card flex flex-wrap items-center gap-4 p-6">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-gray-100">
          {profile?.profileImage ? (
            <img src={profile.profileImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-display text-2xl text-violet-600">
              {profile?.user?.firstName?.[0]}
              {profile?.user?.lastName?.[0]}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (!f) return;
              try {
                await uploadAvatar(f);
                router.refresh();
              } catch {
                /* toast optional */
              }
            }}
          />
          <button
            type="button"
            className="btn-secondary flex items-center gap-2"
            onClick={() => avatarInputRef.current?.click()}
            disabled={savingAny}
          >
            {avatarUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Camera className="h-4 w-4" aria-hidden />
            )}
            Upload photo
          </button>
          {profile?.profileImage ? (
            <button
              type="button"
              className="btn-secondary"
              onClick={async () => {
                await deleteAvatar();
                router.refresh();
              }}
              disabled={savingAny}
            >
              {avatarDeleting ? 'Removing…' : 'Remove'}
            </button>
          ) : null}
        </div>
        <p className="w-full text-xs text-gray-500">JPEG, PNG, or WebP — max 5MB. Shown to patients in search and booking.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="card p-6">
          <h2 className="mb-5 font-semibold text-gray-900">Professional Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Specialization *</label>
              <select {...register('specialization', { required: true })} className="input">
                <option value="">Select…</option>
                {SPECIALIZATIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Sub-specialization</label>
              <input
                {...register('subSpecialization')}
                className="input"
                placeholder="e.g. Interventional Cardiology"
              />
            </div>
            <div>
              <label className="label">Experience (years)</label>
              <input {...register('experienceYears')} type="number" min="0" max="60" className="input" />
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

        <button
          type="submit"
          disabled={savingAny || !profileDirty}
          className="btn-primary flex items-center gap-2"
          aria-busy={profilePending}
        >
          {profilePending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Saving…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" aria-hidden />
              Save Profile
            </>
          )}
        </button>
      </form>

      <form onSubmit={handleClinicForm(onClinicSubmit)} className="space-y-5">
        <div className="card p-6">
          <div className="mb-5 flex items-center gap-3">
            <Building2 className="h-5 w-5 text-violet-600" aria-hidden />
            <h2 className="font-semibold text-gray-900">Clinic Information</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Clinic Name *</label>
              <input {...regClinic('name', { required: true })} className="input" placeholder="City Heart Clinic" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea
                {...regClinic('description')}
                className="input resize-none"
                rows={2}
                placeholder="Brief description of your clinic…"
              />
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

        <button
          type="submit"
          disabled={savingAny || !clinicDirty}
          className="btn-primary flex items-center gap-2"
          aria-busy={clinicPending}
        >
          {clinicPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Saving…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" aria-hidden />
              Save Clinic
            </>
          )}
        </button>
      </form>
    </div>
  );
}
