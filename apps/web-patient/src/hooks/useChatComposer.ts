'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';

/**
 * Manages chat input state, send-on-Enter, and error toast when send fails.
 */
export function useChatComposer(
  onSend: (body: string) => Promise<void>,
  sendPending: boolean | undefined,
) {
  const [text, setText] = useState('');

  const sendNow = useCallback(async () => {
    const t = text.trim();
    if (!t || sendPending) return;
    setText('');
    try {
      await onSend(t);
    } catch {
      setText(t);
      toast.error('Message could not be sent.');
    }
  }, [onSend, sendPending, text]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendNow();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendNow();
    }
  };

  return { text, setText, handleSubmit, handleKeyDown };
}
