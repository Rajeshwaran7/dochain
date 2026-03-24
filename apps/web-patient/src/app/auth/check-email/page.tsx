'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, Mail, UserPlus } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

function CheckEmailContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    useAuthStore.getState().clearAuth();
  }, []);
  const email = searchParams.get('email') ?? '';
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const onResend = async () => {
    if (!email.trim()) return;
    setError('');
    setPending(true);
    try {
      await authApi.resendVerificationByEmail(email.trim());
      setSent(true);
    } catch {
      setError('Could not send email. Try again later.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md animate-in">
        <div className="mb-8 text-center">
          <Link href="/" className="font-display text-2xl font-bold text-cyan-600">
            Dochain
          </Link>
          <p className="mt-2 text-sm text-gray-600">Patient</p>
        </div>

        <div className="card p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-50">
              <Mail className="h-6 w-6 text-cyan-600" aria-hidden />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Verify your email</h1>
              <p className="text-xs text-gray-600">One more step to use Dochain</p>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-gray-700">
            We sent a verification link
            {email ? (
              <>
                {' '}
                to <span className="font-semibold text-gray-900">{email}</span>
              </>
            ) : (
              ' to your inbox'
            )}
            . Open it to confirm your account — you can sign in only after your email is verified.
          </p>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {sent ? (
            <p className="mt-4 text-sm text-emerald-700">If that address is registered, a new link was sent.</p>
          ) : null}

          <div className="mt-6 space-y-3">
            {email ? (
              <button
                type="button"
                onClick={() => void onResend()}
                disabled={pending}
                className="btn-secondary flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold"
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Mail className="h-4 w-4" aria-hidden />
                )}
                {pending ? 'Sending…' : 'Resend verification email'}
              </button>
            ) : null}

            <Link
              href="/auth/login"
              className="btn-primary flex w-full items-center justify-center gap-2 py-3 text-center text-sm font-semibold"
            >
              <UserPlus className="h-4 w-4" aria-hidden />
              Go to sign in
            </Link>
          </div>

          <p className="mt-6 text-center text-xs text-gray-500">
            Wrong email?{' '}
            <Link href="/auth/register" className="font-medium text-cyan-600 hover:text-cyan-700">
              Register again
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Shown after patient registration when email must be verified before sign-in.
 */
export default function PatientCheckEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-600" aria-hidden />
        </div>
      }
    >
      <CheckEmailContent />
    </Suspense>
  );
}
