import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // use frontend env
  withCredentials: true, // important for Sanctum CSRF
});

// Flag to avoid fetching CSRF multiple times
let csrfFetched = false;

// Request interceptor
api.interceptors.request.use(async (config) => {
  // If method is state-changing, ensure CSRF cookie
  const method = config.method?.toLowerCase();
  if (!csrfFetched && ['post', 'put', 'patch', 'delete'].includes(method)) {
    try {
      await axios.get(`${import.meta.env.VITE_API_URL}/sanctum/csrf-cookie`, {
        withCredentials: true
      });
      csrfFetched = true;
    } catch (err) {
      console.error('Failed to get CSRF cookie:', err);
    }
  }

  // Attach Bearer token if available
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}, (error) => Promise.reject(error));

export default api;
