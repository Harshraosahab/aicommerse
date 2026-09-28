import { Types } from 'mongoose';
import { Review } from '../../models/review.model.js';
import { SupportTicket, TicketStatus, TicketPriority } from '../../models/supportTicket.model.js';
import { Product } from '../../models/product.model.js';
import { User } from '../../models/user.model.js';
import { AppError } from '../../utils/errors.js';
import { logAdminAction } from '../../utils/auditLogger.js';
import { NotificationService } from '../notification.service.js';
import { emailService } from '../email.service.js';
import { logger } from '../../utils/logger.js';

export class SupportReviewAdminService {
  // --- Reviews Moderation ---
  async getReviews(params: {
    page?: number;
    limit?: number;
    isApproved?: boolean;
    rating?: number;
    search?: string;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (typeof params.isApproved === 'boolean') {
      filter.isApproved = params.isApproved;
    }

    if (params.rating) {
      filter.rating = params.rating;
    }

    if (params.search) {
      const sanitized = params.search.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      filter.$or = [
        { comment: { $regex: sanitized, $options: 'i' } },
        { title: { $regex: sanitized, $options: 'i' } },
      ];
    }

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('user', 'name email')
        .populate('product', 'name SKU images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async moderateReview(params: {
    reviewId: string;
    action: 'APPROVE' | 'REJECT' | 'DELETE';
    reason?: string;
    adminId: string;
    ip?: string;
    ua?: string;
  }) {
    if (!Types.ObjectId.isValid(params.reviewId)) {
      throw new AppError('Invalid review ID', 400, 'INVALID_ID');
    }

    const review = await Review.findById(params.reviewId);
    if (!review) {
      throw new AppError('Review not found', 404, 'NOT_FOUND');
    }

    const previousState = review.toObject();

    if (params.action === 'DELETE') {
      await Review.findByIdAndDelete(params.reviewId);
    } else {
      review.isApproved = params.action === 'APPROVE';
      await review.save();
    }

    // Recompute product ratings
    const approvedReviews = await Review.find({
      product: review.product,
      isApproved: true,
    }).select('rating');

    const reviewCount = approvedReviews.length;
    const avgRating = reviewCount > 0
      ? Math.round((approvedReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10) / 10
      : 0;

    await Product.findByIdAndUpdate(review.product, {
      rating: avgRating,
      reviewCount,
    });

    await logAdminAction({
      adminId: params.adminId,
      action: `REVIEW_${params.action}`,
      resource: 'Review',
      resourceId: review._id.toString(),
      previousState,
      newState: params.action === 'DELETE' ? null : review.toObject(),
      reason: params.reason || `Admin moderation: ${params.action}`,
      ipAddress: params.ip,
      userAgent: params.ua,
    });

    return {
      reviewId: review._id,
      action: params.action,
      message: `Review ${params.action.toLowerCase()}d successfully. Product rating recalculated.`,
    };
  }

  // --- Customer Support Tickets ---
  async getTickets(params: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    search?: string;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (params.status) {
      filter.status = params.status;
    }

    if (params.priority) {
      filter.priority = params.priority;
    }

    if (params.search) {
      const sanitized = params.search.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      filter.$or = [
        { ticketNumber: { $regex: sanitized, $options: 'i' } },
        { subject: { $regex: sanitized, $options: 'i' } },
      ];
    }

    const [tickets, total] = await Promise.all([
      SupportTicket.find(filter)
        .populate('user', 'name email phone')
        .populate('assignedTo', 'name email role')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SupportTicket.countDocuments(filter),
    ]);

    return {
      tickets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getTicketById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid ticket ID', 400, 'INVALID_ID');
    }

    const ticket = await SupportTicket.findById(id)
      .populate('user', 'name email phone')
      .populate('assignedTo', 'name email role')
      .populate('responses.sender', 'name role')
      .lean();

    if (!ticket) {
      throw new AppError('Support ticket not found', 404, 'NOT_FOUND');
    }

    return ticket;
  }

  async respondToTicket(params: {
    ticketId: string;
    message: string;
    status?: TicketStatus;
    adminId: string;
    adminRole?: string;
    ip?: string;
    ua?: string;
  }) {
    if (!Types.ObjectId.isValid(params.ticketId)) {
      throw new AppError('Invalid ticket ID', 400, 'INVALID_ID');
    }

    const ticket = await SupportTicket.findById(params.ticketId);
    if (!ticket) {
      throw new AppError('Support ticket not found', 404, 'NOT_FOUND');
    }

    ticket.responses.push({
      sender: new Types.ObjectId(params.adminId),
      senderRole: params.adminRole || 'ADMIN',
      message: params.message,
      createdAt: new Date(),
    });

    if (params.status) {
      ticket.status = params.status;
    } else if (ticket.status === 'OPEN') {
      ticket.status = 'IN_PROGRESS';
    }

    await ticket.save();

    await logAdminAction({
      adminId: params.adminId,
      action: 'RESPOND_SUPPORT_TICKET',
      resource: 'SupportTicket',
      resourceId: ticket._id.toString(),
      newState: { status: ticket.status, responsesCount: ticket.responses.length },
      reason: 'Support representative response',
      ipAddress: params.ip,
      userAgent: params.ua,
    });

    // Notify customer
    try {
      await NotificationService.createNotification({
        userId: ticket.user.toString(),
        type: 'SUPPORT_REPLY',
        title: `New Reply on Ticket #${ticket.ticketNumber}`,
        message: `Our support team has responded to your ticket: "${ticket.subject}"`,
        actionUrl: `/support/tickets/${ticket.ticketNumber}`,
        priority: 'HIGH',
        channel: 'ALL',
        idempotencyKey: `SUPPORT_REPLY_${ticket.ticketNumber}_${ticket.responses.length}`,
      });

      const customer = await User.findById(ticket.user).select('email name');
      if (customer?.email) {
        await emailService.sendSupportReplyEmail(
          customer.email,
          {
            ticketNumber: ticket.ticketNumber,
            subject: ticket.subject,
            replyMessage: params.message,
            repliedBy: 'Customer Support Team',
          },
          ticket.user.toString()
        );
      }
    } catch (notifErr: any) {
      logger.warn(`Failed to dispatch support reply notification/email: ${notifErr.message}`);
    }

    return ticket;
  }

  async updateTicketStatus(params: {
    ticketId: string;
    status: TicketStatus;
    priority?: TicketPriority;
    assignedTo?: string;
    adminId: string;
    ip?: string;
    ua?: string;
  }) {
    if (!Types.ObjectId.isValid(params.ticketId)) {
      throw new AppError('Invalid ticket ID', 400, 'INVALID_ID');
    }

    const ticket = await SupportTicket.findById(params.ticketId);
    if (!ticket) {
      throw new AppError('Support ticket not found', 404, 'NOT_FOUND');
    }

    const previousState = {
      status: ticket.status,
      priority: ticket.priority,
      assignedTo: ticket.assignedTo,
    };

    ticket.status = params.status;
    if (params.priority) ticket.priority = params.priority;
    if (params.assignedTo !== undefined) {
      ticket.assignedTo = params.assignedTo ? new Types.ObjectId(params.assignedTo) : undefined;
    }

    await ticket.save();

    await logAdminAction({
      adminId: params.adminId,
      action: 'UPDATE_TICKET_STATUS',
      resource: 'SupportTicket',
      resourceId: ticket._id.toString(),
      previousState,
      newState: { status: ticket.status, priority: ticket.priority, assignedTo: ticket.assignedTo },
      reason: `Updated ticket status to ${params.status}`,
      ipAddress: params.ip,
      userAgent: params.ua,
    });

    return ticket;
  }
}

export const supportReviewAdminService = new SupportReviewAdminService();
