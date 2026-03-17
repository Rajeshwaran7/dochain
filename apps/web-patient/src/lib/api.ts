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

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
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
        window.location.href = '/auth/login';
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

export default api;
