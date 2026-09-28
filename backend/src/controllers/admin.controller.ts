import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response.js';
import { dashboardService } from '../services/admin/dashboard.service.js';
import { productAdminService } from '../services/admin/productAdmin.service.js';
import { inventoryAdminService } from '../services/admin/inventoryAdmin.service.js';
import { orderAdminService } from '../services/admin/orderAdmin.service.js';
import { paymentRefundAdminService } from '../services/admin/paymentRefundAdmin.service.js';
import { userAdminService } from '../services/admin/userAdmin.service.js';
import { categoryBrandAdminService } from '../services/admin/categoryBrandAdmin.service.js';
import { marketingAdminService } from '../services/admin/marketingAdmin.service.js';
import { supportReviewAdminService } from '../services/admin/supportReviewAdmin.service.js';
import { systemAdminService } from '../services/admin/systemAdmin.service.js';
import {
  dashboardPeriodSchema,
  adminQuerySchema,
  createProductSchema,
  updateProductSchema,
  adjustStockSchema,
  updateOrderStatusSchema,
  adminCancelOrderSchema,
  returnDecisionSchema,
  processRefundSchema,
  updateUserStatusSchema,
  updateUserRoleSchema,
  createCategorySchema,
  updateCategorySchema,
  createBrandSchema,
  updateBrandSchema,
  createCouponSchema,
  updateCouponSchema,
  moderateReviewSchema,
  ticketResponseSchema,
  updateTicketStatusSchema,
  createBannerSchema,
  updateBannerSchema,
} from '../validators/admin.validator.js';

function getParam(param: unknown): string {
  if (Array.isArray(param)) return String(param[0]);
  return String(param);
}

function getUserAgent(req: Request): string | undefined {
  const ua = req.headers['user-agent'];
  if (Array.isArray(ua)) return ua[0];
  return ua;
}

function getQueryString(val: unknown): string | undefined {
  if (typeof val === 'string') return val;
  if (Array.isArray(val) && typeof val[0] === 'string') return val[0];
  return undefined;
}

