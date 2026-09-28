import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service.js';

export class NotificationController {
  static async getMyNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id.toString();
      const { page, limit, isRead, type } = req.query as any;

      const result = await NotificationService.getUserNotifications(userId, {
        page,
        limit,
        isRead,
        type,
      });

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id.toString();
      const count = await NotificationService.getUnreadCount(userId);

      res.status(200).json({
        status: 'success',
        data: { unreadCount: count },
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id.toString();
      const notification = await NotificationService.markAsRead(userId, String(req.params.id));

      res.status(200).json({
        status: 'success',
        data: { notification },
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id.toString();
      const result = await NotificationService.markAllAsRead(userId);

      res.status(200).json({
        status: 'success',
        message: 'All notifications marked as read',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id.toString();
      await NotificationService.deleteNotification(userId, String(req.params.id));

      res.status(200).json({
        status: 'success',
        message: 'Notification deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async clearRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id.toString();
      const result = await NotificationService.clearReadNotifications(userId);

      res.status(200).json({
        status: 'success',
        message: 'Read notifications cleared',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async adminBroadcast(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await NotificationService.broadcastNotification(req.body);

      res.status(200).json({
        status: 'success',
        message: `Notification broadcast sent to ${result.sentCount} recipients`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
