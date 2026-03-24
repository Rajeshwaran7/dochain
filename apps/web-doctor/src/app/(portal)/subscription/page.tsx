'use client';

import { useState } from 'react';
import { Check, Loader2, CreditCard, AlertCircle, X } from 'lucide-react';
import {
  useSubscriptionPlans,
  useMySubscription,
  useCreateSubscription,
  useCancelSubscription,
} from '@/hooks/useApi';

declare global {
  interface Window {
    Razorpay: unknown;
  }
}

const PLAN_COLORS: Record<string, string> = {
  free: 'border-gray-200',
  basic: 'border-sky-500/40',
  pro: 'border-violet-500/40',
  featured: 'border-amber-500/40',
};

const PLAN_BADGES: Record<string, string | null> = {
  free: null,
  basic: null,
  pro: 'Most Popular',
  featured: 'Best Value',
};

export default function SubscriptionPage() {
  const { data: plans = [], isLoading: plansLoading } = useSubscriptionPlans();
  const { data: currentSub } = useMySubscription();
  const { mutateAsync: createSub, isPending } = useCreateSubscription();
  const { mutateAsync: cancelSub, isPending: isCancelling } = useCancelSubscription();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const handleSubscribe = async (plan: string) => {
    if (plan === 'free') {
      await createSub(plan);
      return;
    }
    const result = await createSub(plan);
    if (!result?.razorpaySubscriptionId) {
      return;
    }

    await loadRazorpay();

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      subscription_id: result.razorpaySubscriptionId,
      name: 'Dochain',
      description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
      theme: { color: '#7c3aed' },
      handler: () => {
        window.location.reload();
      },
    };

    const Rzp = (window as Window & { Razorpay: new (o: Record<string, unknown>) => { open: () => void } }).Razorpay;
    const rzp = new Rzp(options);
    rzp.open();
  };

  const handleCancelClick = () => setShowCancelConfirm(true);
  const handleCancelConfirm = async () => {
    await cancelSub(cancelReason || undefined);
    setShowCancelConfirm(false);
    setCancelReason('');
  };
  const handleCancelClose = () => {
    setShowCancelConfirm(false);
    setCancelReason('');
  };

  if (plansLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" aria-hidden />
      </div>
    );
  }

  return (
    <div className="px-4 py-10">
      <div className="mx-auto max-w-4xl">
        {currentSub ? (
          <div className="card mb-8 flex flex-wrap items-center gap-3 border-violet-200 bg-violet-50 p-4">
            <CreditCard className="h-5 w-5 shrink-0 text-violet-600" aria-hidden />
            <div className="min-w-0 flex-1">
              <span className="font-semibold capitalize text-gray-900">{currentSub.plan} Plan</span>{' '}
              <span className="text-sm text-gray-600">— Active subscription</span>
            </div>
            {currentSub.currentPeriodEnd ? (
              <span className="text-sm text-gray-600">
                Renews {new Date(currentSub.currentPeriodEnd).toLocaleDateString('en-IN')}
              </span>
            ) : null}
            {currentSub.plan !== 'free' ? (
              <button
                type="button"
                onClick={handleCancelClick}
                disabled={isCancelling}
                className="text-sm text-red-600 hover:text-red-700 hover:underline disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling…' : 'Cancel subscription'}
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="mb-10 text-center">
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Choose your plan</h2>
          <p className="text-gray-600">Start free for 3 months. Upgrade anytime.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan: { plan: string; price: number; features?: string[] }) => {
            const isCurrent = currentSub?.plan === plan.plan;
            const badge = PLAN_BADGES[plan.plan];
            return (
              <div
                key={plan.plan}
                className={`card relative flex flex-col border-2 p-5 transition-all ${
                  PLAN_COLORS[plan.plan] ?? 'border-gray-200'
                } ${isCurrent ? 'ring-1 ring-violet-500/50' : ''}`}
              >
                {badge ? (
                  <div className="badge badge-purple absolute -top-3 left-1/2 -translate-x-1/2 px-3 text-xs">
                    {badge}
                  </div>
                ) : null}

                <div className="mb-4">
                  <div className="text-lg font-bold capitalize text-gray-900">{plan.plan}</div>
                  <div className="mt-1">
                    {plan.price === 0 ? (
                      <span className="text-2xl font-bold text-gray-900">Free</span>
                    ) : (
                      <>
                        <span className="text-2xl font-bold text-gray-900">₹{plan.price}</span>
                        <span className="text-sm text-gray-600">/mo</span>
                      </>
                    )}
                  </div>
                </div>

                <ul className="mb-5 flex-1 space-y-2">
                  {(plan.features ?? []).map((f: string) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => !isCurrent && handleSubscribe(plan.plan)}
                  disabled={isCurrent || isPending}
                  className={`w-full rounded-xl py-2.5 text-sm font-medium transition-all ${
                    isCurrent
                      ? 'cursor-default border border-violet-200 bg-violet-50 text-violet-600'
                      : 'btn-primary'
                  }`}
                >
                  {isCurrent ? 'Current plan' : `Get ${plan.plan}`}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-8 card flex items-start gap-3 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-gray-600" aria-hidden />
          <p className="text-sm text-gray-600">
            Payments are processed securely via Razorpay. You can cancel anytime from your dashboard. New doctors get
            a free 3-month trial on the Basic plan.
          </p>
        </div>

        {showCancelConfirm ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-title"
          >
            <div className="card w-full max-w-md p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 id="cancel-title" className="font-semibold text-gray-900">
                  Cancel subscription?
                </h3>
                <button
                  type="button"
                  onClick={handleCancelClose}
                  className="rounded p-1 text-gray-500 hover:text-gray-700"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="mb-4 text-sm text-gray-600">
                Your plan will remain active until the end of the current billing period. You can resubscribe anytime.
              </p>
              <label htmlFor="cancel-reason" className="mb-1 block text-sm font-medium text-gray-700">
                Reason (optional)
              </label>
              <input
                id="cancel-reason"
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. switching plan"
                className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={handleCancelClose} className="btn-ghost rounded-lg px-4 py-2">
                  Keep subscription
                </button>
                <button
                  type="button"
                  onClick={handleCancelConfirm}
                  disabled={isCancelling}
                  className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {isCancelling ? 'Cancelling…' : 'Cancel subscription'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

async function loadRazorpay(): Promise<void> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
}
