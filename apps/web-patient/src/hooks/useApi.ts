import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  doctorsApi,
  appointmentsApi,
  reviewsApi,
  medicalRecordsApi,
  prescriptionsApi,
  chatApi,
} from '@/lib/api';
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
export type DoctorSlotOption = {
  time: string;
  status: 'available' | 'booked' | 'completed' | 'past';
};

export function useAvailableSlots(doctorId: string, date: string) {
  return useQuery<DoctorSlotOption[]>({
    queryKey: ['slots', doctorId, date],
    queryFn: () =>
      appointmentsApi.getSlots(doctorId, date).then((r) => r.data as DoctorSlotOption[]),
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
    mutationFn: (data: Record<string, unknown>) => appointmentsApi.book(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['slots'] });
    },
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

export function useMyMedicalRecords() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ['medical-records', 'me'],
    queryFn: () => medicalRecordsApi.getMine().then((r) => r.data),
    enabled: isAuthenticated,
  });
}

export function useMyPrescriptions() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ['prescriptions', 'me'],
    queryFn: () => prescriptionsApi.getMine().then((r) => r.data),
    enabled: isAuthenticated,
  });
}

export function usePatientChatConversations() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ['chat-conversations'],
    queryFn: () => chatApi.listConversations().then((r) => r.data),
    enabled: isAuthenticated,
    refetchInterval: 8000,
  });
}

export function useOpenPatientConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { doctorId: string; appointmentId?: string }) =>
      chatApi.open(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chat-conversations'] }),
  });
}

export function usePatientChatMessages(conversationId: string | undefined) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ['chat-messages', conversationId],
    queryFn: () => chatApi.getMessages(conversationId!).then((r) => r.data),
    enabled: !!conversationId && isAuthenticated,
    refetchInterval: 4000,
  });
}

export function useSendPatientChatMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => chatApi.sendMessage(conversationId, { body }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chat-messages', conversationId] }),
  });
}

export function useMarkPatientChatRead(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => chatApi.markRead(conversationId).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chat-messages', conversationId] });
      qc.invalidateQueries({ queryKey: ['chat-conversations'] });
    },
  });
}
