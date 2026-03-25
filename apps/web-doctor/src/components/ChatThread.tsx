'use client';

import { useEffect, useRef } from 'react';
import { Loader2, Send } from 'lucide-react';
import { useChatComposer } from '@/hooks/useChatComposer';

export type ChatMessage = {
  id: string;
  senderType: 'doctor' | 'patient';
  body: string | null;
  status?: string;
  createdAt: string;
};

type Props = {
  conversationId?: string;
  role: 'doctor' | 'patient';
  peerName?: string;
  peerSubtitle?: string;
  messages: ChatMessage[] | undefined;
  isLoading: boolean;
  onSend: (body: string) => Promise<void>;
  sendPending?: boolean;
};

function formatMineStatus(status: string | undefined): string | null {
  if (status === 'read') return 'Read';
  if (status === 'delivered') return 'Delivered';
  if (status === 'sent') return 'Sent';
  return null;
}

function DoctorMessageList({
  messages,
  role,
}: {
  messages: ChatMessage[];
  role: 'doctor' | 'patient';
}) {
  return (
    <>
      {messages.map((m) => {
        const mine = m.senderType === role;
        const statusHint = mine ? formatMineStatus(m.status) : null;
        return (
          <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                mine ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{m.body}</p>
              <div
                className={`mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] ${
                  mine ? 'text-violet-200' : 'text-gray-500'
                }`}
              >
                <span>
                  {new Date(m.createdAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {statusHint ? <span aria-hidden>·</span> : null}
                {statusHint ? <span className="uppercase tracking-wide">{statusHint}</span> : null}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

type ComposerProps = {
  text: string;
  sendPending: boolean | undefined;
  onChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
};

function DoctorScrollMessages({
  isLoading,
  messages,
  role,
  bottomRef,
}: {
  isLoading: boolean;
  messages: ChatMessage[] | undefined;
  role: 'doctor' | 'patient';
  bottomRef: React.Ref<HTMLDivElement>;
}) {
  return (
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
      {isLoading ? (
        <div className="flex justify-center py-8 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
        </div>
      ) : !messages?.length ? (
        <p className="py-6 text-center text-sm text-gray-500">No messages yet. Say hello below.</p>
      ) : (
        <DoctorMessageList messages={messages} role={role} />
      )}
      <div ref={bottomRef} />
    </div>
  );
}

function DoctorChatComposer({ text, sendPending, onChange, onSubmit, onKeyDown }: ComposerProps) {
  return (
    <form onSubmit={onSubmit} className="shrink-0 border-t border-gray-100 bg-gray-50/50 p-3">
      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a message…"
          className="input max-h-32 min-h-[44px] flex-1 resize-y text-sm leading-relaxed"
          rows={2}
          maxLength={8000}
          disabled={sendPending}
          aria-label="Message"
        />
        <button
          type="submit"
          className="btn-primary flex shrink-0 items-center gap-1 self-end px-4 py-2.5"
          disabled={sendPending === true || !text.trim()}
        >
          {sendPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
      <p className="mt-2 text-[11px] text-gray-400">Enter to send · Shift+Enter for a new line</p>
    </form>
  );
}

/**
 * Scrollable message list with composer; aligns bubbles by sender role.
 */
export function ChatThread({
  conversationId,
  role,
  peerName,
  peerSubtitle,
  messages,
  isLoading,
  onSend,
  sendPending,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const { text, setText, handleSubmit, handleKeyDown } = useChatComposer(onSend, sendPending);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, conversationId]);

  return (
    <div className="flex h-[min(72vh,580px)] min-h-[300px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {peerName ? (
        <header className="shrink-0 border-b border-gray-100 bg-gradient-to-r from-violet-50/90 to-white px-4 py-3">
          <div className="font-semibold text-gray-900">{peerName}</div>
          {peerSubtitle ? <div className="text-xs text-gray-500">{peerSubtitle}</div> : null}
        </header>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col">
        <DoctorScrollMessages
          isLoading={isLoading}
          messages={messages}
          role={role}
          bottomRef={bottomRef}
        />

        <DoctorChatComposer
          text={text}
          sendPending={sendPending}
          onChange={setText}
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
}
