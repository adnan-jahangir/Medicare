import axios from 'axios';

// Create an Axios instance
const api = axios.create({
  baseURL: 'http://localhost:5001/api', // Backend base URL
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
