import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_CUSTOMER' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketCategory =
  | 'ORDER'
  | 'PAYMENT'
  | 'DELIVERY'
  | 'RETURN'
  | 'REFUND'
  | 'PRODUCT'
  | 'ACCOUNT'
  | 'TECHNICAL'
  | 'OTHER';

export interface ITicketResponse {
  _id?: Types.ObjectId;
  sender: Types.ObjectId;
  senderRole: 'CUSTOMER' | 'ADMIN' | 'SUPPORT_MANAGER';
  message: string;
  attachments?: string[];
  createdAt: Date;
}

export interface ISupportTicket extends Document {
  ticketNumber: string;
  user: Types.ObjectId;
  subject: string;
  category: TicketCategory;
  message: string;
  status: TicketStatus;
  priority: TicketPriority;
  relatedOrder?: Types.ObjectId;
  relatedProduct?: Types.ObjectId;
  assignedTo?: Types.ObjectId;
  responses: Types.DocumentArray<ITicketResponse & Document>;
  resolvedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TicketResponseSchema = new Schema<ITicketResponse>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['CUSTOMER', 'ADMIN', 'SUPPORT_MANAGER'],
      required: true,
      default: 'CUSTOMER',
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [3000, 'Response message cannot exceed 3000 characters'],
    },
    attachments: {
      type: [String],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    ticketNumber: {
      type: String,
      required: [true, 'Ticket number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Ticket must be associated with a user'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [150, 'Subject cannot exceed 150 characters'],
    },
    category: {
      type: String,
      enum: {
        values: [
          'ORDER',
          'PAYMENT',
          'DELIVERY',
          'RETURN',
          'REFUND',
          'PRODUCT',
          'ACCOUNT',
          'TECHNICAL',
          'OTHER',
        ],
        message: '{VALUE} is not a valid ticket category',
      },
      default: 'OTHER',
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [4000, 'Message cannot exceed 4000 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'RESOLVED', 'CLOSED'],
        message: '{VALUE} is not a valid ticket status',
      },
      default: 'OPEN',
    },
    priority: {
      type: String,
      enum: {
        values: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        message: '{VALUE} is not a valid ticket priority',
      },
      default: 'MEDIUM',
    },
    relatedOrder: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    relatedProduct: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    responses: [TicketResponseSchema],
    resolvedAt: {
      type: Date,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

SupportTicketSchema.index({ user: 1, createdAt: -1 });
SupportTicketSchema.index({ status: 1, priority: 1, createdAt: -1 });
SupportTicketSchema.index({ relatedOrder: 1 });

export const SupportTicket: Model<ISupportTicket> =
  mongoose.models.SupportTicket ||
  mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);
