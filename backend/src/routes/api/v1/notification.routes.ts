import { Router } from 'express';
import { NotificationController } from '../../../controllers/notification.controller.js';
import { authenticate } from '../../../middleware/auth.js';
import { validate } from '../../../middleware/validate.js';
import {
  getNotificationsQuerySchema,
  notificationIdParamSchema,
} from '../../../validators/notification.validator.js';

const router = Router();

// All customer notification routes require authentication
router.use(authenticate);

router.get(
  '/',
  validate(getNotificationsQuerySchema),
  NotificationController.getMyNotifications
);

router.get(
  '/unread-count',
  NotificationController.getUnreadCount
);

router.patch(
  '/mark-all-read',
  NotificationController.markAllAsRead
);

router.delete(
  '/clear-read',
  NotificationController.clearRead
);

router.patch(
  '/:id/read',
  validate(notificationIdParamSchema),
  NotificationController.markAsRead
);

router.delete(
  '/:id',
  validate(notificationIdParamSchema),
  NotificationController.deleteNotification
);

export default router;
