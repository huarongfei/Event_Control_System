/**
 * 审计日志路由
 */
import { Router } from 'express';
import {
  getAuditLogs,
  getAuditStats,
  exportAuditLogs,
  cleanupAuditLogs
} from '../controllers/auditController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 查询审计日志
router.get('/logs', getAuditLogs);

// 获取审计统计
router.get('/stats', getAuditStats);

// 导出审计日志
router.get('/export', exportAuditLogs);

// 清理旧日志（仅限管理员）
router.post('/cleanup', cleanupAuditLogs);

export default router;
