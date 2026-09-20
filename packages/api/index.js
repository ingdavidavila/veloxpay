import axios from 'axios';

const API_BASE_URL = 'http://10.0.2.2:5000';   // For Android Emulator
// const API_BASE_URL = 'http://localhost:5000'; // For iOS or real device (change IP if needed)

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to every request automatically
api.interceptors.request.use(async (config) => {
  // We'll get token from secure storage on mobile (or localStorage on web)
  const token = await getToken();   // defined in auth package
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;