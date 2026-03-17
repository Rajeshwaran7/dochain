import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const api = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('dochain_doctor_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
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
        if (!refresh) throw new Error();
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken: refresh });
        localStorage.setItem('dochain_doctor_token', data.accessToken);
        orig.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(orig);
      } catch {
        localStorage.removeItem('dochain_doctor_token');
        window.location.href = '/auth/login';
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
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),
};

export const doctorApi = {
  getMyProfile:   ()       => api.get('/doctors/me'),
  updateProfile:  (d: any) => api.put('/doctors/profile', d),
  createProfile:  (d: any) => api.post('/doctors/profile', d),
  createClinic:   (d: any) => api.post('/doctors/clinic', d),
};

export const appointmentsApi = {
  getDoctorList: (params?: Record<string, unknown>) => api.get('/appointments/doctor', { params }),
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
