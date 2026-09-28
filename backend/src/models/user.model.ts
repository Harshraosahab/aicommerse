import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAddress {
  _id?: mongoose.Types.ObjectId | string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export type UserRole =
  | 'USER'
  | 'ADMIN'
  | 'SUPER_ADMIN'
  | 'PRODUCT_MANAGER'
  | 'ORDER_MANAGER'
  | 'SUPPORT_MANAGER'
  | 'MARKETING_MANAGER'
  | 'MODERATOR';

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  role: UserRole;
  profileImage?: string;
  addresses: mongoose.Types.DocumentArray<IAddress & Document>;
  isActive: boolean;
  emailVerified: boolean;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  lastLoginAt?: Date;
  failedLoginAttempts: number;
  lockUntil?: Date;
  notificationPreferences?: {
    email?: {
      orderUpdates?: boolean;
      paymentUpdates?: boolean;
      shippingUpdates?: boolean;
      supportUpdates?: boolean;
      promotional?: boolean;
      priceDrop?: boolean;
      backInStock?: boolean;
    };
    inApp?: {
      orderUpdates?: boolean;
      paymentUpdates?: boolean;
      shippingUpdates?: boolean;
      supportUpdates?: boolean;
      promotional?: boolean;
      priceDrop?: boolean;
      backInStock?: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  createPasswordResetToken(): string;
  createEmailVerificationToken(): string;
}

const AddressSchema = new Schema<IAddress>(
  {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // Prevents leaking password hash in queries
    },
    role: {
      type: String,
      enum: {
        values: [
          'USER',
          'ADMIN',
          'SUPER_ADMIN',
          'PRODUCT_MANAGER',
          'ORDER_MANAGER',
          'SUPPORT_MANAGER',
          'MARKETING_MANAGER',
          'MODERATOR',
        ],
        message: '{VALUE} is not a valid user role',
      },
      default: 'USER',
    },
    profileImage: {
      type: String,
      trim: true,
    },
    addresses: [AddressSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    lastLoginAt: {
      type: Date,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    notificationPreferences: {
      email: {
        orderUpdates: { type: Boolean, default: true },
        paymentUpdates: { type: Boolean, default: true },
        shippingUpdates: { type: Boolean, default: true },
        supportUpdates: { type: Boolean, default: true },
        promotional: { type: Boolean, default: true },
        priceDrop: { type: Boolean, default: true },
        backInStock: { type: Boolean, default: true },
      },
      inApp: {
        orderUpdates: { type: Boolean, default: true },
        paymentUpdates: { type: Boolean, default: true },
        shippingUpdates: { type: Boolean, default: true },
        supportUpdates: { type: Boolean, default: true },
        promotional: { type: Boolean, default: true },
        priceDrop: { type: Boolean, default: true },
        backInStock: { type: Boolean, default: true },
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.emailVerificationToken;
        delete ret.emailVerificationExpires;
        return ret;
      },
    },
  }
);

// Pre-save hook to hash password if modified
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Create password reset token (returns plaintext, saves SHA-256 hash)
UserSchema.methods.createPasswordResetToken = function (): string {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  // Token valid for 1 hour
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  return resetToken;
};

// Create email verification token (returns plaintext, saves SHA-256 hash)
UserSchema.methods.createEmailVerificationToken = function (): string {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
  // Token valid for 24 hours
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return verificationToken;
};

// Indexes
UserSchema.index({ role: 1 });
UserSchema.index({ createdAt: -1 });

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

