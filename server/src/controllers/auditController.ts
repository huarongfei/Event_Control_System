/**
 * 审计日志控制器
 */
import { Request, Response } from 'express';
import { AuditLogger } from '../audit/AuditLogger.js';
import { AuditFilter, AuditAction, AuditSeverity } from '../types/audit.js';

/**
 * 查询审计日志
 */
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      action,
      resource,
      resourceId,
      severity,
      startDate,
      endDate,
      success,
      limit = 50,
      offset = 0
    } = req.query;

    const filter: AuditFilter = {};

    if (userId) filter.userId = userId as string;
    if (action) filter.action = action as AuditAction;
    if (resource) filter.resource = resource as string;
    if (resourceId) filter.resourceId = resourceId as string;
    if (severity) filter.severity = severity as AuditSeverity;
    if (success !== undefined) filter.success = success === 'true';
    if (limit) filter.limit = parseInt(limit as string);
    if (offset) filter.offset = parseInt(offset as string);

    if (startDate) filter.startDate = new Date(startDate as string);
    if (endDate) filter.endDate = new Date(endDate as string);

    const result = await AuditLogger.query(filter);

    return res.json({
      success: true,
      data: result.logs,
      total: result.total,
      limit: filter.limit,
      offset: filter.offset
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 获取审计统计
 */
export const getAuditStats = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const filter: Partial<AuditFilter> = {};
    if (startDate) filter.startDate = new Date(startDate as string);
    if (endDate) filter.endDate = new Date(endDate as string);

    const stats = await AuditLogger.getStats(filter);

    return res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 导出审计日志
 */
export const exportAuditLogs = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      action,
      resource,
      resourceId,
      startDate,
      endDate
    } = req.query;

    const filter: AuditFilter = {};

    if (userId) filter.userId = userId as string;
    if (action) filter.action = action as AuditAction;
    if (resource) filter.resource = resource as string;
    if (resourceId) filter.resourceId = resourceId as string;
    if (startDate) filter.startDate = new Date(startDate as string);
    if (endDate) filter.endDate = new Date(endDate as string);

    const { logs, filename } = await AuditLogger.export(filter);

    // 设置响应头
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    return res.json({
      success: true,
      data: logs,
      filename
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 清理旧日志
 */
export const cleanupAuditLogs = async (req: Request, res: Response) => {
  try {
    const { daysToKeep = 90 } = req.body;

    const deletedCount = await AuditLogger.cleanup(parseInt(daysToKeep));

    return res.json({
      success: true,
      data: {
        deletedCount,
        message: `已删除 ${deletedCount} 条日志`
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
