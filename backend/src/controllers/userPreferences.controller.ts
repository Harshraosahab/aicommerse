import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model.js';
import { AppError } from '../utils/errors.js';

export class UserPreferencesController {
  static async getPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id;
      const user = await User.findById(userId).select('notificationPreferences');
      if (!user) {
        throw new AppError('User not found', 404, 'NOT_FOUND');
      }

      res.status(200).json({
        status: 'success',
        data: {
          notificationPreferences: user.notificationPreferences || {
            email: {
              orderUpdates: true,
              paymentUpdates: true,
              shippingUpdates: true,
              supportUpdates: true,
              promotional: true,
              priceDrop: true,
              backInStock: true,
            },
            inApp: {
              orderUpdates: true,
              paymentUpdates: true,
              shippingUpdates: true,
              supportUpdates: true,
              promotional: true,
              priceDrop: true,
              backInStock: true,
            },
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updatePreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id;
      const { email, inApp } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404, 'NOT_FOUND');
      }

      if (!user.notificationPreferences) {
        user.notificationPreferences = {
          email: {},
          inApp: {},
        };
      }

      if (email) {
        user.notificationPreferences.email = {
          ...user.notificationPreferences.email,
          ...email,
        };
      }

      if (inApp) {
        user.notificationPreferences.inApp = {
          ...user.notificationPreferences.inApp,
          ...inApp,
        };
      }

      user.markModified('notificationPreferences');
      await user.save();

      res.status(200).json({
        status: 'success',
        message: 'Notification preferences updated successfully',
        data: { notificationPreferences: user.notificationPreferences },
      });
    } catch (error) {
      next(error);
    }
  }
}
