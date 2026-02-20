import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
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

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (credentials: { username: string; password: string }) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },
  
  register: async (userData: { username: string; email: string; password: string; role?: string }) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },
  
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },
  
  getProfile: async () => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },
  
  getUsers: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await apiClient.get('/auth/users', { params });
    return response.data;
  },
  
  updateUser: async (id: string, data: any) => {
    const response = await apiClient.put(`/auth/users/${id}`, data);
    return response.data;
  },
  
  deleteUser: async (id: string) => {
    const response = await apiClient.delete(`/auth/users/${id}`);
    return response.data;
  }
};

export const matchAPI = {
  createMatch: async (matchData: any) => {
    const response = await apiClient.post('/matches', matchData);
    return response.data;
  },
  
  getMatches: async (params?: { page?: number; limit?: number; status?: string; sport?: string; search?: string }) => {
    const response = await apiClient.get('/matches', { params });
    return response.data;
  },
  
  getMatch: async (id: string) => {
    const response = await apiClient.get(`/matches/${id}`);
    return response.data;
  },
  
  updateMatch: async (id: string, matchData: any) => {
    const response = await apiClient.put(`/matches/${id}`, matchData);
    return response.data;
  },
  
  deleteMatch: async (id: string) => {
    const response = await apiClient.delete(`/matches/${id}`);
    return response.data;
  },
  
  updateMatchStatus: async (id: string, status: string) => {
    const response = await apiClient.patch(`/matches/${id}/status`, { status });
    return response.data;
  },
  
  lockMatch: async (id: string, isLocked: boolean) => {
    const response = await apiClient.patch(`/matches/${id}/lock`, { isLocked });
    return response.data;
  }
};
