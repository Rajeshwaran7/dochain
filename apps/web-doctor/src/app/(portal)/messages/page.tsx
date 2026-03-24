'use client';

import Link from 'next/link';
import { MessageSquare, Loader2, ChevronRight } from 'lucide-react';
import { useChatConversations } from '@/hooks/useApi';

export default function DoctorMessagesPage() {
  const { data: conversations = [], isLoading } = useChatConversations();

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-lg">
        <p className="mb-4 text-sm text-gray-600">
          Conversations with patients who have booked with you. Open a patient from{' '}
          <Link href="/patients" className="font-medium text-violet-600 hover:underline">
            Patients
          </Link>{' '}
          to add notes or start messaging.
        </p>

        {isLoading ? (
          <div className="flex justify-center py-16 text-gray-600">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" aria-hidden />
          </div>
        ) : conversations.length === 0 ? (
          <div className="card p-10 text-center">
            <MessageSquare className="mx-auto mb-3 h-10 w-10 text-gray-400" aria-hidden />
            <p className="text-sm text-gray-600">No conversations yet.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {conversations.map((c: { id: string; patient?: { user?: { firstName?: string; lastName?: string } } }) => {
              const u = c.patient?.user;
              const name = u ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() : 'Patient';
              return (
                <li key={c.id}>
                  <Link
                    href={`/messages/${c.id}`}
                    className="card flex items-center justify-between gap-3 p-4 transition-colors hover:border-violet-200"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900">{name}</div>
                      <div className="truncate text-xs text-gray-500">Tap to open thread</div>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
