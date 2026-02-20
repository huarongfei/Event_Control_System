// API Service: analytics
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const analyticsService = {
  // 获取仪表板统计
  getDashboardStats: async () => {
    const response = await axios.get(`${API_BASE_URL}/analytics/dashboard`);
    return response.data;
  },

  // 获取比赛统计
  getMatchStats: async (matchId: string) => {
    const response = await axios.get(`${API_BASE_URL}/analytics/matches/${matchId}`);
    return response.data;
  },

  // 获取趋势数据
  getMatchTrends: async (params?: {
    startDate?: string;
    endDate?: string;
    teamId?: string;
  }) => {
    const response = await axios.get(`${API_BASE_URL}/analytics/trends`, { params });
    return response.data;
  },

  // 获取队伍统计
  getTeamStats: async (teamId: string) => {
    const response = await axios.get(`${API_BASE_URL}/analytics/teams/${teamId}`);
    return response.data;
  },

  // 获取球员统计
  getPlayerStats: async (playerId: string) => {
    const response = await axios.get(`${API_BASE_URL}/analytics/players/${playerId}`);
    return response.data;
  },

  // 获取关键指标
  getKeyMetrics: async (matchId?: string) => {
    const response = await axios.get(`${API_BASE_URL}/analytics/metrics`, {
      params: { matchId }
    });
    return response.data;
  },
};
