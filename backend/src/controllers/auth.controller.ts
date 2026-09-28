import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { setAuthCookie, clearAuthCookie } from '../utils/jwt.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../validators/auth.validator.js';
import { AppError } from '../utils/errors.js';

export class AuthController {
  /**
   * POST /api/v1/auth/register
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        throw new AppError(
          validation.error.issues[0]?.message || 'Invalid registration data',
          400,
          'VALIDATION_ERROR'
        );
      }

      const { user, token } = await authService.register(validation.data);
      setAuthCookie(res, token);

      res.status(201).json({
        success: true,
        data: {
          user,
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        throw new AppError(
          validation.error.issues[0]?.message || 'Invalid login credentials',
          400,
          'VALIDATION_ERROR'
        );
      }

      const { user, token } = await authService.login(
        validation.data.email,
        validation.data.password
      );
      setAuthCookie(res, token);

      res.status(200).json({
        success: true,
        data: {
          user,
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/logout
   */
  async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      clearAuthCookie(res);
      res.status(200).json({
        success: true,
        data: {
          message: 'Successfully logged out',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/me
   */
  async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({
        success: true,
        data: {
          user: req.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/forgot-password
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = forgotPasswordSchema.safeParse(req.body);
      if (!validation.success) {
        throw new AppError(
          validation.error.issues[0]?.message || 'Valid email is required',
          400,
          'VALIDATION_ERROR'
        );
      }

      await authService.forgotPassword(validation.data.email);

      res.status(200).json({
        success: true,
        data: {
          message: 'If an account with that email exists, a password reset link has been sent.',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/reset-password/:token
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
      if (!token) {
        throw new AppError('Reset token is required in URL parameter', 400, 'TOKEN_REQUIRED');
      }

      const validation = resetPasswordSchema.safeParse(req.body);
      if (!validation.success) {
        throw new AppError(
          validation.error.issues[0]?.message || 'Invalid password format',
          400,
          'VALIDATION_ERROR'
        );
      }

      const { user, token: jwtToken } = await authService.resetPassword(
        token,
        validation.data.password
      );
      setAuthCookie(res, jwtToken);

      res.status(200).json({
        success: true,
        data: {
          user,
          token: jwtToken,
          message: 'Password reset successful',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/change-password
   */
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = changePasswordSchema.safeParse(req.body);
      if (!validation.success) {
        throw new AppError(
          validation.error.issues[0]?.message || 'Invalid password change data',
          400,
          'VALIDATION_ERROR'
        );
      }

      const userId = (req.user!._id as any).toString();
      await authService.changePassword(
        userId,
        validation.data.currentPassword,
        validation.data.newPassword
      );

      res.status(200).json({
        success: true,
        data: {
          message: 'Password changed successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/verify-email/:token
   */
  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
      if (!token) {
        throw new AppError('Verification token is required', 400, 'TOKEN_REQUIRED');
      }

      await authService.verifyEmail(token);

      res.status(200).json({
        success: true,
        data: {
          message: 'Email address successfully verified',
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();

