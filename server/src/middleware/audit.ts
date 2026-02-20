/**
 * 审计中间件
 */
import { Request, Response, NextFunction } from 'express';
import { AuditLogger } from '../audit/AuditLogger.js';
import { AuditAction } from '../types/audit.js';

/**
 * 审计中间件生成器
 */
export const auditMiddleware = (
  action: AuditAction,
  options: {
    resource?: string;
    resourceId?: string;
    severity?: 'info' | 'warning' | 'error' | 'critical';
    includeRequestBody?: boolean;
    includeResponseBody?: boolean;
  } = {}
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // 获取用户信息
    const userId = (req as any).user?.id || 'anonymous';
    const username = (req as any).user?.username || 'anonymous';
    const role = (req as any).user?.role || 'guest';

    // 记录请求详情
    const originalJson = res.json.bind(res);

    res.json = function(data: any) {
      const duration = Date.now() - startTime;
      const success = res.statusCode >= 200 && res.statusCode < 300;

      // 异步记录审计日志
      setImmediate(async () => {
        try {
          const details: any = {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode
          };

          if (options.includeRequestBody) {
            details.requestBody = req.body;
          }

          if (options.includeResponseBody) {
            details.responseBody = data;
          }

          if (req.params) {
            details.params = req.params;
          }

          if (req.query) {
            details.query = req.query;
          }

          const resourceId = options.resourceId ||
            (req.params as any).id ||
            (req.params as any).matchId ||
            (req.params as any).userId;

          if (success) {
            await AuditLogger.log({
              userId,
              username,
              role,
              action,
              severity: options.severity || 'info',
              resource: options.resource,
              resourceId,
              details,
              ip: req.ip || req.connection.remoteAddress,
              userAgent: req.get('user-agent') || 'unknown',
              success,
              duration
            });
          } else {
            await AuditLogger.log({
              userId,
              username,
              role,
              action,
              severity: 'error',
              resource: options.resource,
              resourceId,
              details,
              ip: req.ip || req.connection.remoteAddress,
              userAgent: req.get('user-agent') || 'unknown',
              success: false,
              errorMessage: data?.message || 'Request failed',
              duration
            });
          }
        } catch (error) {
          console.error('Failed to log audit:', error);
        }
      });

      return originalJson(data);
    };

    next();
  };
};

/**
 * 快捷审计中间件
 */
export const auditLogin = auditMiddleware(AuditAction.USER_LOGIN, {
  resource: 'user',
  severity: 'info'
});

export const auditLogout = auditMiddleware(AuditAction.USER_LOGOUT, {
  resource: 'user',
  severity: 'info'
});

export const auditMatchCreate = auditMiddleware(AuditAction.MATCH_CREATE, {
  resource: 'match',
  severity: 'critical',
  includeRequestBody: true
});

export const auditMatchUpdate = auditMiddleware(AuditAction.MATCH_UPDATE, {
  resource: 'match',
  severity: 'warning',
  includeRequestBody: true
});

export const auditScoreAdd = auditMiddleware(AuditAction.SCORE_ADD, {
  resource: 'score',
  severity: 'info',
  includeRequestBody: true
});

export const auditUserDelete = auditMiddleware(AuditAction.USER_DELETE, {
  resource: 'user',
  severity: 'critical'
});
