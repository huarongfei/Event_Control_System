/**
 * 审计日志记录器
 */
import AuditLog from '../models/AuditLog.js';
import { AuditAction, AuditSeverity, AuditLog as AuditLogType, AuditFilter, AuditStats } from '../types/audit.js';
import { v4 as uuidv4 } from 'uuid';

export class AuditLogger {
  /**
   * 记录审计日志
   */
  public static async log(data: {
    userId: string;
    username: string;
    role: string;
    action: AuditAction;
    severity?: AuditSeverity;
    resource?: string;
    resourceId?: string;
    details?: Record<string, any>;
    changes?: {
      before?: Record<string, any>;
      after?: Record<string, any>;
    };
    ip: string;
    userAgent: string;
    success?: boolean;
    errorMessage?: string;
    duration?: number;
  }): Promise<AuditLogType> {
    const auditLog = new AuditLog({
      id: uuidv4(),
      userId: data.userId,
      username: data.username,
      role: data.role,
      action: data.action,
      severity: data.severity || AuditSeverity.INFO,
      resource: data.resource,
      resourceId: data.resourceId,
      details: data.details || {},
      changes: data.changes,
      ip: data.ip,
      userAgent: data.userAgent,
      success: data.success !== undefined ? data.success : true,
      errorMessage: data.errorMessage,
      duration: data.duration
    });

    await auditLog.save();

    return auditLog.toObject();
  }

  /**
   * 记录成功操作
   */
  public static async logSuccess(
    action: AuditAction,
    userId: string,
    username: string,
    role: string,
    details: any,
    req: any
  ): Promise<AuditLogType> {
    return this.log({
      userId,
      username,
      role,
      action,
      severity: AuditSeverity.INFO,
      resource: details.resource,
      resourceId: details.resourceId,
      details: details.data || {},
      changes: details.changes,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent') || 'unknown',
      success: true
    });
  }

  /**
   * 记录失败操作
   */
  public static async logFailure(
    action: AuditAction,
    userId: string,
    username: string,
    role: string,
    errorMessage: string,
    details: any,
    req: any
  ): Promise<AuditLogType> {
    return this.log({
      userId,
      username,
      role,
      action,
      severity: AuditSeverity.ERROR,
      resource: details.resource,
      resourceId: details.resourceId,
      details: details.data || {},
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent') || 'unknown',
      success: false,
      errorMessage
    });
  }

  /**
   * 记录警告
   */
  public static async logWarning(
    action: AuditAction,
    userId: string,
    username: string,
    role: string,
    message: string,
    details: any,
    req: any
  ): Promise<AuditLogType> {
    return this.log({
      userId,
      username,
      role,
      action,
      severity: AuditSeverity.WARNING,
      resource: details.resource,
      resourceId: details.resourceId,
      details: {
        ...details.data,
        warning: message
      },
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent') || 'unknown',
      success: true
    });
  }

  /**
   * 记录关键操作
   */
  public static async logCritical(
    action: AuditAction,
    userId: string,
    username: string,
    role: string,
    details: any,
    req: any
  ): Promise<AuditLogType> {
    return this.log({
      userId,
      username,
      role,
      action,
      severity: AuditSeverity.CRITICAL,
      resource: details.resource,
      resourceId: details.resourceId,
      details: details.data || {},
      changes: details.changes,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent') || 'unknown',
      success: true
    });
  }

  /**
   * 查询审计日志
   */
  public static async query(filter: AuditFilter = {}): Promise<{
    logs: AuditLogType[];
    total: number;
  }> {
    const query: any = {};

    if (filter.userId) query.userId = filter.userId;
    if (filter.action) query.action = filter.action;
    if (filter.resource) query.resource = filter.resource;
    if (filter.resourceId) query.resourceId = filter.resourceId;
    if (filter.severity) query.severity = filter.severity;
    if (filter.success !== undefined) query.success = filter.success;

    if (filter.startDate || filter.endDate) {
      query.timestamp = {};
      if (filter.startDate) query.timestamp.$gte = filter.startDate;
      if (filter.endDate) query.timestamp.$lte = filter.endDate;
    }

    const total = await AuditLog.countDocuments(query);

    const logs = await AuditLog
      .find(query)
      .sort({ timestamp: -1 })
      .limit(filter.limit || 50)
      .skip(filter.offset || 0)
      .lean();

    return {
      logs: logs.map(log => log as unknown as AuditLogType),
      total
    };
  }

  /**
   * 获取审计统计
   */
  public static async getStats(filter?: Partial<AuditFilter>): Promise<AuditStats> {
    const query: any = {};
    if (filter?.startDate || filter?.endDate) {
      query.timestamp = {};
      if (filter?.startDate) query.timestamp.$gte = filter.startDate;
      if (filter?.endDate) query.timestamp.$lte = filter.endDate;
    }

    const totalLogs = await AuditLog.countDocuments(query);

    const logsByAction = await AuditLog.aggregate([
      { $match: query },
      { $group: { _id: '$action', count: { $sum: 1 } } }
    ]);

    const logsBySeverity = await AuditLog.aggregate([
      { $match: query },
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);

    const logsByUser = await AuditLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: { userId: '$userId', username: '$username' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const errorStats = await AuditLog.aggregate([
      { $match: { ...query, success: false } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    const recentLogs = await AuditLog
      .find(query)
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    return {
      totalLogs,
      byAction: logsByAction.reduce((acc, item) => {
        acc[item._id as AuditAction] = item.count;
        return acc;
      }, {} as Record<AuditAction, number>),
      bySeverity: logsBySeverity.reduce((acc, item) => {
        acc[item._id as AuditSeverity] = item.count;
        return acc;
      }, {} as Record<AuditSeverity, number>),
      byUser: logsByUser.map(item => ({
        userId: item._id.userId,
        username: item._id.username,
        count: item.count
      })),
      recentLogs: recentLogs.map(log => log as unknown as AuditLogType),
      errorRate: totalLogs > 0 ? (errorStats[0]?.total || 0) / totalLogs : 0,
      avgResponseTime: errorStats[0]?.avgDuration || 0
    };
  }

  /**
   * 清理旧日志
   */
  public static async cleanup(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await AuditLog.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    return result.deletedCount;
  }

  /**
   * 导出日志
   */
  public static async export(filter: AuditFilter): Promise<{
    logs: AuditLogType[];
    filename: string;
  }> {
    const { logs } = await this.query({ ...filter, limit: 10000 });

    return {
      logs,
      filename: `audit-logs-${Date.now()}.json`
    };
  }
}
