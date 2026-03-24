'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { ChatThread, type ChatMessage } from '@/components/ChatThread';
import {
  usePatientChatConversations,
  usePatientChatMessages,
  useSendPatientChatMessage,
  useMarkPatientChatRead,
} from '@/hooks/useApi';

export default function PatientMessageThreadPage() {
  const params = useParams<{ conversationId: string }>();
  const id = params.conversationId;
  const { data: conversations = [] } = usePatientChatConversations();
  const { data: messages, isLoading } = usePatientChatMessages(id);
  const { mutateAsync: send, isPending: sendPending } = useSendPatientChatMessage(id);
  const { mutate: markRead } = useMarkPatientChatRead(id);

  const peerName = useMemo(() => {
    const c = conversations.find((x: { id: string }) => x.id === id) as
      | { doctor?: { user?: { firstName?: string; lastName?: string } } }
      | undefined;
    const u = c?.doctor?.user;
    const name = u ? `Dr. ${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() : '';
    return name || undefined;
  }, [conversations, id]);

  useEffect(() => {
    if (!id) return;
    markRead();
  }, [id, markRead]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      <nav className="glass sticky top-0 z-40 border-b border-gray-200 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/health?tab=messages" className="text-gray-600 hover:text-cyan-700">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <span className="font-medium text-gray-900">{peerName ?? 'Messages'}</span>
        </div>
      </nav>
      <div className="max-w-lg mx-auto px-4 py-4">
        <ChatThread
          conversationId={id}
          role="patient"
          peerName={peerName ?? 'Messages'}
          peerSubtitle="Your doctor"
          messages={messages as ChatMessage[] | undefined}
          isLoading={isLoading}
          onSend={(body) => send(body)}
          sendPending={sendPending}
        />
      </div>
    </div>
  );
}
