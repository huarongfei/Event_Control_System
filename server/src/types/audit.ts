/**
 * 审计日志类型定义
 */

export enum AuditAction {
  // 用户操作
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  USER_REGISTER = 'user.register',
  USER_UPDATE = 'user.update',
  USER_DELETE = 'user.delete',

  // 赛事操作
  MATCH_CREATE = 'match.create',
  MATCH_UPDATE = 'match.update',
  MATCH_DELETE = 'match.delete',
  MATCH_START = 'match.start',
  MATCH_PAUSE = 'match.pause',
  MATCH_RESUME = 'match.resume',
  MATCH_END = 'match.end',
  MATCH_CANCEL = 'match.cancel',

  // 计分操作
  SCORE_ADD = 'score.add',
  SCORE_REMOVE = 'score.remove',
  SCORE_UPDATE = 'score.update',
  SCORE_UNDO = 'score.undo',

  // 计时操作
  TIMER_START = 'timer.start',
  TIMER_PAUSE = 'timer.pause',
  TIMER_RESET = 'timer.reset',
  TIMER_SET_TIME = 'timer.set_time',
  TIMER_ADD_TIME = 'timer.add_time',

  // 犯规/牌型操作
  FOUL_RECORD = 'foul.record',
  YELLOW_CARD = 'card.yellow',
  RED_CARD = 'card.red',
  TIMEOUT_CALL = 'timeout.call',

  // 系统操作
  SYSTEM_CONFIG = 'system.config',
  SYSTEM_RESTART = 'system.restart',
  SYSTEM_BACKUP = 'system.backup',

  // 广播操作
  BROADCAST_START = 'broadcast.start',
  BROADCAST_STOP = 'broadcast.stop',
  BROADCAST_SWITCH_LAYOUT = 'broadcast.switch_layout',

  // 权限操作
  ROLE_GRANT = 'role.grant',
  ROLE_REVOKE = 'role.revoke',
  PERMISSION_CHANGE = 'permission.change'
}

export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  role: string;
  action: AuditAction;
  severity: AuditSeverity;
  resource?: string;
  resourceId?: string;
  details: Record<string, any>;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  ip: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
  duration?: number;
}

export interface AuditFilter {
  userId?: string;
  action?: AuditAction;
  resource?: string;
  resourceId?: string;
  severity?: AuditSeverity;
  startDate?: Date;
  endDate?: Date;
  success?: boolean;
  limit?: number;
  offset?: number;
}

export interface AuditStats {
  totalLogs: number;
  byAction: Record<AuditAction, number>;
  bySeverity: Record<AuditSeverity, number>;
  byUser: Array<{ userId: string; username: string; count: number }>;
  recentLogs: AuditLog[];
  errorRate: number;
  avgResponseTime: number;
}
