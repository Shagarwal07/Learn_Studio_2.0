import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    // We no longer attach the token from localStorage here.
    // The browser will automatically send the HttpOnly 'access_token' cookie because of withCredentials: true.
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh on 401
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh token logic for login/register/refresh endpoints
    if (
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register') ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/logout')
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await api.post(`/auth/refresh`, {});

        const { success } = response.data;
        if (success) {
          processQueue(null, null);
          isRefreshing = false;
          return api(originalRequest);
        }
      } catch (refreshError: any) {
        processQueue(refreshError, null);
        isRefreshing = false;
        // Only wipe tokens if the server explicitly rejects the refresh token (401 / 403).
        // If it's a network drop or offline mobile app, do NOT clear tokens or force redirect.
        const status = refreshError?.response?.status;
        if ((status === 401 || status === 403) && typeof window !== 'undefined') {
          localStorage.clear();
          // Attempt to clear HttpOnly cookies via backend before redirecting
          try {
            await axios.post(`${API_BASE_URL}/auth/logout`, {}, { withCredentials: true });
          } catch (logoutError) {
            // Ignore logout errors during forceful redirect
          }
          // DO NOT redirect if already on login page to avoid infinite loop
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login?expired=true';
          }
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
