/**
 * 数据分析路由
 */
import { Router } from 'express';
import {
  recordMetric,
  getMetricValue,
  createTimeSeries,
  analyzeTrend,
  analyzeMatch,
  getTeamStatistics,
  getPlayerStatistics,
  getDashboardData
} from '../controllers/analyticsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 基础指标操作
router.post('/metrics', recordMetric);
router.get('/metrics/:name', getMetricValue);
router.post('/time-series', createTimeSeries);
router.get('/trends/:metricName', analyzeTrend);

// 比赛分析
router.get('/matches/:matchId/analyze', analyzeMatch);

// 统计数据
router.get('/teams/:teamId/statistics', getTeamStatistics);
router.get('/players/:playerId/statistics', getPlayerStatistics);

// 仪表板
router.get('/dashboard', getDashboardData);

export default router;
