import axios from 'axios';

// Central API configuration: connects directly to FastAPI backend
export const API_BASE_URL = 'http://127.0.0.1:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for uniform error details
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      const message = error.response.data?.detail || error.response.data?.message || error.message;
      console.error(`API Error [${error.response.status}]:`, message);
    } else if (error.request) {
      console.error('API Network Error: Server unreachable at', API_BASE_URL);
    }
    return Promise.reject(error);
  }
);
