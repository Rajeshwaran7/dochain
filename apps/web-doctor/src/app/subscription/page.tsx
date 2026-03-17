'use client';
import Link from 'next/link';
import { ChevronLeft, Check, Loader2, CreditCard, AlertCircle } from 'lucide-react';
import { useSubscriptionPlans, useMySubscription, useCreateSubscription } from '@/hooks/useApi';

declare global { interface Window { Razorpay: any } }

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

    const rzp = new window.Razorpay(options);
    rzp.open();
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
          <div className="card p-4 mb-8 border-violet-200 bg-violet-50 flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-violet-600 shrink-0" />
            <div>
              <span className="font-semibold text-gray-900 capitalize">{currentSub.plan} Plan</span>
              {' '}
              <span className="text-gray-600 text-sm">— Active subscription</span>
            </div>
            {currentSub.currentPeriodEnd && (
              <span className="ml-auto text-gray-600 text-sm">
                Renews {new Date(currentSub.currentPeriodEnd).toLocaleDateString('en-IN')}
              </span>
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
