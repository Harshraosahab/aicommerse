import { Types } from 'mongoose';
import { AuditLog } from '../models/auditLog.model.js';
import { logger } from './logger.js';

interface AuditLogParams {
  adminId: Types.ObjectId | string;
  action: string;
  resource: string;
  resourceId?: string;
  previousState?: any;
  newState?: any;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

// Strip sensitive keys from states before persisting audit logs
function sanitizeAuditData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeAuditData);

  const sanitized: Record<string, any> = {};
  const sensitiveKeys = [
    'password',
    'passwordResetToken',
    'passwordResetExpires',
    'emailVerificationToken',
    'token',
    'secret',
    'key',
    'apiKey',
    'authorization',
  ];

  for (const [key, value] of Object.entries(data)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeAuditData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export async function logAdminAction(params: AuditLogParams): Promise<void> {
  try {
    await AuditLog.create({
      admin: new Types.ObjectId(params.adminId),
      action: params.action.toUpperCase(),
      resource: params.resource,
      resourceId: params.resourceId || null,
      previousState: sanitizeAuditData(params.previousState),
      newState: sanitizeAuditData(params.newState),
      reason: params.reason || null,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to write audit log entry', { error, action: params.action, resource: params.resource });
  }
}
