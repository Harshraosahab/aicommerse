import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service.js';
import { updateProfileSchema, addressSchema } from '../validators/auth.validator.js';
import { AppError } from '../utils/errors.js';

export class UserController {
  /**
   * GET /api/v1/users/me
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user!._id as any).toString();
      const user = await userService.getProfile(userId);

      res.status(200).json({
        success: true,
        data: {
          user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/users/me
   */
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = updateProfileSchema.safeParse(req.body);
      if (!validation.success) {
        throw new AppError(
          validation.error.issues[0]?.message || 'Invalid profile data',
          400,
          'VALIDATION_ERROR'
        );
      }

      const userId = (req.user!._id as any).toString();
      const user = await userService.updateProfile(userId, validation.data);

      res.status(200).json({
        success: true,
        data: {
          user,
          message: 'Profile updated successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/users/me/addresses
   */
  async getAddresses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user!._id as any).toString();
      const addresses = await userService.getAddresses(userId);

      res.status(200).json({
        success: true,
        data: {
          addresses,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/users/me/addresses
   */
  async addAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = addressSchema.safeParse(req.body);
      if (!validation.success) {
        throw new AppError(
          validation.error.issues[0]?.message || 'Invalid address data',
          400,
          'VALIDATION_ERROR'
        );
      }

      const userId = (req.user!._id as any).toString();
      const addresses = await userService.addAddress(userId, validation.data as any);

      res.status(201).json({
        success: true,
        data: {
          addresses,
          message: 'Address added successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/users/me/addresses/:id
   */
  async updateAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validation = addressSchema.partial().safeParse(req.body);
      if (!validation.success) {
        throw new AppError(
          validation.error.issues[0]?.message || 'Invalid address update data',
          400,
          'VALIDATION_ERROR'
        );
      }

      const userId = (req.user!._id as any).toString();
      const addresses = await userService.updateAddress(userId, id, validation.data as any);

      res.status(200).json({
        success: true,
        data: {
          addresses,
          message: 'Address updated successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/users/me/addresses/:id
   */
  async deleteAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const userId = (req.user!._id as any).toString();
      const addresses = await userService.deleteAddress(userId, id);

      res.status(200).json({
        success: true,
        data: {
          addresses,
          message: 'Address removed successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/users/me/addresses/:id/default
   */
  async setDefaultAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const userId = (req.user!._id as any).toString();
      const addresses = await userService.setDefaultAddress(userId, id);

      res.status(200).json({
        success: true,
        data: {
          addresses,
          message: 'Default address updated successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();

