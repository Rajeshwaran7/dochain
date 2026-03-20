'use client';
import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api';
import { Loader2 } from 'lucide-react';

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const setAuth      = useAuthStore(s => s.setAuth);

  useEffect(() => {
    let cancelled = false;
    const token        = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');

    if (!token) { router.replace('/auth/login'); return; }

    localStorage.setItem('dochain_token', token);
    if (refreshToken) localStorage.setItem('dochain_refresh', refreshToken);

    authApi.me().then(res => {
      if (cancelled) return;
      setAuth(res.data.user, token, refreshToken ?? '');
      router.replace('/dashboard');
    }).catch(() => {
      if (cancelled) return;
      localStorage.removeItem('dochain_token');
      localStorage.removeItem('dochain_refresh');
      router.replace('/auth/login');
    });

    return () => { cancelled = true; };
  }, [searchParams, router, setAuth]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      <p className="text-gray-600 text-sm">Completing sign-in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
          <p className="text-gray-600 text-sm">Loading…</p>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
