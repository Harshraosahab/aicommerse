import { Router } from 'express';
import { adminController } from '../../../controllers/admin.controller.js';
import { FAQController } from '../../../controllers/faq.controller.js';
import { NotificationController } from '../../../controllers/notification.controller.js';
import { authenticate, requireAdmin, authorizePermission } from '../../../middleware/auth.js';
import { validate } from '../../../middleware/validate.js';
import {
  createFAQSchema,
  updateFAQSchema,
  getFAQQuerySchema,
} from '../../../validators/faq.validator.js';
import { broadcastNotificationSchema } from '../../../validators/notification.validator.js';

const router = Router();

// Mandatory admin authentication & administrative role verification
router.use(authenticate, requireAdmin);

// 1. Dashboard & Analytics
router.get(
  '/dashboard/metrics',
  authorizePermission('VIEW_ANALYTICS'),
  (req, res, next) => adminController.getMetrics(req, res, next)
);
router.get(
  '/dashboard/sales-analytics',
  authorizePermission('VIEW_ANALYTICS'),
  (req, res, next) => adminController.getSalesAnalytics(req, res, next)
);
router.get(
  '/dashboard/top-products',
  authorizePermission('VIEW_ANALYTICS'),
  (req, res, next) => adminController.getTopProducts(req, res, next)
);
router.get(
  '/dashboard/category-performance',
  authorizePermission('VIEW_ANALYTICS'),
  (req, res, next) => adminController.getCategoryPerformance(req, res, next)
);
router.get(
  '/dashboard/abandoned-carts',
  authorizePermission('VIEW_ANALYTICS'),
  (req, res, next) => adminController.getAbandonedCarts(req, res, next)
);
router.get(
  '/dashboard/recommendations-analytics',
  authorizePermission('VIEW_ANALYTICS'),
  (req, res, next) => adminController.getRecommendationAnalytics(req, res, next)
);

// 2. Product Management
router.get(
  '/products',
  authorizePermission('MANAGE_PRODUCTS'),
  (req, res, next) => adminController.getProducts(req, res, next)
);
router.get(
  '/products/:id',
  authorizePermission('MANAGE_PRODUCTS'),
  (req, res, next) => adminController.getProductById(req, res, next)
);
router.post(
  '/products',
  authorizePermission('MANAGE_PRODUCTS'),
  (req, res, next) => adminController.createProduct(req, res, next)
);
router.patch(
  '/products/:id',
  authorizePermission('MANAGE_PRODUCTS'),
  (req, res, next) => adminController.updateProduct(req, res, next)
);
router.delete(
  '/products/:id',
  authorizePermission('MANAGE_PRODUCTS'),
  (req, res, next) => adminController.deleteProduct(req, res, next)
);

// 3. Category & Brand Management
router.get(
  '/categories',
  authorizePermission('MANAGE_CATEGORIES'),
  (req, res, next) => adminController.getCategories(req, res, next)
);
router.post(
  '/categories',
  authorizePermission('MANAGE_CATEGORIES'),
  (req, res, next) => adminController.createCategory(req, res, next)
);
router.patch(
  '/categories/:id',
  authorizePermission('MANAGE_CATEGORIES'),
  (req, res, next) => adminController.updateCategory(req, res, next)
);
router.delete(
  '/categories/:id',
  authorizePermission('MANAGE_CATEGORIES'),
  (req, res, next) => adminController.deleteCategory(req, res, next)
);

router.get(
  '/brands',
  authorizePermission('MANAGE_BRANDS'),
  (req, res, next) => adminController.getBrands(req, res, next)
);
router.post(
  '/brands',
  authorizePermission('MANAGE_BRANDS'),
  (req, res, next) => adminController.createBrand(req, res, next)
);
router.patch(
  '/brands/:id',
  authorizePermission('MANAGE_BRANDS'),
  (req, res, next) => adminController.updateBrand(req, res, next)
);
router.delete(
  '/brands/:id',
  authorizePermission('MANAGE_BRANDS'),
  (req, res, next) => adminController.deleteBrand(req, res, next)
);

// 4. Inventory Management
router.get(
  '/inventory',
  authorizePermission('MANAGE_INVENTORY'),
  (req, res, next) => adminController.getInventory(req, res, next)
);
router.post(
  '/inventory/adjust',
  authorizePermission('MANAGE_INVENTORY'),
  (req, res, next) => adminController.adjustStock(req, res, next)
);

// 5. Order Management
router.get(
  '/orders',
  authorizePermission('MANAGE_ORDERS'),
  (req, res, next) => adminController.getOrders(req, res, next)
);
router.get(
  '/orders/:id',
  authorizePermission('MANAGE_ORDERS'),
  (req, res, next) => adminController.getOrderById(req, res, next)
);
router.patch(
  '/orders/:id/status',
  authorizePermission('MANAGE_ORDERS'),
  (req, res, next) => adminController.updateOrderStatus(req, res, next)
);
router.post(
  '/orders/:id/cancel',
  authorizePermission('MANAGE_ORDERS'),
  (req, res, next) => adminController.cancelOrder(req, res, next)
);

