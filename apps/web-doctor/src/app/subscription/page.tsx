'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Check, Loader2, CreditCard, AlertCircle, X } from 'lucide-react';
import { useSubscriptionPlans, useMySubscription, useCreateSubscription, useCancelSubscription } from '@/hooks/useApi';

declare global { interface Window { Razorpay: unknown } }

const PLAN_COLORS: Record<string, string> = {
  free:     'border-gray-200',
  basic:    'border-sky-500/40',
  pro:      'border-violet-500/40',
  featured: 'border-amber-500/40',
};

const PLAN_BADGES: Record<string, string | null> = {
  free: null, basic: null, pro: 'Most Popular', featured: 'Best Value',
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
    if (!result?.razorpaySubscriptionId) return;

    // Load Razorpay script
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

    const rzp = new (window as Window & { Razorpay: new (o: Record<string, unknown>) => { open: () => void } }).Razorpay(options);
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

  if (plansLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="glass sticky top-0 z-30 border-b border-gray-200 px-6 h-14 flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm">
          <ChevronLeft className="w-4 h-4" /> Dashboard
        </Link>
        <h1 className="font-semibold text-gray-900">Subscription Plans</h1>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Current plan banner */}
        {currentSub && (
          <div className="card p-4 mb-8 border-violet-200 bg-violet-50 flex flex-wrap items-center gap-3">
            <CreditCard className="w-5 h-5 text-violet-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-gray-900 capitalize">{currentSub.plan} Plan</span>
              {' '}
              <span className="text-gray-600 text-sm">— Active subscription</span>
            </div>
            {currentSub.currentPeriodEnd && (
              <span className="text-gray-600 text-sm">
                Renews {new Date(currentSub.currentPeriodEnd).toLocaleDateString('en-IN')}
              </span>
            )}
            {currentSub.plan !== 'free' && (
              <button
                type="button"
                onClick={handleCancelClick}
                disabled={isCancelling}
                className="text-sm text-red-600 hover:text-red-700 hover:underline disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling…' : 'Cancel subscription'}
              </button>
            )}
          </div>
        )}

        <div className="text-center mb-10">
          <h2 className="font-bold text-2xl text-gray-900 mb-2">Choose your plan</h2>
          <p className="text-gray-600">Start free for 3 months. Upgrade anytime.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan: any) => {
            const isCurrent = currentSub?.plan === plan.plan;
            const badge = PLAN_BADGES[plan.plan];
            return (
              <div key={plan.plan}
                className={`card p-5 flex flex-col relative border-2 transition-all ${
                  PLAN_COLORS[plan.plan]
                } ${isCurrent ? 'ring-1 ring-violet-500/50' : ''}`}
              >
                {badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 badge badge-purple text-xs px-3">
                    {badge}
                  </div>
                )}

                <div className="mb-4">
                  <div className="capitalize font-bold text-gray-900 text-lg">{plan.plan}</div>
                  <div className="mt-1">
                    {plan.price === 0
                      ? <span className="text-2xl font-bold text-gray-900">Free</span>
                      : (
                        <>
                          <span className="text-2xl font-bold text-gray-900">₹{plan.price}</span>
                          <span className="text-gray-600 text-sm">/mo</span>
                        </>
                      )
                    }
                  </div>
                </div>

                <ul className="space-y-2 flex-1 mb-5">
                  {(plan.features || []).map((f: string) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => !isCurrent && handleSubscribe(plan.plan)}
                  disabled={isCurrent || isPending}
                  className={`w-full py-2.5 rounded-xl font-medium text-sm transition-all ${
                    isCurrent
                      ? 'bg-violet-50 text-violet-600 border border-violet-200 cursor-default'
                      : 'btn-primary'
                  }`}
                >
                  {isCurrent ? 'Current plan' : `Get ${plan.plan}`}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-8 card p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-gray-600 shrink-0 mt-0.5" />
          <p className="text-gray-600 text-sm">
            Payments are processed securely via Razorpay. You can cancel anytime from your dashboard.
            New doctors get a free 3-month trial on the Basic plan.
          </p>
        </div>

        {showCancelConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="cancel-title">
            <div className="card max-w-md w-full p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 id="cancel-title" className="font-semibold text-gray-900">Cancel subscription?</h3>
                <button type="button" onClick={handleCancelClose} className="p-1 text-gray-500 hover:text-gray-700 rounded" aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Your plan will remain active until the end of the current billing period. You can resubscribe anytime.
              </p>
              <label htmlFor="cancel-reason" className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
              <input
                id="cancel-reason"
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. switching plan"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4"
              />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={handleCancelClose} className="btn-ghost py-2 px-4 rounded-lg">
                  Keep subscription
                </button>
                <button type="button" onClick={handleCancelConfirm} disabled={isCancelling} className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50">
                  {isCancelling ? 'Cancelling…' : 'Cancel subscription'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

async function loadRazorpay(): Promise<void> {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
}
