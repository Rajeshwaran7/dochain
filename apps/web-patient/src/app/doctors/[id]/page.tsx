'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Star, MapPin, Calendar, Clock, Award, Languages,
  ChevronLeft, Loader2, MessageSquare,
} from 'lucide-react';
import {
  useDoctor,
  useAvailableSlots,
  useDoctorReviews,
  useBookAppointment,
  useOpenPatientConversation,
} from '@/hooks/useApi';
import { useAuthStore } from '@/store/auth.store';
import { formatCurrency, formatTime, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';
import { toast } from 'sonner';

declare global { interface Window { Razorpay: unknown } }

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getNext7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : DAYS[d.getDay()],
      date: d.toISOString().split('T')[0],
      dayNum: d.getDate(),
    };
  });
}

function doctorSlotTitle(slot: DoctorSlotOption): string {
  if (slot.status === 'booked') return 'Already booked';
  if (slot.status === 'completed') return 'Visit completed';
  if (slot.status === 'past') return 'Past time';
  return 'Book this slot';
}

function doctorSlotButtonClass(slot: DoctorSlotOption, selected: boolean): string {
  const base = 'rounded-lg py-1.5 text-xs transition-all w-full';
  if (slot.status === 'available') {
    if (selected) {
      return `${base} bg-cyan-600 text-white font-semibold ring-2 ring-cyan-200`;
    }
    return `${base} bg-gray-100 text-gray-800 hover:bg-gray-200`;
  }
  if (slot.status === 'booked') {
    return `${base} cursor-not-allowed bg-amber-50 text-amber-800/70 line-through decoration-amber-700/40`;
  }
  if (slot.status === 'completed') {
    return `${base} cursor-not-allowed bg-gray-200 text-gray-500`;
  }
  return `${base} cursor-not-allowed bg-slate-100 text-slate-400`;
}

