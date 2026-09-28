import crypto from 'crypto';
import { User, IUser } from '../models/user.model.js';
import { generateToken } from '../utils/jwt.js';
import { emailService } from './email.service.js';
import { AppError } from '../utils/errors.js';



export interface RegisterDto {
  name: string;
  email: string;
  password?: string;
  phone?: string;
}

export interface AuthResult {
  user: IUser;
  token: string;
}

class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterDto): Promise<AuthResult> {
    const existingUser = await User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      throw new AppError('An account with this email address already exists.', 409, 'EMAIL_EXISTS');
    }

    const user = new User({
      name: data.name,
      email: data.email.toLowerCase(),
      password: data.password,
      phone: data.phone,
      role: 'USER',
      isActive: true,
      emailVerified: false,
    });

    // Generate email verification token
    const verificationToken = user.createEmailVerificationToken();
    await user.save();

    // Send verification email safely
    try {
      await emailService.sendVerificationEmail(user.email, verificationToken);
    } catch {
      // Non-blocking in registration flow, log is handled in emailService
    }

    const token = generateToken(user);
    return { user, token };
  }

  /**
   * Log in user
   */
  async login(email: string, password: string): Promise<AuthResult> {
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password +failedLoginAttempts +lockUntil'
    );

    if (!user) {
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    // Check account lockout
    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      throw new AppError(
        `Account temporarily locked due to excessive failed attempts. Try again in ${remainingMinutes} minutes.`,
        429,
        'ACCOUNT_LOCKED'
      );
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      // Lock account after 5 consecutive failed attempts for 15 minutes
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await user.save({ validateBeforeSave: false });
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    // Reset failed login attempts and update lastLoginAt
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    if (!user.isActive) {
      throw new AppError('This user account has been deactivated.', 403, 'ACCOUNT_DEACTIVATED');
    }

    const token = generateToken(user);
    return { user, token };
  }

  /**
   * Request password reset token
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't leak user existence for security
      return;
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    try {
      await emailService.sendPasswordResetEmail(user.email, resetToken);
    } catch {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      throw new AppError('There was an error sending the reset email. Please try again.', 500, 'EMAIL_FAILED');
    }
  }

  /**
   * Reset password with reset token
   */
  async resetPassword(token: string, newPassword: string): Promise<AuthResult> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('+password');

    if (!user) {
      throw new AppError('Password reset token is invalid or has expired.', 400, 'INVALID_TOKEN');
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    const jwtToken = generateToken(user);
    return { user, token: jwtToken };
  }

  /**
   * Change password for logged in user
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new AppError('Current password is incorrect.', 400, 'INCORRECT_CURRENT_PASSWORD');
    }

    user.password = newPassword;
    await user.save();
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new AppError('Verification token is invalid or has expired.', 400, 'INVALID_VERIFICATION_TOKEN');
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });
  }
}

export const authService = new AuthService();
