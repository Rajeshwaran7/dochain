import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('dochain_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401; skip for auth endpoints so login/register can show errors
const isAuthEndpoint = (url?: string) =>
  typeof url === 'string' && /\/auth\/(login|register)$/.test((url ?? '').replace(API_URL, '').split('?')[0]);

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      if (isAuthEndpoint(original?.url)) return Promise.reject(err);
      original._retry = true;
      try {
        const refresh = localStorage.getItem('dochain_refresh');
        if (!refresh) throw new Error('No refresh token');
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken: refresh });
        localStorage.setItem('dochain_token', data.accessToken);
        localStorage.setItem('dochain_refresh', data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        const { useAuthStore } = await import('@/store/auth.store');
        useAuthStore.getState().clearAuth();
        if (typeof window !== 'undefined') {
          const p = window.location.pathname;
          const onPublicAuth =
            /\/auth\/(check-email|verify-email|login|register|forgot-password|reset-password|callback)/.test(p);
          if (!onPublicAuth) {
            window.location.href = '/auth/login';
          }
        }
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: Record<string, unknown>) => api.post('/auth/register', data),
  login: (data: Record<string, unknown>) => api.post('/auth/login', data),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  me: () => api.get('/auth/me'),
  verifyEmail: (token: string) => api.get('/auth/verify-email', { params: { token } }),
  resendVerification: () => api.post('/auth/resend-verification'),
  resendVerificationByEmail: (email: string) =>
    api.post('/auth/resend-verification-by-email', { email }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),
};

// ── Doctors ───────────────────────────────────────────────────────────────────
export const doctorsApi = {
  search: (params: Record<string, any>) => api.get('/doctors', { params }),
  getById: (id: string) => api.get(`/doctors/${id}`),
  getSpecializations: () => api.get('/doctors/specializations'),
  getCities: () => api.get('/doctors/cities'),
};

// ── Appointments ──────────────────────────────────────────────────────────────
export const appointmentsApi = {
  book: (data: Record<string, unknown>) => api.post('/appointments', data),
  getPatient: (status?: string) => api.get('/appointments/patient', { params: { status } }),
  getSlots: (doctorId: string, date: string) =>
    api.get(`/appointments/slots/${doctorId}`, { params: { date } }),
  cancel: (id: string, reason: string) =>
    api.put(`/appointments/${id}/status`, { status: 'cancelled', cancellationReason: reason }),
  verifyPayment: (id: string, data: Record<string, string>) =>
    api.post(`/appointments/${id}/verify-payment`, data),
};

// ── Reviews ───────────────────────────────────────────────────────────────────
export const reviewsApi = {
  getByDoctor: (doctorId: string, page = 1) =>
    api.get(`/reviews/${doctorId}`, { params: { page } }),
  create: (data: any) => api.post('/reviews', data),
};

// ── Subscriptions ─────────────────────────────────────────────────────────────
export const subscriptionsApi = {
  getPlans: () => api.get('/subscriptions/plans'),
};

export const medicalRecordsApi = {
  getMine: () => api.get('/medical-records/me'),
};

export const prescriptionsApi = {
  getMine: () => api.get('/prescriptions/me'),
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

export default api;
