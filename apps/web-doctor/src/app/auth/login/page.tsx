'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Stethoscope, Mail } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

const schema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(8, 'Minimum 8 characters'),
});
type F = z.infer<typeof schema>;

const EMAIL_NOT_VERIFIED_MSG = 'Email not verified.';

export default function DoctorLoginPage() {
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendPending, setResendPending] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<F>({
    resolver: zodResolver(schema),
  });
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  const onSubmit = async (data: F) => {
    setError('');
    setShowResend(false);
    setResendSuccess(false);
    try {
      const res = await authApi.login(data);
      if (res.data.user.role !== 'doctor' && res.data.user.role !== 'admin') {
        setError('This portal is for doctors only. Please use the patient app.');
        return;
      }
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
      router.push('/dashboard');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Login failed. Please try again.';
      setError(msg);
      if (msg.startsWith(EMAIL_NOT_VERIFIED_MSG)) {
        setShowResend(true);
        setResendEmail(data.email);
      }
    }
  };

  const onResendVerification = async () => {
    if (!resendEmail) return;
    setResendPending(true);
    setError('');
    try {
      await authApi.resendVerificationByEmail(resendEmail);
      setResendSuccess(true);
    } catch {
      setError('Failed to send verification email. Try again later.');
    } finally {
      setResendPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-in">
        <div className="text-center mb-8">
          <Link href="/" className="font-bold text-violet-600 text-2xl">Dochain</Link>
          <h1 className="text-gray-600 text-sm mt-2">Doctor Portal</h1>
        </div>

        <div className="card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Welcome back, Doctor</h2>
              <p className="text-gray-600 text-xs">Sign in to manage your practice</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
              {error}
            </div>
          )}

          {showResend && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3 mb-5">
              <p className="font-medium mb-2">Verify your email to sign in</p>
              <p className="text-amber-700 text-xs mb-3">
                We sent a link to <strong>{resendEmail}</strong>. Click it to verify, or request a new link below.
              </p>
              {resendSuccess ? (
                <p className="text-green-700 text-xs">Verification email sent. Check your inbox.</p>
              ) : (
                <button
                  type="button"
                  onClick={onResendVerification}
                  disabled={resendPending}
                  className="flex items-center gap-2 text-violet-600 hover:text-violet-700 font-medium text-xs"
                >
                  {resendPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                  {resendPending ? 'Sending…' : 'Resend verification email'}
                </button>
              )}
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900 transition-colors"
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

          <p className="text-center text-gray-600 text-sm mt-6">
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
