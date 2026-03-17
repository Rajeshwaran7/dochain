import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

export function useDashboard() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({ queryKey: ['admin-dashboard'], queryFn: () => adminApi.getDashboard().then(r => r.data), enabled: isAuthenticated });
}

export function useDoctors(params?: Record<string, unknown>) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({ queryKey: ['admin-doctors', params], queryFn: () => adminApi.listDoctors(params).then(r => r.data), enabled: isAuthenticated });
}

export function useApproveDoctor() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => adminApi.approveDoctor(id).then(r => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-doctors'] }) });
}

export function useRejectDoctor() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, reason }: { id: string; reason?: string }) => adminApi.rejectDoctor(id, reason).then(r => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-doctors'] }) });
}

export function useSuspendDoctor() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => adminApi.suspendDoctor(id).then(r => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-doctors'] }) });
}

export function usePatients(params?: Record<string, unknown>) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({ queryKey: ['admin-patients', params], queryFn: () => adminApi.listPatients(params).then(r => r.data), enabled: isAuthenticated });
}

export function useSubscriptions(params?: Record<string, unknown>) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({ queryKey: ['admin-subscriptions', params], queryFn: () => adminApi.listSubscriptions(params).then(r => r.data), enabled: isAuthenticated });
}

export function useToggleUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.toggleUser(id).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-doctors'] });
      qc.invalidateQueries({ queryKey: ['admin-patients'] });
    },
  });
}
