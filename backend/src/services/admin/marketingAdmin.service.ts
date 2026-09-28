import { Types } from 'mongoose';
import { Coupon } from '../../models/coupon.model.js';
import { Banner } from '../../models/banner.model.js';
import { AppError } from '../../utils/errors.js';
import { logAdminAction } from '../../utils/auditLogger.js';

export class MarketingAdminService {
  // --- Coupons ---
  async getCoupons(params: { page?: number; limit?: number; search?: string }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (params.search) {
      filter.code = { $regex: params.search.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), $options: 'i' };
    }

    const [coupons, total] = await Promise.all([
      Coupon.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Coupon.countDocuments(filter),
    ]);

    return {
      coupons,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async createCoupon(data: any, adminId: string, ip?: string, ua?: string) {
    const existing = await Coupon.findOne({ code: data.code.toUpperCase() });
    if (existing) {
      throw new AppError(`Coupon code "${data.code}" already exists`, 409, 'DUPLICATE_COUPON');
    }

    const coupon = await Coupon.create({
      ...data,
      code: data.code.toUpperCase(),
    });

    await logAdminAction({
      adminId,
      action: 'CREATE_COUPON',
      resource: 'Coupon',
      resourceId: coupon._id.toString(),
      newState: coupon.toObject(),
      reason: 'Created marketing discount coupon',
      ipAddress: ip,
      userAgent: ua,
    });

    return coupon;
  }

  async updateCoupon(id: string, data: any, adminId: string, ip?: string, ua?: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid coupon ID', 400, 'INVALID_ID');
    }

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      throw new AppError('Coupon not found', 404, 'NOT_FOUND');
    }

    if (data.code && data.code.toUpperCase() !== coupon.code) {
      const existing = await Coupon.findOne({
        _id: { $ne: coupon._id },
        code: data.code.toUpperCase(),
      });
      if (existing) {
        throw new AppError(`Coupon code "${data.code}" already exists`, 409, 'DUPLICATE_COUPON');
      }
      data.code = data.code.toUpperCase();
    }

    const previousState = coupon.toObject();
    Object.assign(coupon, data);
    await coupon.save();

    await logAdminAction({
      adminId,
      action: 'UPDATE_COUPON',
      resource: 'Coupon',
      resourceId: coupon._id.toString(),
      previousState,
      newState: coupon.toObject(),
      reason: 'Updated coupon properties',
      ipAddress: ip,
      userAgent: ua,
    });

    return coupon;
  }

  async deleteCoupon(id: string, adminId: string, ip?: string, ua?: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid coupon ID', 400, 'INVALID_ID');
    }

    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      throw new AppError('Coupon not found', 404, 'NOT_FOUND');
    }

    await logAdminAction({
      adminId,
      action: 'DELETE_COUPON',
      resource: 'Coupon',
      resourceId: id,
      previousState: coupon.toObject(),
      reason: 'Deleted coupon',
      ipAddress: ip,
      userAgent: ua,
    });

    return { message: 'Coupon deleted successfully' };
  }

  // --- Banners ---
  async getBanners() {
    return Banner.find().sort({ order: 1, createdAt: -1 }).lean();
  }

  async createBanner(data: any, adminId: string, ip?: string, ua?: string) {
    const banner = await Banner.create(data);

    await logAdminAction({
      adminId,
      action: 'CREATE_BANNER',
      resource: 'Banner',
      resourceId: banner._id.toString(),
      newState: banner.toObject(),
      reason: 'Created marketing banner',
      ipAddress: ip,
      userAgent: ua,
    });

    return banner;
  }

  async updateBanner(id: string, data: any, adminId: string, ip?: string, ua?: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid banner ID', 400, 'INVALID_ID');
    }

    const banner = await Banner.findById(id);
    if (!banner) {
      throw new AppError('Banner not found', 404, 'NOT_FOUND');
    }

    const previousState = banner.toObject();
    Object.assign(banner, data);
    await banner.save();

    await logAdminAction({
      adminId,
      action: 'UPDATE_BANNER',
      resource: 'Banner',
      resourceId: banner._id.toString(),
      previousState,
      newState: banner.toObject(),
      reason: 'Updated marketing banner',
      ipAddress: ip,
      userAgent: ua,
    });

    return banner;
  }

  async deleteBanner(id: string, adminId: string, ip?: string, ua?: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid banner ID', 400, 'INVALID_ID');
    }

    const banner = await Banner.findByIdAndDelete(id);
    if (!banner) {
      throw new AppError('Banner not found', 404, 'NOT_FOUND');
    }

    await logAdminAction({
      adminId,
      action: 'DELETE_BANNER',
      resource: 'Banner',
      resourceId: id,
      previousState: banner.toObject(),
      reason: 'Deleted marketing banner',
      ipAddress: ip,
      userAgent: ua,
    });

    return { message: 'Banner deleted successfully' };
  }
}

export const marketingAdminService = new MarketingAdminService();