export class AdminController {
  // --- Dashboard ---
  async getMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const { period } = dashboardPeriodSchema.parse(req.query);
      const metrics = await dashboardService.getMetrics(period);
      sendSuccess(res, metrics);
    } catch (err) {
      next(err);
    }
  }

  async getSalesAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const { period } = dashboardPeriodSchema.parse(req.query);
      const analytics = await dashboardService.getSalesAnalytics(period);
      sendSuccess(res, analytics);
    } catch (err) {
      next(err);
    }
  }

  async getTopProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const limitStr = getQueryString(req.query.limit);
      const limit = limitStr ? parseInt(limitStr, 10) : 5;
      const topProducts = await dashboardService.getTopProducts(limit);
      sendSuccess(res, topProducts);
    } catch (err) {
      next(err);
    }
  }

  async getCategoryPerformance(_req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await dashboardService.getSalesByCategory();
      sendSuccess(res, categories);
    } catch (err) {
      next(err);
    }
  }

  async getAbandonedCarts(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = adminQuerySchema.parse(req.query);
      const result = await dashboardService.getAbandonedCarts(page, limit);
      sendSuccess(res, result.carts, 200, { pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  }

  async getRecommendationAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const { period } = dashboardPeriodSchema.parse(req.query);
      const analytics = await dashboardService.getRecommendationAnalytics(period);
      sendSuccess(res, analytics, 200, { message: 'Recommendation engine analytics retrieved' });
    } catch (err) {
      next(err);
    }
  }

  // --- Products ---
  async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const query = adminQuerySchema.parse(req.query);
      const result = await productAdminService.getProducts({
        page: query.page,
        limit: query.limit,
        search: query.search,
        category: getQueryString(req.query.category),
        brand: getQueryString(req.query.brand),
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
        stockStatus: getQueryString(req.query.stockStatus) as any,
        sort: query.sort,
      });
      sendSuccess(res, result.products, 200, { pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  }

  async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productAdminService.getProductById(getParam(req.params.id));
      sendSuccess(res, product);
    } catch (err) {
      next(err);
    }
  }

  async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createProductSchema.parse(req.body);
      const product = await productAdminService.createProduct(
        data,
        req.user!._id.toString(),
        req.ip,
        getUserAgent(req)
      );
      sendSuccess(res, product, 201);
    } catch (err) {
      next(err);
    }
  }

  async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateProductSchema.parse(req.body);
      const product = await productAdminService.updateProduct(
        getParam(req.params.id),
        data,
        req.user!._id.toString(),
        req.ip,
        getUserAgent(req)
      );
      sendSuccess(res, product);
    } catch (err) {
      next(err);
    }
  }

  async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productAdminService.deleteOrDeactivateProduct(
        getParam(req.params.id),
        req.user!._id.toString(),
        req.ip,
        getUserAgent(req)
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // --- Categories & Brands ---
  async getCategories(_req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await categoryBrandAdminService.getCategories();
      sendSuccess(res, categories);
    } catch (err) {
      next(err);
    }
  }

  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createCategorySchema.parse(req.body);
      const category = await categoryBrandAdminService.createCategory(
        data,
        req.user!._id.toString(),
        req.ip,
        getUserAgent(req)
      );
      sendSuccess(res, category, 201);
    } catch (err) {
      next(err);
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateCategorySchema.parse(req.body);
      const category = await categoryBrandAdminService.updateCategory(
        getParam(req.params.id),
        data,
        req.user!._id.toString(),
        req.ip,
        getUserAgent(req)
      );
      sendSuccess(res, category);
    } catch (err) {
      next(err);
    }
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await categoryBrandAdminService.deleteCategory(
        getParam(req.params.id),
        req.user!._id.toString(),
        req.ip,
        getUserAgent(req)
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getBrands(_req: Request, res: Response, next: NextFunction) {
    try {
      const brands = await categoryBrandAdminService.getBrands();
      sendSuccess(res, brands);
    } catch (err) {
      next(err);
    }
  }

  async createBrand(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createBrandSchema.parse(req.body);
      const brand = await categoryBrandAdminService.createBrand(
        data,
        req.user!._id.toString(),
        req.ip,
        getUserAgent(req)
      );
      sendSuccess(res, brand, 201);
    } catch (err) {
      next(err);
    }
  }

  async updateBrand(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateBrandSchema.parse(req.body);
      const brand = await categoryBrandAdminService.updateBrand(
        getParam(req.params.id),
        data,
        req.user!._id.toString(),
        req.ip,
        getUserAgent(req)
      );
      sendSuccess(res, brand);
    } catch (err) {
      next(err);
    }
  }

  async deleteBrand(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await categoryBrandAdminService.deleteBrand(
        getParam(req.params.id),
        req.user!._id.toString(),
        req.ip,
        getUserAgent(req)
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // --- Inventory ---
  async getInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const query = adminQuerySchema.parse(req.query);
      const result = await inventoryAdminService.getInventory({
        page: query.page,
        limit: query.limit,
        search: query.search,
        status: getQueryString(req.query.status) as any,
      });
      sendSuccess(res, result.inventory, 200, { pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  }

  async adjustStock(req: Request, res: Response, next: NextFunction) {
    try {
      const data = adjustStockSchema.parse(req.body);
      const result = await inventoryAdminService.adjustStock({
        productId: data.productId,
        variantSku: data.variantSku,
        adjustment: data.adjustment,
        reason: data.reason,
        adminId: req.user!._id.toString(),
        ip: req.ip,
        ua: getUserAgent(req),
      });
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // --- Orders ---
  async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const query = adminQuerySchema.parse(req.query);
      const result = await orderAdminService.getOrders({
        page: query.page,
        limit: query.limit,
        status: query.status,
        paymentStatus: getQueryString(req.query.paymentStatus),
        search: query.search,
        startDate: query.startDate,
        endDate: query.endDate,
        sort: query.sort,
      });
      sendSuccess(res, result.orders, 200, { pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  }

  async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderAdminService.getOrderById(getParam(req.params.id));
      sendSuccess(res, order);
    } catch (err) {
      next(err);
    }
  }

  async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateOrderStatusSchema.parse(req.body);
      const order = await orderAdminService.updateOrderStatus({
        orderId: getParam(req.params.id),
        status: data.status,
        comment: data.comment,
        carrier: data.carrier,
        trackingNumber: data.trackingNumber,
        trackingUrl: data.trackingUrl,
        adminId: req.user!._id.toString(),
        ip: req.ip,
        ua: getUserAgent(req),
      });
      sendSuccess(res, order);
    } catch (err) {
      next(err);
    }
  }

  async cancelOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const data = adminCancelOrderSchema.parse(req.body);
      const order = await orderAdminService.adminCancelOrder({
        orderId: getParam(req.params.id),
        reason: data.reason,
        adminId: req.user!._id.toString(),
        ip: req.ip,
        ua: getUserAgent(req),
      });
      sendSuccess(res, order);
    } catch (err) {
      next(err);
    }
  }

  // --- Payments, Returns & Refunds ---
  async getPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const query = adminQuerySchema.parse(req.query);
      const result = await paymentRefundAdminService.getPayments({
        page: query.page,
        limit: query.limit,
        status: query.status,
        method: getQueryString(req.query.method),
        startDate: query.startDate,
        endDate: query.endDate,
      });
      sendSuccess(res, result.payments, 200, { pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  }

  async getReturns(req: Request, res: Response, next: NextFunction) {
    try {
      const query = adminQuerySchema.parse(req.query);
      const result = await paymentRefundAdminService.getReturns({
        page: query.page,
        limit: query.limit,
        status: query.status,
      });
      sendSuccess(res, result.returns, 200, { pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  }

  async decideReturn(req: Request, res: Response, next: NextFunction) {
    try {
      const data = returnDecisionSchema.parse(req.body);
      const order = await paymentRefundAdminService.decideReturn({
        orderId: getParam(req.params.id),
        decision: data.decision,
        reason: data.reason,
        adminId: req.user!._id.toString(),
        ip: req.ip,
        ua: getUserAgent(req),
      });
      sendSuccess(res, order);
    } catch (err) {
      next(err);
    }
  }

  async getRefunds(req: Request, res: Response, next: NextFunction) {
    try {
      const query = adminQuerySchema.parse(req.query);
      const result = await paymentRefundAdminService.getRefunds({
        page: query.page,
        limit: query.limit,
      });
      sendSuccess(res, result.refunds, 200, { pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  }

  async processRefund(req: Request, res: Response, next: NextFunction) {
    try {
      const data = processRefundSchema.parse(req.body);
      const order = await paymentRefundAdminService.processRefund({
        orderId: getParam(req.params.id),
        amount: data.amount,
        reason: data.reason,
        adminId: req.user!._id.toString(),
        ip: req.ip,
        ua: getUserAgent(req),
      });
      sendSuccess(res, order);
    } catch (err) {
      next(err);
    }
  }

  // --- Users ---
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const query = adminQuerySchema.parse(req.query);
      const result = await userAdminService.getUsers({
        page: query.page,
        limit: query.limit,
        search: query.search,
        role: getQueryString(req.query.role),
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
        sort: query.sort,
      });
      sendSuccess(res, result.users, 200, { pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userAdminService.getUserById(getParam(req.params.id));
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  }

  async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateUserStatusSchema.parse(req.body);
      const user = await userAdminService.updateUserStatus({
        userId: getParam(req.params.id),
        isActive: data.isActive,
        reason: data.reason,
        adminId: req.user!._id.toString(),
        ip: req.ip,
        ua: getUserAgent(req),
      });
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  }

  async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateUserRoleSchema.parse(req.body);
      const user = await userAdminService.updateUserRole({
        userId: getParam(req.params.id),
        role: data.role as any,
        adminId: req.user!._id.toString(),
        adminRole: req.user!.role,
        ip: req.ip,
        ua: getUserAgent(req),
      });
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  }

  // --- Marketing: Coupons & Banners ---
  async getCoupons(req: Request, res: Response, next: NextFunction) {
    try {
      const query = adminQuerySchema.parse(req.query);
      const result = await marketingAdminService.getCoupons({
        page: query.page,
        limit: query.limit,
        search: query.search,
      });
      sendSuccess(res, result.coupons, 200, { pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  }

  async createCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createCouponSchema.parse(req.body);
      const coupon = await marketingAdminService.createCoupon(
        data,
        req.user!._id.toString(),
        req.ip,
        getUserAgent(req)
      );
      sendSuccess(res, coupon, 201);
    } catch (err) {
      next(err);
    }
  }

  async updateCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateCouponSchema.parse(req.body);
      const coupon = await marketingAdminService.updateCoupon(
        getParam(req.params.id),
        data,
        req.user!._id.toString(),
        req.ip,
        getUserAgent(req)
      );
      sendSuccess(res, coupon);
    } catch (err) {
      next(err);
    }
  }

  async deleteCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await marketingAdminService.deleteCoupon(
        getParam(req.params.id),
        req.user!._id.toString(),
        req.ip,
        getUserAgent(req)
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getBanners(_req: Request, res: Response, next: NextFunction) {
    try {
      const banners = await marketingAdminService.getBanners();
      sendSuccess(res, banners);
    } catch (err) {
      next(err);
    }
  }

  async createBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createBannerSchema.parse(req.body);
      const banner = await marketingAdminService.createBanner(
        data,
        req.user!._id.toString(),
        req.ip,
        getUserAgent(req)
      );
      sendSuccess(res, banner, 201);
    } catch (err) {
      next(err);
    }
  }

  async updateBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateBannerSchema.parse(req.body);
      const banner = await marketingAdminService.updateBanner(
        getParam(req.params.id),
        data,
        req.user!._id.toString(),
        req.ip,
        getUserAgent(req)
      );
      sendSuccess(res, banner);
    } catch (err) {
      next(err);
    }
  }

  async deleteBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await marketingAdminService.deleteBanner(
        getParam(req.params.id),
        req.user!._id.toString(),
        req.ip,
        getUserAgent(req)
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // --- Reviews & Support ---
  async getReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const query = adminQuerySchema.parse(req.query);
      const ratingStr = getQueryString(req.query.rating);
      const result = await supportReviewAdminService.getReviews({
        page: query.page,
        limit: query.limit,
        isApproved: req.query.isApproved !== undefined ? req.query.isApproved === 'true' : undefined,
        rating: ratingStr ? parseInt(ratingStr, 10) : undefined,
        search: query.search,
      });
      sendSuccess(res, result.reviews, 200, { pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  }

  async moderateReview(req: Request, res: Response, next: NextFunction) {
    try {
      const data = moderateReviewSchema.parse(req.body);
      const result = await supportReviewAdminService.moderateReview({
        reviewId: getParam(req.params.id),
        action: data.action,
        reason: data.reason,
        adminId: req.user!._id.toString(),
        ip: req.ip,
        ua: getUserAgent(req),
      });
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const query = adminQuerySchema.parse(req.query);
      const result = await supportReviewAdminService.getTickets({
        page: query.page,
        limit: query.limit,
        status: query.status,
        priority: getQueryString(req.query.priority),
        search: query.search,
      });
      sendSuccess(res, result.tickets, 200, { pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  }

  async getTicketById(req: Request, res: Response, next: NextFunction) {
    try {
      const ticket = await supportReviewAdminService.getTicketById(getParam(req.params.id));
      sendSuccess(res, ticket);
    } catch (err) {
      next(err);
    }
  }

  async respondToTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const data = ticketResponseSchema.parse(req.body);
      const ticket = await supportReviewAdminService.respondToTicket({
        ticketId: getParam(req.params.id),
        message: data.message,
        status: data.status,
        adminId: req.user!._id.toString(),
        adminRole: req.user!.role,
        ip: req.ip,
        ua: getUserAgent(req),
      });
      sendSuccess(res, ticket);
    } catch (err) {
      next(err);
    }
  }

  async updateTicketStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateTicketStatusSchema.parse(req.body);
      const ticket = await supportReviewAdminService.updateTicketStatus({
        ticketId: getParam(req.params.id),
        status: data.status,
        priority: data.priority,
        assignedTo: data.assignedTo || undefined,
        adminId: req.user!._id.toString(),
        ip: req.ip,
        ua: getUserAgent(req),
      });
      sendSuccess(res, ticket);
    } catch (err) {
      next(err);
    }
  }

  // --- Audit Logs & Settings ---
  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const query = adminQuerySchema.parse(req.query);
      const result = await systemAdminService.getAuditLogs({
        page: query.page,
        limit: query.limit,
        action: getQueryString(req.query.action),
        resource: getQueryString(req.query.resource),
        adminId: getQueryString(req.query.adminId),
        startDate: query.startDate,
        endDate: query.endDate,
      });
      sendSuccess(res, result.logs, 200, { pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  }

  getSettings(_req: Request, res: Response, next: NextFunction) {
    try {
      const settings = systemAdminService.getSettings();
      sendSuccess(res, settings);
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();
