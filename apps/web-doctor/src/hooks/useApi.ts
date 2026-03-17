import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi, doctorApi, availabilityApi, subscriptionsApi, reviewsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

export function useMyProfile() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({ queryKey: ['doctor-profile'], queryFn: () => doctorApi.getMyProfile().then(r => r.data), enabled: isAuthenticated });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: any) => doctorApi.updateProfile(d).then(r => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ['doctor-profile'] }) });
}

export function useDoctorAppointments(params?: any) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({ queryKey: ['doctor-appointments', params], queryFn: () => appointmentsApi.getDoctorList(params).then(r => r.data), enabled: isAuthenticated });
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doctor-appointments'] }),
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

export function useMyReviews(doctorId?: string) {
  return useQuery({ queryKey: ['my-reviews', doctorId], queryFn: () => reviewsApi.getByDoctor(doctorId!).then(r => r.data), enabled: !!doctorId });
}
