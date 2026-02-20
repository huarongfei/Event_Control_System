// API Service: scoreEngine
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const scoreEngineService = {
  // 添加得分事件
  addScoreEvent: async (matchId: string, data: any) => {
    const response = await axios.post(
      `${API_BASE_URL}/score-engine/matches/${matchId}/score-events`,
      data
    );
    return response.data;
  },

  // 撤销得分事件
  revertScoreEvent: async (matchId: string, eventId: string) => {
    const response = await axios.delete(
      `${API_BASE_URL}/score-engine/matches/${matchId}/score-events/${eventId}`
    );
    return response.data;
  },

  // 获取得分历史
  getScoreHistory: async (matchId: string) => {
    const response = await axios.get(
      `${API_BASE_URL}/score-engine/matches/${matchId}/score-history`
    );
    return response.data;
  },

  // 获取比赛统计
  getMatchStats: async (matchId: string) => {
    const response = await axios.get(
      `${API_BASE_URL}/score-engine/matches/${matchId}/stats`
    );
    return response.data;
  },

  // 记录犯规
  recordFoul: async (matchId: string, data: any) => {
    const response = await axios.post(
      `${API_BASE_URL}/score-engine/matches/${matchId}/foul`,
      data
    );
    return response.data;
  },

  // 记录暂停
  callTimeout: async (matchId: string, data: any) => {
    const response = await axios.post(
      `${API_BASE_URL}/score-engine/matches/${matchId}/timeout`,
      data
    );
    return response.data;
  },

  // 记录黄牌
  issueYellowCard: async (matchId: string, data: any) => {
    const response = await axios.post(
      `${API_BASE_URL}/score-engine/matches/${matchId}/yellow-card`,
      data
    );
    return response.data;
  },

  // 记录红牌
  issueRedCard: async (matchId: string, data: any) => {
    const response = await axios.post(
      `${API_BASE_URL}/score-engine/matches/${matchId}/red-card`,
      data
    );
    return response.data;
  },
};
