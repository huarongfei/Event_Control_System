// API Service: match
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const matchService = {
  // 获取比赛列表
  listMatches: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    sport?: string;
  }) => {
    const response = await axios.get(`${API_BASE_URL}/matches`, { params });
    return response.data;
  },

  // 获取单个比赛
  getMatch: async (matchId: string) => {
    const response = await axios.get(`${API_BASE_URL}/matches/${matchId}`);
    return response.data;
  },

  // 创建比赛
  createMatch: async (data: any) => {
    const response = await axios.post(`${API_BASE_URL}/matches`, data);
    return response.data;
  },

  // 更新比赛
  updateMatch: async (matchId: string, data: any) => {
    const response = await axios.put(`${API_BASE_URL}/matches/${matchId}`, data);
    return response.data;
  },

  // 删除比赛
  deleteMatch: async (matchId: string) => {
    const response = await axios.delete(`${API_BASE_URL}/matches/${matchId}`);
    return response.data;
  },

  // 更新比赛状态
  updateStatus: async (matchId: string, status: string) => {
    const response = await axios.patch(`${API_BASE_URL}/matches/${matchId}/status`, { status });
    return response.data;
  },
};
