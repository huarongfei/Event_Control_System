/**
 * 审计日志数据模型
 */
import mongoose, { Schema, Document } from 'mongoose';
import { AuditAction, AuditSeverity } from '../types/audit.js';

export interface IAuditLog extends Document {
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

const AuditLogSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  username: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: Object.values(AuditAction),
    required: true,
    index: true
  },
  severity: {
    type: String,
    enum: Object.values(AuditSeverity),
    default: AuditSeverity.INFO,
    index: true
  },
  resource: {
    type: String,
    index: true
  },
  resourceId: {
    type: String,
    index: true
  },
  details: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {}
  },
  changes: {
    before: {
      type: Map,
      of: Schema.Types.Mixed
    },
    after: {
      type: Map,
      of: Schema.Types.Mixed
    }
  },
  ip: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  success: {
    type: Boolean,
    default: true,
    index: true
  },
  errorMessage: {
    type: String
  },
  duration: {
    type: Number
  }
}, {
  timestamps: true
});

// 复合索引
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ resource: 1, resourceId: 1, timestamp: -1 });
AuditLogSchema.index({ severity: 1, success: 1, timestamp: -1 });

// TTL索引：保留90天的日志
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
