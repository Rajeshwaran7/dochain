import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const api = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('dochain_admin_token');
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
        const refresh = localStorage.getItem('dochain_admin_refresh');
        if (!refresh) throw new Error();
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken: refresh });
        localStorage.setItem('dochain_admin_token', data.accessToken);
        orig.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(orig);
      } catch {
        localStorage.removeItem('dochain_admin_token');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login: (d: Record<string, unknown>) => api.post('/auth/login', d),
  me:    () => api.get('/auth/me'),
};

export const adminApi = {
  getDashboard:       () => api.get('/admin/dashboard'),
  listDoctors:        (params?: Record<string, unknown>) => api.get('/admin/doctors', { params }),
  approveDoctor:      (id: string) => api.put(`/admin/doctors/${id}/approve`),
  rejectDoctor:       (id: string, reason?: string) => api.put(`/admin/doctors/${id}/reject`, { reason }),
  suspendDoctor:      (id: string) => api.put(`/admin/doctors/${id}/suspend`),
  listPatients:       (params?: Record<string, unknown>) => api.get('/admin/patients', { params }),
  listSubscriptions:  (params?: Record<string, unknown>) => api.get('/admin/subscriptions', { params }),
  toggleUser:         (id: string) => api.put(`/admin/users/${id}/toggle`),
};