// 6. Payments, Returns & Refunds
router.get(
  '/payments',
  authorizePermission('MANAGE_PAYMENTS'),
  (req, res, next) => adminController.getPayments(req, res, next)
);
router.get(
  '/returns',
  authorizePermission('MANAGE_RETURNS'),
  (req, res, next) => adminController.getReturns(req, res, next)
);
router.post(
  '/returns/:id/decision',
  authorizePermission('MANAGE_RETURNS'),
  (req, res, next) => adminController.decideReturn(req, res, next)
);
router.get(
  '/refunds',
  authorizePermission('MANAGE_REFUNDS'),
  (req, res, next) => adminController.getRefunds(req, res, next)
);
router.post(
  '/refunds/:id/process',
  authorizePermission('MANAGE_REFUNDS'),
  (req, res, next) => adminController.processRefund(req, res, next)
);

// 7. Users Management
router.get(
  '/users',
  authorizePermission('MANAGE_USERS'),
  (req, res, next) => adminController.getUsers(req, res, next)
);
router.get(
  '/users/:id',
  authorizePermission('MANAGE_USERS'),
  (req, res, next) => adminController.getUserById(req, res, next)
);
router.patch(
  '/users/:id/status',
  authorizePermission('MANAGE_USERS'),
  (req, res, next) => adminController.updateUserStatus(req, res, next)
);
router.patch(
  '/users/:id/role',
  authorizePermission('MANAGE_USERS'),
  (req, res, next) => adminController.updateUserRole(req, res, next)
);

// 8. Reviews Moderation
router.get(
  '/reviews',
  authorizePermission('MANAGE_REVIEWS'),
  (req, res, next) => adminController.getReviews(req, res, next)
);
router.patch(
  '/reviews/:id/moderate',
  authorizePermission('MANAGE_REVIEWS'),
  (req, res, next) => adminController.moderateReview(req, res, next)
);

// 9. Marketing: Coupons & Banners
router.get(
  '/coupons',
  authorizePermission('MANAGE_COUPONS'),
  (req, res, next) => adminController.getCoupons(req, res, next)
);
router.post(
  '/coupons',
  authorizePermission('MANAGE_COUPONS'),
  (req, res, next) => adminController.createCoupon(req, res, next)
);
router.patch(
  '/coupons/:id',
  authorizePermission('MANAGE_COUPONS'),
  (req, res, next) => adminController.updateCoupon(req, res, next)
);
router.delete(
  '/coupons/:id',
  authorizePermission('MANAGE_COUPONS'),
  (req, res, next) => adminController.deleteCoupon(req, res, next)
);

router.get(
  '/banners',
  authorizePermission('MANAGE_MARKETING'),
  (req, res, next) => adminController.getBanners(req, res, next)
);
router.post(
  '/banners',
  authorizePermission('MANAGE_MARKETING'),
  (req, res, next) => adminController.createBanner(req, res, next)
);
router.patch(
  '/banners/:id',
  authorizePermission('MANAGE_MARKETING'),
  (req, res, next) => adminController.updateBanner(req, res, next)
);
router.delete(
  '/banners/:id',
  authorizePermission('MANAGE_MARKETING'),
  (req, res, next) => adminController.deleteBanner(req, res, next)
);

// 10. Customer Support
router.get(
  '/support',
  authorizePermission('MANAGE_SUPPORT'),
  (req, res, next) => adminController.getTickets(req, res, next)
);
router.get(
  '/support/:id',
  authorizePermission('MANAGE_SUPPORT'),
  (req, res, next) => adminController.getTicketById(req, res, next)
);
router.post(
  '/support/:id/respond',
  authorizePermission('MANAGE_SUPPORT'),
  (req, res, next) => adminController.respondToTicket(req, res, next)
);
router.patch(
  '/support/:id/status',
  authorizePermission('MANAGE_SUPPORT'),
  (req, res, next) => adminController.updateTicketStatus(req, res, next)
);

// 11. Audit Logs & Settings
router.get(
  '/audit-logs',
  authorizePermission('VIEW_AUDIT_LOGS'),
  (req, res, next) => adminController.getAuditLogs(req, res, next)
);
router.get(
  '/settings',
  authorizePermission('MANAGE_SETTINGS'),
  (req, res, next) => adminController.getSettings(req, res, next)
);

// 12. FAQ Management
router.get(
  '/faqs',
  authorizePermission('MANAGE_SETTINGS'),
  validate(getFAQQuerySchema),
  FAQController.adminGetAllFAQs
);
router.post(
  '/faqs',
  authorizePermission('MANAGE_SETTINGS'),
  validate(createFAQSchema),
  FAQController.adminCreateFAQ
);
router.post(
  '/faqs/seed',
  authorizePermission('MANAGE_SETTINGS'),
  FAQController.adminSeedFAQs
);
router.patch(
  '/faqs/:id',
  authorizePermission('MANAGE_SETTINGS'),
  validate(updateFAQSchema),
  FAQController.adminUpdateFAQ
);
router.delete(
  '/faqs/:id',
  authorizePermission('MANAGE_SETTINGS'),
  FAQController.adminDeleteFAQ
);

// 13. Notification Broadcast
router.post(
  '/notifications/broadcast',
  authorizePermission('MANAGE_MARKETING'),
  validate(broadcastNotificationSchema),
  NotificationController.adminBroadcast
);

export default router;
