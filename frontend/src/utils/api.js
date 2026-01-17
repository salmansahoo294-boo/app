import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  adminLogin: (data) => api.post('/auth/admin/login', data),
};

// User APIs
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  getWalletBalance: () => api.get('/user/wallet/balance'),
  getTransactions: (params) => api.get('/user/transactions', { params }),
  getBettingHistory: (params) => api.get('/user/bets', { params }),
  getStats: () => api.get('/user/stats'),
};

// Payment APIs
export const paymentAPI = {
  createDeposit: (data) => api.post('/payment/deposit', data),
  getDeposits: (params) => api.get('/payment/deposits', { params }),
  createWithdrawal: (data) => api.post('/payment/withdrawal', data),
  getWithdrawals: (params) => api.get('/payment/withdrawals', { params }),
};

// Admin APIs
export const adminAPI = {
  getDashboardStats: () => api.get('/admin/stats/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  suspendUser: (userId) => api.put(`/admin/users/${userId}/suspend`),
  activateUser: (userId) => api.put(`/admin/users/${userId}/activate`),
  getPendingDeposits: () => api.get('/admin/deposits/pending'),
  approveDeposit: (depositId) => api.put(`/admin/deposits/${depositId}/approve`),
  rejectDeposit: (depositId, reason) => api.put(`/admin/deposits/${depositId}/reject`, { reason }),
  getPendingWithdrawals: () => api.get('/admin/withdrawals/pending'),
  approveWithdrawal: (withdrawalId) => api.put(`/admin/withdrawals/${withdrawalId}/approve`),
  rejectWithdrawal: (withdrawalId, reason) => api.put(`/admin/withdrawals/${withdrawalId}/reject`, { reason }),
  getGames: () => api.get('/admin/games'),
  updateGame: (gameId, data) => api.put(`/admin/games/${gameId}`, data),
  createNotification: (data) => api.post('/admin/notifications', data),
  getNotifications: (params) => api.get('/admin/notifications', { params }),
};
