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

const schema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(8, 'Minimum 8 characters'),
});
type F = z.infer<typeof schema>;

export default function DoctorLoginPage() {
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<F>({
    resolver: zodResolver(schema),
  });
  const setAuth = useAuthStore(s => s.setAuth);
  const router  = useRouter();

  const onSubmit = async (data: F) => {
    setError('');
    try {
      const res = await authApi.login(data);
      if (res.data.user.role !== 'doctor' && res.data.user.role !== 'admin') {
        setError('This portal is for doctors only. Please use the patient app.');
        return;
      }
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
      router.push('/dashboard');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-in">
        <div className="text-center mb-8">
          <Link href="/" className="font-bold text-violet-600 text-2xl">Dochain</Link>
          <h1 className="text-gray-500 text-sm mt-2">Doctor Portal</h1>
        </div>

        <div className="card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Welcome back, Doctor</h2>
              <p className="text-gray-500 text-xs">Sign in to manage your practice</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                {...register('email')}
                type="email"
                className="input"
                placeholder="dr.you@example.com"
                autoComplete="email"
              />
              {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  className="input pr-11"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>}
              <div className="text-right mt-1">
                <Link href="/auth/forgot-password" className="text-violet-600 hover:text-violet-700 text-xs font-medium">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
                : 'Sign in to Dashboard'
              }
            </button>
          </form>

          <div className="mt-5 text-center">
            <div className="relative flex items-center my-4">
              <div className="flex-1 border-t border-gray-200" />
              <span className="px-3 text-gray-400 text-xs">or</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </a>
          </div>

          <p className="text-center text-gray-500 text-sm mt-6">
            New to Dochain?{' '}
            <Link href="/auth/register" className="text-violet-600 hover:text-violet-700 font-medium">
              Register as Doctor
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
