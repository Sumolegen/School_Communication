import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { APP_CONFIG } from '@/constants';
import { tokenStorage } from '@/utils';

export const apiClient = axios.create({
  baseURL: APP_CONFIG.API_BASE_URL,
  timeout: 20000,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

function resolveQueue(token: string | null) {
  pendingQueue.forEach((cb) => cb(token));
  pendingQueue = [];
}

apiClient.interceptors.response.use(
  (response) => {
    const body = response.data as { success?: boolean; data?: unknown };
    if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
      response.data = body.data;
    }
    return response;
  },
  async (error: AxiosError<{ message?: string | string[] }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken || originalRequest.url?.includes('/auth/')) {
        tokenStorage.clearTokens();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push((newToken) => {
            if (!newToken) return reject(error);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(`${APP_CONFIG.API_BASE_URL}/auth/refresh`, { refreshToken });
        const payload = (res.data?.data ?? res.data) as { accessToken: string; refreshToken: string };
        tokenStorage.setTokens(payload.accessToken, payload.refreshToken);
        resolveQueue(payload.accessToken);
        originalRequest.headers.Authorization = `Bearer ${payload.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        resolveQueue(null);
        tokenStorage.clearTokens();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export function getApiErrorMessage(err: unknown, fallback = 'Something went wrong.'): string {
  if (axios.isAxiosError(err)) {
    const msg = (err.response?.data as { message?: string | string[] } | undefined)?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string' && msg.trim()) return msg;
    if (err.message) return err.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
