import axios from 'axios';

// Detect if running on desktop localhost or remote device / mobile app
const isLocalhost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
);

let defaultBaseURL = import.meta.env.VITE_API_URL || 'https://medicare-rv55.onrender.com/api';

// On mobile phones / Capacitor / production apps, localhost:5001 cannot be reached so fallback to live Render API
if (!isLocalhost && defaultBaseURL.includes('localhost')) {
  defaultBaseURL = 'https://medicare-rv55.onrender.com/api';
}

const api = axios.create({
  baseURL: defaultBaseURL,
});

// Request interceptor to add the JWT token
api.interceptors.request.use(
  (config) => {
    // We can get the token from localStorage or Zustand state directly
    // Since Zustand uses localStorage persistence, grabbing from localStorage is fine.
    try {
      const persistedState = localStorage.getItem('medicare-store');
      if (persistedState) {
        const { state } = JSON.parse(persistedState);
        if (state.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
        }
      }
    } catch (e) {
      console.error('Could not get token from local storage', e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
