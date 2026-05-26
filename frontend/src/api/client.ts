import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  headers: {
    'X-API-Key': import.meta.env.VITE_API_KEY || 'dae-secret-key-change-in-prod',
    'Content-Type': 'application/json',
  },
});

export default api;
