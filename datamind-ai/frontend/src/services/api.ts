import axios from 'axios';

// Central API configuration: connects to current domain origin or fallback to Render cloud
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes(':5173')
    ? window.location.origin
    : 'https://datamind-backend-gj13.onrender.com');

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for uniform error details
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const message = error.response.data?.detail || error.response.data?.message || error.message;
      console.error(`API Error [${error.response.status}]:`, message);
    } else if (error.request) {
      console.error('API Network Error: Server unreachable at', API_BASE_URL);
    }
    return Promise.reject(error);
  }
);
