import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const normalizedApiBaseUrl = API_BASE_URL?.replace(/\/$/, '');
const apiBaseUrl = normalizedApiBaseUrl
  ? normalizedApiBaseUrl.endsWith('/api')
    ? normalizedApiBaseUrl
    : `${normalizedApiBaseUrl}/api`
  : '/api';

const api = axios.create({
  // OLD IMPLEMENTATION - kept for reference
  // Reason: removed local /api fallback so deployed frontend must use VITE_API_BASE_URL.
  // baseURL: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api',
  // OLD IMPLEMENTATION - kept for reference
  // Reason: undefined baseURL sends auth requests to /auth/* instead of /api/auth/* in local/Vercel builds.
  // baseURL: apiBaseUrl || undefined,
  baseURL: apiBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
