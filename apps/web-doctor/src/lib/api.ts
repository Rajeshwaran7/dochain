import axios from 'axios';
import { sanitizeCreateClinicPayload } from '@/lib/create-clinic-payload';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

/** Matches `basePath` in `next.config.js` so hard redirects stay under `/doctor/...`. */
const APP_BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export const api = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('dochain_doctor_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete (config.headers as Record<string, unknown>)['Content-Type'];
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const orig = err.config;
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      try {
        const refresh = localStorage.getItem('dochain_doctor_refresh');
        if (!refresh) throw new Error('No refresh token');
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken: refresh });
        localStorage.setItem('dochain_doctor_token', data.accessToken);
        if (data.refreshToken) localStorage.setItem('dochain_doctor_refresh', data.refreshToken);
        orig.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(orig);
      } catch {
        const { useAuthStore } = await import('@/store/auth.store');
        useAuthStore.getState().clearAuth();
        if (typeof window !== 'undefined') {
          const p = window.location.pathname;
          const onPublicAuth =
            /\/auth\/(check-email|verify-email|login|register|forgot-password|reset-password|callback)/.test(p);
          if (!onPublicAuth) {
            window.location.href = `${APP_BASE}/auth/login`;
          }
        }
      }
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  register: (d: Record<string, unknown>) => api.post('/auth/register', d),
  login:    (d: Record<string, unknown>) => api.post('/auth/login', d),
  me:       ()       => api.get('/auth/me'),
  verifyEmail: (token: string) => api.get('/auth/verify-email', { params: { token } }),
  resendVerification: () => api.post('/auth/resend-verification'),
  resendVerificationByEmail: (email: string) =>
    api.post('/auth/resend-verification-by-email', { email }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),
};

export const doctorApi = {
  getMyProfile:   ()       => api.get('/doctors/me'),
  updateProfile:  (d: any) => api.put('/doctors/profile', d),
  createProfile:  (d: any) => api.post('/doctors/profile', d),
  createClinic: (d: Record<string, unknown>) =>
    api.post('/doctors/clinic', sanitizeCreateClinicPayload(d)),
  uploadAvatar: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/doctors/me/avatar', fd);
  },
  deleteAvatar: () => api.delete('/doctors/me/avatar'),
};

export const appointmentsApi = {
  getDoctorList: (params?: Record<string, unknown>) => api.get('/appointments/doctor', { params }),
  getDoctorPatients: (params?: Record<string, unknown>) =>
    api.get('/appointments/doctor/patients', { params }),
  getStats:      ()             => api.get('/appointments/doctor/stats'),
  getMonthly:    ()             => api.get('/appointments/doctor/monthly'),
  updateStatus:  (id: string, d: Record<string, unknown>) => api.put(`/appointments/${id}/status`, d),
};

export const availabilityApi = {
  get:          (doctorId: string) => api.get(`/availability/${doctorId}`),
  set:          (slots: any[])     => api.post('/availability', slots),
  addException: (d: any)           => api.post('/availability/exception', d),
};

export const subscriptionsApi = {
  getPlans: ()          => api.get('/subscriptions/plans'),
  getMine:  ()          => api.get('/subscriptions/me'),
  create:   (plan: string) => api.post('/subscriptions/create', { plan }),
  cancel:   (reason?: string) => api.post('/subscriptions/cancel', { reason }),
};

export const reviewsApi = {
  getByDoctor: (doctorId: string, page = 1) => api.get(`/reviews/${doctorId}`, { params: { page } }),
  reply: (reviewId: string, reply: string) => api.post(`/reviews/${reviewId}/reply`, { reply }),
  delete: (reviewId: string) => api.delete(`/reviews/${reviewId}`),
};

export const medicalRecordsApi = {
  listForPatient: (patientId: string) => api.get(`/medical-records/for-patient/${patientId}`),
  create: (data: Record<string, unknown>) => api.post('/medical-records', data),
};

export const prescriptionsApi = {
  listForPatient: (patientId: string) => api.get(`/prescriptions/for-patient/${patientId}`),
  create: (data: Record<string, unknown>) => api.post('/prescriptions', data),
  getById: (id: string) => api.get(`/prescriptions/${id}`),
  downloadPdf: (id: string) => api.get(`/prescriptions/${id}/download`, { responseType: 'blob' }),
};

export const chatApi = {
  listConversations: () => api.get('/chat/conversations'),
  open: (data: { patientId?: string; doctorId?: string; appointmentId?: string }) =>
    api.post('/chat/conversations/open', data),
  getMessages: (conversationId: string) => api.get(`/chat/conversations/${conversationId}/messages`),
  sendMessage: (conversationId: string, body: { body: string }) =>
    api.post(`/chat/conversations/${conversationId}/messages`, body),
  markRead: (conversationId: string) => api.post(`/chat/conversations/${conversationId}/read`),
};
