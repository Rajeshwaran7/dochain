import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { HealthContent } from './HealthContent';

function HealthFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 pb-24">
      <Loader2 className="h-8 w-8 animate-spin text-cyan-600" aria-hidden />
    </div>
  );
}

/**
 * Health hub; `?tab=records|prescriptions|messages` selects the tab (shareable / back-button friendly).
 */
export default function HealthPage() {
  return (
    <Suspense fallback={<HealthFallback />}>
      <HealthContent />
    </Suspense>
  );
}
