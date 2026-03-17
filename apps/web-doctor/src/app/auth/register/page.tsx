'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Stethoscope } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

const SPECIALIZATIONS = [
  'General Physician','Cardiologist','Dermatologist','Neurologist',
  'Orthopedic','Pediatrician','Gynecologist','ENT Specialist',
  'Ophthalmologist','Psychiatrist','Urologist','Oncologist',
  'Gastroenterologist','Pulmonologist','Endocrinologist',
];

const schema = z.object({
  firstName:      z.string().min(2),
  lastName:       z.string().min(1),
  email:          z.string().email(),
  phone:          z.string().min(10).optional(),
  specialization: z.string().min(2, 'Select specialization'),
  city:           z.string().min(2, 'Enter your city'),
  password:       z.string().min(8),
  confirm:        z.string(),
}).refine(d => d.password === d.confirm, { message: "Passwords don't match", path: ['confirm'] });

type F = z.infer<typeof schema>;

export default function DoctorRegisterPage() {
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<F>({ resolver: zodResolver(schema) });
  const setAuth = useAuthStore(s => s.setAuth);
  const router = useRouter();

  const onSubmit = async ({ confirm, ...data }: F) => {
    setError('');
    try {
      const res = await authApi.register({ ...data, role: 'doctor' });
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
      router.push('/dashboard');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Registration failed.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-in">
        <div className="text-center mb-8">
          <Link href="/" className="font-bold text-violet-600 text-2xl">Dochain</Link>
          <h1 className="text-gray-600 text-sm mt-2">Doctor Registration</h1>
        </div>

        <div className="card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Join as a Doctor</h2>
              <p className="text-gray-600 text-xs">Start with 3 months free</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">{error}</div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">First name</label>
                <input {...register('firstName')} className="input" placeholder="Ravi" />
                {errors.firstName && <p className="text-red-600 text-xs mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="label">Last name</label>
                <input {...register('lastName')} className="input" placeholder="Kumar" />
              </div>
            </div>

            <div>
              <label className="label">Email</label>
              <input {...register('email')} type="email" className="input" placeholder="dr.ravi@example.com" />
              {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Phone</label>
              <input {...register('phone')} type="tel" className="input" placeholder="+91 98765 43210" />
            </div>

            <div>
              <label className="label">Specialization</label>
              <select {...register('specialization')} className="input">
                <option value="">Select specialization</option>
                {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.specialization && <p className="text-red-600 text-xs mt-1">{errors.specialization.message}</p>}
            </div>

            <div>
              <label className="label">City</label>
              <input {...register('city')} className="input" placeholder="Chennai" />
              {errors.city && <p className="text-red-600 text-xs mt-1">{errors.city.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input {...register('password')} type={showPass ? 'text' : 'password'} className="input pr-10" placeholder="Min 8 characters" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="label">Confirm password</label>
              <input {...register('confirm')} type="password" className="input" placeholder="Repeat password" />
              {errors.confirm && <p className="text-red-600 text-xs mt-1">{errors.confirm.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</> : 'Create Doctor Account'}
            </button>
          </form>

          <p className="text-center text-gray-600 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-violet-600 hover:text-violet-700 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
