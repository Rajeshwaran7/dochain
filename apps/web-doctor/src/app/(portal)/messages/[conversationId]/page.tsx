'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { ChatThread, type ChatMessage } from '@/components/ChatThread';
import { useChatConversations, useChatMessages, useSendChatMessage, useMarkChatRead } from '@/hooks/useApi';

export default function DoctorMessageThreadPage() {
  const params = useParams<{ conversationId: string }>();
  const id = params.conversationId;
  const { data: conversations = [] } = useChatConversations();
  const { data: messages, isLoading } = useChatMessages(id);
  const { mutateAsync: send, isPending: sendPending } = useSendChatMessage(id);
  const { mutate: markRead } = useMarkChatRead(id);

  const peerName = useMemo(() => {
    const c = conversations.find((x: { id: string }) => x.id === id) as
      | { patient?: { user?: { firstName?: string; lastName?: string } } }
      | undefined;
    const u = c?.patient?.user;
    const name = u ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() : '';
    return name || undefined;
  }, [conversations, id]);

  useEffect(() => {
    if (!id) return;
    markRead();
  }, [id, markRead]);

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-lg">
        <Link
          href="/messages"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-violet-700"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          All conversations
        </Link>
        <ChatThread
          conversationId={id}
          role="doctor"
          peerName={peerName ?? 'Conversation'}
          peerSubtitle="Patient"
          messages={messages as ChatMessage[] | undefined}
          isLoading={isLoading}
          onSend={(body) => send(body)}
          sendPending={sendPending}
        />
      </div>
    </div>
  );
}
