// CertiSecure2 — API Service Layer

import axios from 'axios';
import type {
  TokenResponse,
  User,
  Institution,
  InstitutionDetail,
  Certificate,
  CertificateDetail,
  VerificationResult,
  DashboardStats,
  AuditLog,
} from '../types';

const isProd = import.meta.env.PROD;
const API_BASE = import.meta.env.VITE_API_URL || (isProd ? '/api' : 'http://localhost:8000/api');
export const STORAGE_BASE = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace('/api', '/storage') 
  : (isProd ? '/storage' : 'http://localhost:8000/storage');

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken && !error.config._retry) {
        error.config._retry = true;
        try {
          const res = await axios.post(`${API_BASE}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          const data = res.data as TokenResponse;
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('refresh_token', data.refresh_token);
          error.config.headers.Authorization = `Bearer ${data.access_token}`;
          return api(error.config);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<TokenResponse> => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },

  me: async (): Promise<User> => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  register: async (data: {
    email: string;
    password: string;
    full_name: string;
    role: string;
    institution_id?: number;
  }): Promise<User> => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  registerStudent: async (data: {
    email: string;
    password: string;
    full_name: string;
    role?: string;
  }): Promise<User> => {
    const res = await api.post('/auth/register-student', {
      ...data,
      role: data.role || 'verifier',
    });
    return res.data;
  },
};

// Institutions API
export const institutionApi = {
  list: async (status?: string): Promise<{ institutions: Institution[]; total: number }> => {
    const params: Record<string, string> = {};
    if (status) params.status_filter = status;
    const res = await api.get('/institutions/', { params });
    return res.data;
  },

  get: async (id: number): Promise<InstitutionDetail> => {
    const res = await api.get(`/institutions/${id}`);
    return res.data;
  },

  create: async (data: { name: string; code: string; domain?: string; description?: string }): Promise<Institution> => {
    const res = await api.post('/institutions/', data);
    return res.data;
  },

  verify: async (id: number): Promise<void> => {
    await api.put(`/institutions/${id}/verify`);
  },

  suspend: async (id: number): Promise<void> => {
    await api.put(`/institutions/${id}/suspend`);
  },

  update: async (id: number, data: { name?: string; description?: string; domain?: string }): Promise<Institution> => {
    const res = await api.put(`/institutions/${id}`, data);
    return res.data;
  },

  rotateKeys: async (id: number): Promise<{ new_key_id: string }> => {
    const res = await api.post(`/institutions/${id}/rotate-keys`);
    return res.data;
  },

  getPublicKey: async (id: number): Promise<{ key_id: string; public_key_pem: string; fingerprint: string }> => {
    const res = await api.get(`/institutions/${id}/public-key`);
    return res.data;
  },
};

// Certificates API
export const certificateApi = {
  list: async (params?: {
    status_filter?: string;
    search?: string;
    offset?: number;
    limit?: number;
  }): Promise<{ certificates: Certificate[]; total: number }> => {
    const res = await api.get('/certificates/', { params });
    return res.data;
  },

  get: async (uid: string): Promise<CertificateDetail> => {
    const res = await api.get(`/certificates/${uid}`);
    return res.data;
  },

  create: async (data: {
    holder_name: string;
    holder_email?: string;
    roll_number?: string;
    course: string;
    certificate_type?: string;
    description?: string;
    issue_date?: string;
    expiry_date?: string;
    grade?: string;
  }): Promise<Certificate> => {
    const res = await api.post('/certificates/', data);
    return res.data;
  },

  revoke: async (uid: string, reason: string, reason_detail?: string): Promise<void> => {
    await api.post(`/certificates/${uid}/revoke`, { reason, reason_detail });
  },

  stats: async (): Promise<DashboardStats> => {
    const res = await api.get('/certificates/stats');
    return res.data;
  },
};

// Verification API (Public)
export const verifyApi = {
  verify: async (certificateUid: string): Promise<VerificationResult> => {
    const res = await api.get(`/verify/${certificateUid}`);
    return res.data;
  },
};

// Audit Logs API
export const auditApi = {
  list: async (params?: {
    action?: string;
    resource_type?: string;
    offset?: number;
    limit?: number;
  }): Promise<{ logs: AuditLog[]; total: number }> => {
    const res = await api.get('/audit-logs/', { params });
    return res.data;
  },
};

export default api;
