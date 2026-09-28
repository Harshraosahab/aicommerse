import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type InteractionAction =
  | 'VIEW'
  | 'SEARCH'
  | 'CLICK'
  | 'ADD_TO_CART'
  | 'REMOVE_FROM_CART'
  | 'WISHLIST'
  | 'PURCHASE';

export interface IInteraction extends Document {
  user?: Types.ObjectId;
  sessionToken?: string;
  product?: Types.ObjectId;
  action: InteractionAction;
  metadata: Record<string, any>;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InteractionSchema = new Schema<IInteraction>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    sessionToken: {
      type: String,
      trim: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    action: {
      type: String,
      enum: {
        values: [
          'VIEW',
          'SEARCH',
          'CLICK',
          'ADD_TO_CART',
          'REMOVE_FROM_CART',
          'WISHLIST',
          'PURCHASE',
        ],
        message: '{VALUE} is not a valid interaction action',
      },
      required: [true, 'Interaction action is required'],
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
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

// Indexes designed for high-performance AI telemetry aggregations
InteractionSchema.index({ user: 1 });
InteractionSchema.index({ product: 1 });
InteractionSchema.index({ action: 1 });
InteractionSchema.index({ timestamp: -1 });
InteractionSchema.index({ user: 1, action: 1, timestamp: -1 });
InteractionSchema.index({ product: 1, action: 1, timestamp: -1 });

export const Interaction: Model<IInteraction> =
  mongoose.models.Interaction || mongoose.model<IInteraction>('Interaction', InteractionSchema);
