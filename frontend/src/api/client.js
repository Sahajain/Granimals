import axios from 'axios';

// Create a custom axios instance with our API's base URL
// VITE_API_URL comes from frontend/.env
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Runs BEFORE every request is sent.
// We use it to attach the JWT token to every request automatically.
//
// Without this, we'd have to manually add the header in every API call:
//   axios.get('/api/customers', { headers: { Authorization: `Bearer ${token}` } })
//
// With this interceptor, it happens automatically — just call api.get('/api/customers')
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config; // Must return config to continue with the request
  },
  (error) => Promise.reject(error)
);

// Runs AFTER every response is received.
// We use it to handle 401 (Unauthorized) errors globally.
//
// If the token expires, the backend returns 401.
// Instead of handling this in every component, we handle it here once.
api.interceptors.response.use(
  (response) => response, // Success: just pass it through
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid → clear storage and go to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
