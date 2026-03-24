'use client';

import { useState } from 'react';
import { Star, MessageSquare, Loader2, Trash2, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useMyProfile, useMyReviews } from '@/hooks/useApi';
import { reviewsApi } from '@/lib/api';

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? 'fill-current text-amber-400' : 'text-gray-400'}`}
          aria-hidden
        />
      ))}
    </div>
  );
}

export default function DoctorReviewsPage() {
  const qc = useQueryClient();
  const { data: profile } = useMyProfile();
  const { data: reviewsData, isLoading } = useMyReviews(profile?.id);
  const reviews = reviewsData?.data ?? [];

  const [replyState, setReplyState] = useState<
    Record<string, { open: boolean; text: string; sending: boolean }>
  >({});
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const openReply = (id: string, existing?: string) =>
    setReplyState((s) => ({ ...s, [id]: { open: true, text: existing ?? '', sending: false } }));

  const sendReply = async (id: string) => {
    const current = replyState[id];
    if (!current) {
      return;
    }
    setReplyState((s) => ({ ...s, [id]: { ...s[id], sending: true } }));
    try {
      await reviewsApi.reply(id, current.text);
      setReplyState((s) => ({ ...s, [id]: { open: false, text: '', sending: false } }));
      qc.invalidateQueries({ queryKey: ['my-reviews'] });
      setListError(null);
    } catch {
      setReplyState((s) => ({ ...s, [id]: { ...s[id], sending: false } }));
      setListError('Could not post reply. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    setListError(null);
    try {
      await reviewsApi.delete(id);
      qc.invalidateQueries({ queryKey: ['my-reviews'] });
    } catch {
      setListError('Could not delete this review. Try again.');
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  const avgNum =
    reviews.length > 0
      ? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length
      : null;
  const avgRating = avgNum !== null ? avgNum.toFixed(1) : '—';
  const starRating = avgNum !== null ? Math.round(avgNum) : 0;

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-3xl">
        {listError ? (
          <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
            <span>{listError}</span>
            <button
              type="button"
              onClick={() => setListError(null)}
              className="shrink-0 rounded p-1 hover:bg-red-100"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        <div className="card mb-6 flex items-center gap-6 p-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900">{avgRating}</div>
            <StarRow rating={starRating} />
            <div className="mt-1 text-xs text-gray-500">{reviews.length} reviews</div>
          </div>
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.filter((r: { rating: number }) => r.rating === star).length;
              const pct = reviews.length ? (count / reviews.length) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-gray-600">{star}</span>
                  <Star className="h-3 w-3 fill-current text-amber-400" aria-hidden />
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-4 text-right text-gray-500">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12 text-gray-600">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" aria-hidden />
            Loading reviews…
          </div>
        ) : reviews.length === 0 ? (
          <div className="card p-12 text-center">
            <Star className="mx-auto mb-3 h-10 w-10 text-gray-400" />
            <p className="text-sm text-gray-600">
              No reviews yet. Complete appointments to receive patient feedback.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev: Record<string, unknown>) => {
              const revId = String(rev.id);
              const patientUser =
                (rev.patient as { user?: Record<string, unknown> } | undefined)?.user ?? {};
              const rs = replyState[revId];
              return (
                <div key={revId} className="card p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-sm font-bold text-gray-600">
                        {String(patientUser.firstName ?? '').charAt(0)}
                        {String(patientUser.lastName ?? '').charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {String(patientUser.firstName ?? '')} {String(patientUser.lastName ?? '')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(String(rev.createdAt)).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StarRow rating={Number(rev.rating)} />
                      {confirmDelete === revId ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDelete(revId)}
                            disabled={deleting === revId}
                            className="text-xs font-medium text-red-600 hover:text-red-700"
                          >
                            {deleting === revId ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Yes'}
                          </button>
                          <span className="text-xs text-gray-400">/</span>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(null)}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(revId)}
                          className="text-gray-400 transition-colors hover:text-red-500"
                          title="Delete review"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {rev.comment ? (
                    <p className="mb-3 text-sm leading-relaxed text-gray-600">{String(rev.comment)}</p>
                  ) : null}

                  {rev.doctorReply && !rs?.open ? (
                    <div className="mb-3 ml-4 rounded-xl bg-gray-50 p-3">
                      <div className="mb-1 text-xs font-medium text-violet-600">Your reply</div>
                      <p className="text-sm text-gray-600">{String(rev.doctorReply)}</p>
                    </div>
                  ) : null}

                  {rs?.open ? (
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={rs.text}
                        onChange={(e) =>
                          setReplyState((s) => ({
                            ...s,
                            [revId]: { ...s[revId], text: e.target.value },
                          }))
                        }
                        className="input resize-none text-sm"
                        rows={3}
                        placeholder="Write a professional reply…"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => sendReply(revId)}
                          disabled={rs.sending || !rs.text.trim()}
                          className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
                        >
                          {rs.sending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                          {rs.sending ? 'Sending…' : 'Post reply'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setReplyState((s) => ({
                              ...s,
                              [revId]: { open: false, text: '', sending: false },
                            }))
                          }
                          className="btn-secondary px-4 py-2 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : null}
                  {!rev.doctorReply && !rs?.open ? (
                    <button
                      type="button"
                      onClick={() => openReply(revId)}
                      className="mt-2 flex items-center gap-1 text-xs text-violet-600 transition-colors hover:text-violet-700"
                    >
                      <MessageSquare className="h-3 w-3" aria-hidden />
                      Reply to this review
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
