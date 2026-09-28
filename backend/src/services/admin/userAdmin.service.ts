import { Types } from 'mongoose';
import { User, UserRole } from '../../models/user.model.js';
import { Order } from '../../models/order.model.js';
import { AppError } from '../../utils/errors.js';
import { logAdminAction } from '../../utils/auditLogger.js';

export class UserAdminService {
  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
    sort?: string;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (params.search) {
      const sanitized = params.search.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      filter.$or = [
        { name: { $regex: sanitized, $options: 'i' } },
        { email: { $regex: sanitized, $options: 'i' } },
        { phone: { $regex: sanitized, $options: 'i' } },
      ];
    }

    if (params.role) {
      filter.role = params.role;
    }

    if (typeof params.isActive === 'boolean') {
      filter.isActive = params.isActive;
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid user ID', 400, 'INVALID_ID');
    }

    const user = await User.findById(id)
      .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires')
      .lean();

    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    // Get real order activity summary
    const orderStats = await Order.aggregate([
      { $match: { user: new Types.ObjectId(id) } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, '$totalAmount', 0],
            },
          },
          lastOrderDate: { $max: '$createdAt' },
        },
      },
    ]);

    return {
      user,
      orderSummary: {
        totalOrders: orderStats[0]?.totalOrders || 0,
        totalSpent: Math.round((orderStats[0]?.totalSpent || 0) * 100) / 100,
        lastOrderDate: orderStats[0]?.lastOrderDate || null,
      },
    };
  }

  async updateUserStatus(params: {
    userId: string;
    isActive: boolean;
    reason?: string;
    adminId: string;
    ip?: string;
    ua?: string;
  }) {
    if (!Types.ObjectId.isValid(params.userId)) {
      throw new AppError('Invalid user ID', 400, 'INVALID_ID');
    }

    if (params.userId === params.adminId) {
      throw new AppError('Admins cannot alter their own account active status', 400, 'CANNOT_MODIFY_SELF');
    }

    const user = await User.findById(params.userId);
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    const previousState = { isActive: user.isActive };
    user.isActive = params.isActive;
    await user.save();

    await logAdminAction({
      adminId: params.adminId,
      action: params.isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
      resource: 'User',
      resourceId: user._id.toString(),
      previousState,
      newState: { isActive: user.isActive },
      reason: params.reason || `User account status set to ${params.isActive}`,
      ipAddress: params.ip,
      userAgent: params.ua,
    });

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
    };
  }

  async updateUserRole(params: {
    userId: string;
    role: UserRole;
    adminId: string;
    adminRole: UserRole;
    ip?: string;
    ua?: string;
  }) {
    if (!Types.ObjectId.isValid(params.userId)) {
      throw new AppError('Invalid user ID', 400, 'INVALID_ID');
    }

    if (params.userId === params.adminId) {
      throw new AppError('Admins cannot modify their own administrative role', 400, 'CANNOT_MODIFY_SELF');
    }

    // Only SUPER_ADMIN can grant or modify administrative roles
    if (params.adminRole !== 'SUPER_ADMIN' && params.adminRole !== 'ADMIN') {
      throw new AppError('Only Super Admins can manage administrative roles', 403, 'FORBIDDEN');
    }

    const user = await User.findById(params.userId);
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    const previousRole = user.role;
    user.role = params.role;
    await user.save();

    await logAdminAction({
      adminId: params.adminId,
      action: 'UPDATE_USER_ROLE',
      resource: 'User',
      resourceId: user._id.toString(),
      previousState: { role: previousRole },
      newState: { role: user.role },
      reason: `Changed user role from ${previousRole} to ${params.role}`,
      ipAddress: params.ip,
      userAgent: params.ua,
    });

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}

export const userAdminService = new UserAdminService();
