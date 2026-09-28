import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type CommunicationChannel = 'EMAIL' | 'IN_APP' | 'PUSH';
export type CommunicationStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED' | 'BOUNCED';

export interface ICommunicationLog extends Document {
  user?: Types.ObjectId;
  channel: CommunicationChannel;
  recipient: string;
  type: string;
  subject: string;
  status: CommunicationStatus;
  retryCount: number;
  failureReason?: string;
  idempotencyKey?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const CommunicationLogSchema = new Schema<ICommunicationLog>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    channel: {
      type: String,
      enum: ['EMAIL', 'IN_APP', 'PUSH'],
      required: true,
      default: 'EMAIL',
    },
    recipient: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED'],
      required: true,
      default: 'SENT',
    },
    retryCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    failureReason: {
      type: String,
      default: null,
    },
    idempotencyKey: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

CommunicationLogSchema.index({ user: 1, createdAt: -1 });
CommunicationLogSchema.index({ status: 1, createdAt: -1 });
CommunicationLogSchema.index({ idempotencyKey: 1 }, { sparse: true });

export const CommunicationLog: Model<ICommunicationLog> =
  mongoose.models.CommunicationLog ||
  mongoose.model<ICommunicationLog>('CommunicationLog', CommunicationLogSchema);
