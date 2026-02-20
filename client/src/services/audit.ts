// API Service: audit
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const auditService = {
  // 查询审计日志
  queryLogs: async (params: {
    page?: number;
    limit?: number;
    action?: string;
    resource?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    keyword?: string;
  }) => {
    const response = await axios.get(`${API_BASE_URL}/audit/logs`, { params });
    return response.data;
  },

  // 导出审计日志
  exportLogs: async (params?: {
    action?: string;
    resource?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    keyword?: string;
  }) => {
    const response = await axios.get(`${API_BASE_URL}/audit/logs/export`, {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  // 获取统计信息
  getStats: async (params?: {
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await axios.get(`${API_BASE_URL}/audit/stats`, { params });
    return response.data;
  },

  // 清理旧日志
  cleanOldLogs: async () => {
    const response = await axios.post(`${API_BASE_URL}/audit/clean`);
    return response.data;
  },
};
