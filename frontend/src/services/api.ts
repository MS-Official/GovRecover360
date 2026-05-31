import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const normalizedApiBaseUrl = API_BASE_URL?.replace(/\/$/, '');
const inferredApiBaseUrl = window.location.port === '3000'
  ? 'http://localhost:8000/api'
  : `${window.location.origin}/api`;
const apiBaseUrl = normalizedApiBaseUrl
  ? normalizedApiBaseUrl.endsWith('/api')
    ? normalizedApiBaseUrl
    : `${normalizedApiBaseUrl}/api`
  : inferredApiBaseUrl;

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

function friendlyApiError(error: any): Error {
  const status = error.response?.status;
  const contentType = String(error.response?.headers?.['content-type'] || '');
  if (contentType.includes('text/html')) {
    return new Error('Backend API returned HTML instead of JSON. Check VITE_API_BASE_URL.');
  }
  if (status === 401) {
    return new Error('Session expired or permission required.');
  }
  if (status === 403) {
    return new Error('You do not have permission for this action.');
  }
  if (!error.response) {
    return new Error('Backend service unavailable.');
  }
  return error;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const contentType = String(response.headers?.['content-type'] || '');
    if (contentType.includes('text/html')) {
      return Promise.reject(new Error('Backend API returned HTML instead of JSON. Check VITE_API_BASE_URL.'));
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(friendlyApiError(error));
  }
);

export default api;
