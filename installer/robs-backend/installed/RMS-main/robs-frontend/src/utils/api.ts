import axios from 'axios';
import socketService from '../services/socket';

// API Configuration
// Use environment variable in production, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Keep track of refresh status
let isRefreshing = false;
let refreshQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  refreshQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  refreshQueue = [];
};

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Error - Token Expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry if it's a login or refresh request
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          // If no refresh token, just reject without a hard throw to avoid console noise before login
          return Promise.reject(error);
        }

        // Call refresh endpoint
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });

        if (response.data.success) {
          const { token, refreshToken: newRefreshToken, user } = response.data.data;

          // Update storage
          localStorage.setItem('authToken', token);
          localStorage.setItem('refreshToken', newRefreshToken);
          localStorage.setItem('user', JSON.stringify(user));

          // Update headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          // Update socket connection with new token
          socketService.connect(token);

          processQueue(null, token);

          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError: any) {
        processQueue(refreshError, null);

        // ONLY redirect if it's a definitive 401 or 400 (expired/invalid) refresh token
        // If it's a 429 or 500, we don't want to log the user out!
        if (refreshError.response?.status === 401 || refreshError.response?.status === 400) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
