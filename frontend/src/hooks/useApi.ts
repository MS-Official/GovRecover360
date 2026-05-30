import { useState, useCallback } from 'react';
import api from '../services/api';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

export function useApi<T = any>(
  apiCall: (...args: any[]) => Promise<{ data: T }>
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: any[]) => {
      setState({ data: null, loading: true, error: null });
      try {
        const response = await apiCall(...args);
        const data = response.data ?? response;
        setState({ data, loading: false, error: null });
        return data;
      } catch (err: any) {
        const message =
          err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message ||
          'An error occurred';
        setState({ data: null, loading: false, error: message });
        return null;
      }
    },
    [apiCall]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}

export function useFetch<T = any>(url: string) {
  return useApi<T>(useCallback(() => api.get(url), [url]));
}

export function useCreate<T = any>(url: string) {
  return useApi<T>(useCallback((data: any) => api.post(url, data), [url]));
}

export function useUpdate<T = any>(url: string) {
  return useApi<T>(useCallback((id: string, data: any) => api.put(`${url}/${id}`, data), [url]));
}

export function useRemove<T = any>(url: string) {
  return useApi<T>(useCallback((id: string) => api.delete(`${url}/${id}`), [url]));
}
