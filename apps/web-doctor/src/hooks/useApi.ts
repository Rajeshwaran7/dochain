import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  appointmentsApi,
  doctorApi,
  availabilityApi,
  subscriptionsApi,
  reviewsApi,
  medicalRecordsApi,
  prescriptionsApi,
  chatApi,
} from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

export function useMyProfile() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({ queryKey: ['doctor-profile'], queryFn: () => doctorApi.getMyProfile().then(r => r.data), enabled: isAuthenticated });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: Record<string, unknown>) => doctorApi.updateProfile(d).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doctor-profile'] }),
  });
}

/**
 * Create or update clinic; invalidates doctor profile on success.
 */
export function useSaveClinic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: Record<string, unknown>) => doctorApi.createClinic(d).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doctor-profile'] }),
  });
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => doctorApi.uploadAvatar(file).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doctor-profile'] }),
  });
}

export function useDeleteAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => doctorApi.deleteAvatar().then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doctor-profile'] }),
  });
}

export function useDoctorAppointments(params?: any) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({ queryKey: ['doctor-appointments', params], queryFn: () => appointmentsApi.getDoctorList(params).then(r => r.data), enabled: isAuthenticated });
}

/**
 * Paginated doctor patient list from `GET /appointments/doctor/patients` (DB search, filters, sort).
 */
export function useDoctorPatientsList(params: Record<string, unknown>) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ['doctor-patients', params],
    queryFn: () => appointmentsApi.getDoctorPatients(params).then((r) => r.data),
    enabled: isAuthenticated,
    placeholderData: keepPreviousData,
  });
}

export function useDoctorStats() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({ queryKey: ['doctor-stats'], queryFn: () => appointmentsApi.getStats().then(r => r.data), enabled: isAuthenticated });
}

export function useDoctorMonthlyStats() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({ queryKey: ['doctor-monthly'], queryFn: () => appointmentsApi.getMonthly().then(r => r.data), enabled: isAuthenticated, staleTime: 1000 * 60 * 5 });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...d }: any) => appointmentsApi.updateStatus(id, d).then(r => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['doctor-appointments'] });
      void qc.invalidateQueries({ queryKey: ['doctor-patients'] });
    },
  });
}

export function useMyAvailability(doctorId?: string) {
  return useQuery({ queryKey: ['my-availability'], queryFn: () => availabilityApi.get(doctorId!).then(r => r.data), enabled: !!doctorId });
}

export function useSetAvailability() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (slots: any[]) => availabilityApi.set(slots).then(r => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ['my-availability'] }) });
}

export function useSubscriptionPlans() {
  return useQuery({ queryKey: ['sub-plans'], queryFn: () => subscriptionsApi.getPlans().then(r => r.data), staleTime: Infinity });
}

export function useMySubscription() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({ queryKey: ['my-subscription'], queryFn: () => subscriptionsApi.getMine().then(r => r.data), enabled: isAuthenticated });
}

export function useCreateSubscription() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (plan: string) => subscriptionsApi.create(plan).then(r => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ['my-subscription'] }) });
}

export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (reason?: string) => subscriptionsApi.cancel(reason).then(r => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ['my-subscription'] }) });
}

export function useMyReviews(doctorId?: string) {
  return useQuery({ queryKey: ['my-reviews', doctorId], queryFn: () => reviewsApi.getByDoctor(doctorId!).then(r => r.data), enabled: !!doctorId });
}

export function useMedicalRecordsForPatient(patientId: string | undefined) {
  return useQuery({
    queryKey: ['medical-records', patientId],
    queryFn: () => medicalRecordsApi.listForPatient(patientId!).then((r) => r.data),
    enabled: !!patientId,
  });
}

export function useCreateMedicalRecord(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => medicalRecordsApi.create({ ...data, patientId }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medical-records', patientId] }),
  });
}

export function usePrescriptionsForPatient(patientId: string | undefined) {
  return useQuery({
    queryKey: ['prescriptions', patientId],
    queryFn: () => prescriptionsApi.listForPatient(patientId!).then((r) => r.data),
    enabled: !!patientId,
  });
}

export function useCreatePrescription(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => prescriptionsApi.create({ ...data, patientId }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prescriptions', patientId] }),
  });
}

export function useChatConversations() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ['chat-conversations'],
    queryFn: () => chatApi.listConversations().then((r) => r.data),
    enabled: isAuthenticated,
    refetchInterval: 8000,
  });
}

export function useOpenConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { patientId?: string; doctorId?: string; appointmentId?: string }) =>
      chatApi.open(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chat-conversations'] }),
  });
}

export function useChatMessages(conversationId: string | undefined) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ['chat-messages', conversationId],
    queryFn: () => chatApi.getMessages(conversationId!).then((r) => r.data),
    enabled: !!conversationId && isAuthenticated,
    refetchInterval: 4000,
  });
}

export function useSendChatMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => chatApi.sendMessage(conversationId, { body }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chat-messages', conversationId] }),
  });
}

export function useMarkChatRead(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => chatApi.markRead(conversationId).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chat-messages', conversationId] });
      qc.invalidateQueries({ queryKey: ['chat-conversations'] });
    },
  });
}
