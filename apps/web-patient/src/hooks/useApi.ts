import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorsApi, appointmentsApi, reviewsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

// ── Doctor hooks ──────────────────────────────────────────────────────────────
export function useDoctors(params: Record<string, any>) {
  return useQuery({
    queryKey: ['doctors', params],
    queryFn: () => doctorsApi.search(params).then((r) => r.data),
    staleTime: 1000 * 60 * 2,
  });
}

export function useDoctor(id: string) {
  return useQuery({
    queryKey: ['doctor', id],
    queryFn: () => doctorsApi.getById(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useSpecializations() {
  return useQuery({
    queryKey: ['specializations'],
    queryFn: () => doctorsApi.getSpecializations().then((r) => r.data),
    staleTime: 1000 * 60 * 10,
  });
}

export function useCities() {
  return useQuery({
    queryKey: ['cities'],
    queryFn: () => doctorsApi.getCities().then((r) => r.data),
    staleTime: 1000 * 60 * 10,
  });
}

// ── Appointment hooks ─────────────────────────────────────────────────────────
export function useAvailableSlots(doctorId: string, date: string) {
  return useQuery({
    queryKey: ['slots', doctorId, date],
    queryFn: () => appointmentsApi.getSlots(doctorId, date).then((r) => r.data),
    enabled: !!doctorId && !!date,
    staleTime: 1000 * 30,
  });
}

export function useMyAppointments(status?: string) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ['appointments', 'patient', status],
    queryFn: () => appointmentsApi.getPatient(status).then((r) => r.data),
    enabled: isAuthenticated,
  });
}

export function useBookAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => appointmentsApi.book(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}

export function useCancelAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      appointmentsApi.cancel(id, reason).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}

// ── Review hooks ──────────────────────────────────────────────────────────────
export function useDoctorReviews(doctorId: string, page = 1) {
  return useQuery({
    queryKey: ['reviews', doctorId, page],
    queryFn: () => reviewsApi.getByDoctor(doctorId, page).then((r) => r.data),
    enabled: !!doctorId,
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => reviewsApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews'] }),
  });
}
