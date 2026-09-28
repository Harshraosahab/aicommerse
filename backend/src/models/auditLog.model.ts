import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IAuditLog extends Document {
  admin: Types.ObjectId;
  action: string;
  resource: string;
  resourceId?: string;
  previousState?: any;
  newState?: any;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    admin: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Admin user is required for audit logs'],
    },
    action: {
      type: String,
      required: [true, 'Audit action is required'],
      trim: true,
      uppercase: true,
    },
    resource: {
      type: String,
      required: [true, 'Audit resource type is required'],
      trim: true,
    },
    resourceId: {
      type: String,
      trim: true,
      default: null,
    },
    previousState: {
      type: Schema.Types.Mixed,
      default: null,
    },
    newState: {
      type: Schema.Types.Mixed,
      default: null,
    },
    reason: {
      type: String,
      trim: true,
      default: null,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ admin: 1, timestamp: -1 });
AuditLogSchema.index({ resource: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ resource: 1, resourceId: 1 });

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
