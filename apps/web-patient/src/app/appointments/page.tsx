'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, MapPin, ChevronLeft, Loader2, X, Star } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useMyAppointments, useCancelAppointment, useCreateReview } from '@/hooks/useApi';
import { formatDate, formatTime, getStatusColor } from '@/lib/utils';
import { toast } from 'sonner';

const TABS = [
  { label: 'Upcoming', value: 'confirmed' },
  { label: 'Pending',  value: 'pending' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function AppointmentsPage() {
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('confirmed');
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [reviewAppt, setReviewAppt] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) router.push('/auth/login');
  }, [hasHydrated, isAuthenticated, router]);

  const { data: appointments = [], isLoading } = useMyAppointments(activeTab);
  const { mutateAsync: cancel, isPending: cancelling } = useCancelAppointment();
  const { mutateAsync: submitReview, isPending: submitting } = useCreateReview();

  const handleCancel = async () => {
    if (!cancelId) return;
    setCancelError('');
    try {
      await cancel({ id: cancelId, reason });
      setCancelId(null);
      setReason('');
      toast.success('Appointment cancelled.');
    } catch {
      setCancelError('Failed to cancel appointment. Please try again.');
    }
  };

  const handleReview = async () => {
    if (!reviewAppt) return;
    setReviewError('');
    try {
      await submitReview({
        doctorId: reviewAppt.doctor?.id,
        appointmentId: reviewAppt.id,
        rating: reviewRating,
        comment: reviewComment || undefined,
      });
      setReviewAppt(null);
      setReviewRating(5);
      setReviewComment('');
      toast.success('Thanks for your review.');
    } catch {
      setReviewError('Failed to submit review. You may have already reviewed this appointment.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <nav className="glass sticky top-0 z-40 border-b border-gray-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm">
            <ChevronLeft className="w-4 h-4" /> Dashboard
          </Link>
          <span className="text-gray-500">|</span>
          <span className="font-semibold text-gray-900">My Appointments</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex-1 py-2 text-sm rounded-lg font-medium transition-all ${
                activeTab === tab.value
                  ? 'bg-cyan-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16 text-gray-600">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…
          </div>
        ) : appointments.length === 0 ? (
          <div className="card p-12 text-center">
            <Calendar className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-600 mb-1">No {activeTab} appointments</h3>
            <Link href="/doctors" className="btn-primary text-sm mt-4 inline-block">Find doctors</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appt: any) => {
              const doctor = appt.doctor;
              const user = doctor?.user || {};
              const profilePhoto = doctor?.profileImage ?? user.avatar;
              return (
                <div key={appt.id} className="card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                        {profilePhoto
                          ? <img src={profilePhoto} className="w-full h-full object-cover rounded-xl" alt="" />
                          : <span className="font-bold text-cyan-600">{user.firstName?.[0]}{user.lastName?.[0]}</span>
                        }
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          Dr. {user.firstName} {user.lastName}
                        </div>
                        <div className="text-cyan-600 text-sm">{doctor?.specialization}</div>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> {formatDate(appt.appointmentDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {formatTime(appt.startTime)}
                          </span>
                          {doctor?.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" /> {doctor.city}
                            </span>
                          )}
                        </div>
                        {appt.symptoms && (
                          <p className="text-gray-600 text-xs mt-2">Symptoms: {appt.symptoms}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={getStatusColor(appt.status)}>
                        {appt.status}
                      </span>
                      {(appt.status === 'confirmed' || appt.status === 'pending') && (
                        <button
                          onClick={() => setCancelId(appt.id)}
                          className="text-red-600 hover:text-red-700 text-xs flex items-center gap-1 transition-colors"
                        >
                          <X className="w-3 h-3" /> Cancel
                        </button>
                      )}
                      {appt.status === 'completed' && !appt.review && (
                        <button
                          onClick={() => setReviewAppt(appt)}
                          className="text-amber-600 hover:text-amber-700 text-xs flex items-center gap-1 transition-colors"
                        >
                          <Star className="w-3 h-3" /> Review
                        </button>
                      )}
                      {appt.status === 'completed' && appt.review && (
                        <span className="text-emerald-600 text-xs flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" /> Reviewed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel modal */}
      {cancelId && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-sm animate-in">
            <h3 className="font-semibold text-gray-900 mb-1">Cancel appointment</h3>
            <p className="text-gray-600 text-sm mb-4">Please provide a reason (optional).</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input text-sm resize-none mb-4"
              rows={3}
              placeholder="Reason for cancellation…"
            />
            {cancelError && (
              <p className="text-red-600 text-sm mb-3">{cancelError}</p>
            )}
            <div className="flex gap-3">
              <button onClick={() => { setCancelId(null); setReason(''); setCancelError(''); }} className="btn-secondary flex-1">
                Keep it
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 font-medium py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                Confirm cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review modal */}
      {reviewAppt && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-sm animate-in">
            <h3 className="font-semibold text-gray-900 mb-1">Rate your visit</h3>
            <p className="text-gray-600 text-sm mb-4">
              Dr. {reviewAppt.doctor?.user?.firstName} {reviewAppt.doctor?.user?.lastName}
            </p>
            <div className="flex gap-1 mb-4 justify-center">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setReviewRating(s)} className="p-1">
                  <Star className={`w-8 h-8 transition-colors ${s <= reviewRating ? 'text-amber-500 fill-current' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className="input text-sm resize-none mb-4"
              rows={3}
              placeholder="Share your experience (optional)…"
            />
            {reviewError && <p className="text-red-600 text-sm mb-3">{reviewError}</p>}
            <div className="flex gap-3">
              <button onClick={() => { setReviewAppt(null); setReviewRating(5); setReviewComment(''); setReviewError(''); }} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={handleReview} disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                {submitting ? 'Submitting…' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