export default function DoctorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(getNext7Days()[0].date);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [symptoms, setSymptoms] = useState('');

  const { data: doctor, isLoading } = useDoctor(id);
  const { data: slots = [] } = useAvailableSlots(id, selectedDate);
  const { data: reviewsData } = useDoctorReviews(id);
  const { mutateAsync: bookAppt, isPending } = useBookAppointment();
  const { mutateAsync: openChat, isPending: chatPending } = useOpenPatientConversation();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const row = slots.find((s) => s.time === selectedSlot);
    if (selectedSlot && row && row.status !== 'available') {
      setSelectedSlot('');
    }
  }, [slots, selectedSlot]);

  const selectedSlotOk = slots.find((s) => s.time === selectedSlot)?.status === 'available';

  const handleMessageDoctor = async () => {
    try {
      const conv = await openChat({ doctorId: id });
      router.push(`/messages/${conv.id}`);
    } catch {
      toast.error('You can message this doctor after you have an appointment together.');
    }
  };

  const days = getNext7Days();

  const handleBook = async () => {
    if (!selectedSlot) return;
    try {
      const [startH, startM] = selectedSlot.split(':').map(Number);
      const endMin = startH * 60 + startM + 30;
      const endTime = `${Math.floor(endMin / 60).toString().padStart(2,'0')}:${(endMin % 60).toString().padStart(2,'0')}`;
      const idempotencyKey = crypto.randomUUID();
      const result = await bookAppt({
        doctorId: id,
        appointmentDate: selectedDate,
        startTime: selectedSlot,
        endTime,
        symptoms,
        idempotencyKey,
      });

      if (result.razorpayOrderId) {
        await loadRazorpay();
        const options = {
          key: result.razorpayKeyId,
          amount: result.amount,
          currency: 'INR',
          name: 'Dochain',
          description: `Appointment with Dr. ${doctor?.user?.firstName ?? ''}`,
          order_id: result.razorpayOrderId,
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            try {
              await api.post(`/appointments/${result.appointment.id}/verify-payment`, {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              toast.success('Payment verified. Your appointment is booked.');
              router.push('/dashboard');
            } catch {
              toast.error(
                `Payment received but verification failed. Save this ID for support: ${response.razorpay_payment_id}`,
              );
            }
          },
          theme: { color: '#06b6d4' },
        };
        const rzp = new (window as { Razorpay: new (opts: unknown) => { open: () => void } }).Razorpay(options);
        rzp.open();
      } else {
        toast.success('Appointment booked.');
        router.push('/dashboard');
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? 'Booking failed');
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
    </div>
  );

  if (!doctor) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-600">Doctor not found</div>
    </div>
  );

  const user = doctor.user || {};
  const clinic = doctor.clinic;
  const reviews = reviewsData?.data || [];
  const profilePhoto =
    (doctor as { profileImage?: string | null }).profileImage ?? (user as { avatar?: string }).avatar;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <nav className="glass sticky top-0 z-40 border-b border-gray-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link href="/doctors" className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1 text-sm">
            <ChevronLeft className="w-4 h-4" /> Back
          </Link>
          <span className="text-gray-500">|</span>
          <Link href="/" className="font-display font-bold text-cyan-600">Dochain</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Left column — info */}
          <div className="md:col-span-2 space-y-5">
            {/* Header card */}
            <div className="card p-6 flex gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                {profilePhoto
                  ? <img src={profilePhoto} alt="" className="w-full h-full object-cover" />
                  : <span className="font-display font-bold text-2xl text-cyan-600">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </span>
                }
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="font-display text-xl font-bold text-gray-900">
                      Dr. {user.firstName} {user.lastName}
                    </h1>
                    <p className="text-cyan-600">{doctor.specialization}
                      {doctor.subSpecialization ? ` · ${doctor.subSpecialization}` : ''}
                    </p>
                  </div>
                  {doctor.isFeatured && <span className="badge badge-yellow">Featured</span>}
                </div>
                <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-600">
                  {doctor.experienceYears > 0 && (
                    <span className="flex items-center gap-1"><Award className="w-4 h-4" /> {doctor.experienceYears} yrs exp.</span>
                  )}
                  {doctor.city && (
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {doctor.city}</span>
                  )}
                  {doctor.averageRating > 0 && (
                    <span className="flex items-center gap-1 text-amber-600">
                      <Star className="w-4 h-4 fill-current" />
                      {Number(doctor.averageRating).toFixed(1)} ({doctor.totalReviews} reviews)
                    </span>
                  )}
                </div>
                {isAuthenticated ? (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={handleMessageDoctor}
                      disabled={chatPending}
                      className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-800 hover:bg-cyan-100 disabled:opacity-60"
                    >
                      {chatPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <MessageSquare className="h-4 w-4" aria-hidden />
                      )}
                      Message doctor
                    </button>
                    <p className="mt-1 text-xs text-gray-500">Requires an existing appointment.</p>
                  </div>
                ) : null}
              </div>
            </div>

            {/* About */}
            {doctor.bio && (
              <div className="card p-5">
                <h2 className="font-semibold text-gray-900 mb-3">About</h2>
                <p className="text-gray-600 text-sm leading-relaxed">{doctor.bio}</p>
              </div>
            )}

            {/* Details */}
            <div className="card p-5 grid sm:grid-cols-2 gap-4">
              {doctor.qualification && (
                <div>
                  <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Qualification</div>
                  <div className="text-gray-900 text-sm">{doctor.qualification}</div>
                </div>
              )}
              {doctor.languages?.length > 0 && (
                <div>
                  <div className="text-xs text-gray-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <Languages className="w-3 h-3" /> Languages
                  </div>
                  <div className="text-gray-900 text-sm">{doctor.languages.join(', ')}</div>
                </div>
              )}
              {doctor.services?.length > 0 && (
                <div className="sm:col-span-2">
                  <div className="text-xs text-gray-600 uppercase tracking-wide mb-2">Services</div>
                  <div className="flex flex-wrap gap-2">
                    {doctor.services.map((s: string) => (
                      <span key={s} className="badge badge-blue">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Clinic */}
            {clinic && (
              <div className="card p-5">
                <h2 className="font-semibold text-gray-900 mb-3">Clinic</h2>
                <div className="text-gray-900 font-medium">{clinic.name}</div>
                <div className="text-gray-600 text-sm mt-1">
                  {clinic.addressLine1}, {clinic.city} – {clinic.pincode}
                </div>
                {clinic.phone && <div className="text-gray-600 text-sm mt-1">📞 {clinic.phone}</div>}
              </div>
            )}

            {/* Reviews */}
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Patient Reviews</h2>
              {reviews.length === 0 ? (
                <p className="text-gray-600 text-sm">No reviews yet.</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev: any) => (
                    <div key={rev.id} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'text-amber-600 fill-current' : 'text-gray-400'}`} />
                          ))}
                        </div>
                        <span className="text-gray-600 text-xs">{formatDate(rev.createdAt)}</span>
                      </div>
                      {rev.comment && <p className="text-gray-600 text-sm">{rev.comment}</p>}
                      {rev.doctorReply && (
                        <div className="mt-2 ml-4 bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-cyan-600 font-medium mb-1">Doctor's reply</p>
                          <p className="text-gray-600 text-sm">{rev.doctorReply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column — booking */}
          <div className="space-y-4">
            <div className="card p-5 sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Book Appointment</h2>
                <span className="font-display text-xl font-bold text-cyan-600">
                </span>
              </div>

              <>
                  {/* Date picker */}
                  <div className="mb-4">
                    <label className="label text-xs">Select date</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {days.map((d) => (
                        <button
                          key={d.date}
                          onClick={() => { setSelectedDate(d.date); setSelectedSlot(''); }}
                          className={`rounded-xl py-2 text-center transition-all ${
                            selectedDate === d.date
                              ? 'bg-cyan-600 text-white font-semibold'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <div className="text-xs">{d.label}</div>
                          <div className="text-sm font-medium">{d.dayNum}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Slot picker */}
                  <div className="mb-4">
                    <label className="label text-xs">Slots for this day</label>
                    {slots.length === 0 ? (
                      <p className="text-gray-600 text-sm py-2">No schedule on this day.</p>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto">
                          {slots.map((slot) => (
                            <button
                              key={slot.time}
                              type="button"
                              title={doctorSlotTitle(slot)}
                              disabled={slot.status !== 'available'}
                              onClick={() => {
                                if (slot.status === 'available') setSelectedSlot(slot.time);
                              }}
                              className={doctorSlotButtonClass(slot, selectedSlot === slot.time)}
                            >
                              {formatTime(slot.time)}
                            </button>
                          ))}
                        </div>
                        <p className="mt-2 text-[10px] leading-snug text-gray-500">
                          Booked, completed, and past times are greyed out and cannot be selected.
                        </p>
                      </>
                    )}
                  </div>

                  {/* Symptoms */}
                  <div className="mb-5">
                    <label className="label text-xs">Symptoms / reason <span className="text-gray-600">(optional)</span></label>
                    <textarea
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      className="input text-sm resize-none"
                      rows={3}
                      placeholder="Briefly describe your symptoms…"
                    />
                  </div>

                  {isAuthenticated ? (
                    <button
                      onClick={handleBook}
                      disabled={!selectedSlotOk || isPending}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                      {isPending ? 'Booking…' : 'Confirm Booking'}
                    </button>
                  ) : (
                    <Link href="/auth/login" className="btn-primary w-full block text-center">
                      Sign in to book
                    </Link>
                  )}
                </>
            </div>
          </div>
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
