'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Star, MessageSquare, Loader2 } from 'lucide-react';
import { useMyProfile, useMyReviews } from '@/hooks/useApi';
import { reviewsApi } from '@/lib/api';

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`w-4 h-4 ${i < rating ? 'text-amber-400 fill-current' : 'text-gray-300'}`} />
      ))}
    </div>
  );
}

export default function DoctorReviewsPage() {
  const { data: profile } = useMyProfile();
  const { data: reviewsData, isLoading } = useMyReviews(profile?.id);
  const reviews = reviewsData?.data || [];

  const [replyState, setReplyState] = useState<Record<string, { open: boolean; text: string; sending: boolean }>>({});

  const openReply = (id: string, existing?: string) =>
    setReplyState(s => ({ ...s, [id]: { open: true, text: existing || '', sending: false } }));

  const sendReply = async (id: string) => {
    setReplyState(s => ({ ...s, [id]: { ...s[id], sending: true } }));
    await reviewsApi.reply(id, replyState[id].text);
    setReplyState(s => ({ ...s, [id]: { open: false, text: '', sending: false } }));
  };

  const avgRating = reviews.length
    ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="glass sticky top-0 z-30 border-b border-gray-200 px-6 h-14 flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 flex items-center gap-1 text-sm">
          <ChevronLeft className="w-4 h-4" /> Dashboard
        </Link>
        <h1 className="font-semibold text-gray-800">Patient Reviews</h1>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Summary */}
        <div className="card p-6 mb-6 flex items-center gap-6">
          <div className="text-center">
            <div className="font-bold text-4xl text-gray-900">{avgRating}</div>
            <StarRow rating={Math.round(Number(avgRating))} />
            <div className="text-gray-400 text-xs mt-1">{reviews.length} reviews</div>
          </div>
          <div className="flex-1 space-y-1.5">
            {[5,4,3,2,1].map(star => {
              const count = reviews.filter((r: any) => r.rating === star).length;
              const pct   = reviews.length ? (count / reviews.length) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500 w-3">{star}</span>
                  <Star className="w-3 h-3 text-amber-400 fill-current" />
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-gray-400 w-4 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading reviews…
          </div>
        ) : reviews.length === 0 ? (
          <div className="card p-12 text-center">
            <Star className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No reviews yet. Complete appointments to receive patient feedback.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev: any) => {
              const patientUser = rev.patient?.user || {};
              const rs = replyState[rev.id];
              return (
                <div key={rev.id} className="card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm shrink-0">
                        {patientUser.firstName?.[0]}{patientUser.lastName?.[0]}
                      </div>
                      <div>
                        <div className="text-gray-800 font-medium text-sm">
                          {patientUser.firstName} {patientUser.lastName}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <StarRow rating={rev.rating} />
                  </div>

                  {rev.comment && (
                    <p className="text-gray-500 text-sm leading-relaxed mb-3">{rev.comment}</p>
                  )}

                  {/* Existing reply */}
                  {rev.doctorReply && !rs?.open && (
                    <div className="ml-4 bg-gray-50 rounded-xl p-3 mb-3">
                      <div className="text-xs text-violet-600 font-medium mb-1">Your reply</div>
                      <p className="text-gray-500 text-sm">{rev.doctorReply}</p>
                    </div>
                  )}

                  {/* Reply composer */}
                  {rs?.open ? (
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={rs.text}
                        onChange={e => setReplyState(s => ({ ...s, [rev.id]: { ...s[rev.id], text: e.target.value } }))}
                        className="input text-sm resize-none"
                        rows={3}
                        placeholder="Write a professional reply…"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => sendReply(rev.id)}
                          disabled={rs.sending || !rs.text.trim()}
                          className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
                        >
                          {rs.sending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                          {rs.sending ? 'Sending…' : 'Post reply'}
                        </button>
                        <button
                          onClick={() => setReplyState(s => ({ ...s, [rev.id]: { open: false, text: '', sending: false } }))}
                          className="btn-secondary text-sm py-2 px-4"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    !rev.doctorReply && (
                      <button
                        onClick={() => openReply(rev.id)}
                        className="text-violet-600 text-xs flex items-center gap-1 hover:text-violet-700 transition-colors mt-2"
                      >
                        <MessageSquare className="w-3 h-3" /> Reply to this review
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
