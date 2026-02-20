// API Service: timer
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const timerService = {
  // 启动计时器
  startTimer: async (matchId: string, timerId: string) => {
    const response = await axios.post(
      `${API_BASE_URL}/timers/matches/${matchId}/timers/${timerId}/start`
    );
    return response.data;
  },

  // 暂停计时器
  pauseTimer: async (matchId: string, timerId: string) => {
    const response = await axios.post(
      `${API_BASE_URL}/timers/matches/${matchId}/timers/${timerId}/pause`
    );
    return response.data;
  },

  // 重置计时器
  resetTimer: async (matchId: string, timerId: string) => {
    const response = await axios.post(
      `${API_BASE_URL}/timers/matches/${matchId}/timers/${timerId}/reset`
    );
    return response.data;
  },

  // 调整时间
  adjustTimer: async (matchId: string, timerId: string, seconds: number) => {
    const response = await axios.post(
      `${API_BASE_URL}/timers/matches/${matchId}/timers/${timerId}/adjust`,
      { seconds }
    );
    return response.data;
  },

  // 设置时长
  setDuration: async (matchId: string, timerId: string, duration: number) => {
    const response = await axios.put(
      `${API_BASE_URL}/timers/matches/${matchId}/timers/${timerId}/duration`,
      { duration }
    );
    return response.data;
  },

  // 获取比赛的所有计时器
  getMatchTimers: async (matchId: string) => {
    const response = await axios.get(
      `${API_BASE_URL}/timers/matches/${matchId}/timers`
    );
    return response.data;
  },

  // 获取计时器状态
  getTimerStatus: async (matchId: string, timerId: string) => {
    const response = await axios.get(
      `${API_BASE_URL}/timers/matches/${matchId}/timers/${timerId}`
    );
    return response.data;
  },
};
