import crypto from 'crypto';
import { Types } from 'mongoose';
import { SupportTicket, ISupportTicket, TicketCategory, TicketPriority } from '../models/supportTicket.model.js';
import { Order } from '../models/order.model.js';
import { Product } from '../models/product.model.js';
import { NotificationService } from './notification.service.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export interface CreateTicketInput {
  userId: string;
  subject: string;
  category: TicketCategory;
  message: string;
  priority?: TicketPriority;
  relatedOrder?: string;
  relatedProduct?: string;
}

export class SupportService {
  /**
   * Generates unique ticket number like TKT-YYYYMMDD-XXXX
   */
  private static generateTicketNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `TKT-${dateStr}-${randomHex}`;
  }

  /**
   * Customer creates a new support ticket.
   * If relatedOrder is supplied, validates that order belongs strictly to customer (IDOR protection).
   */
  static async createTicket(input: CreateTicketInput): Promise<ISupportTicket> {
    const { userId, subject, category, message, priority = 'MEDIUM', relatedOrder, relatedProduct } = input;

    let orderObjectId: Types.ObjectId | undefined;
    if (relatedOrder) {
      const order = await Order.findOne({
        $or: [
          { _id: Types.ObjectId.isValid(relatedOrder) ? relatedOrder : undefined },
          { orderNumber: relatedOrder },
        ].filter(Boolean),
        user: userId,
      });

      if (!order) {
        throw new AppError('The specified order was not found or does not belong to your account', 400, 'INVALID_ORDER');
      }
      orderObjectId = order._id as Types.ObjectId;
    }

    let productObjectId: Types.ObjectId | undefined;
    if (relatedProduct) {
      const product = await Product.findOne({
        $or: [
          { _id: Types.ObjectId.isValid(relatedProduct) ? relatedProduct : undefined },
          { slug: relatedProduct },
        ].filter(Boolean),
      });
      if (product) {
        productObjectId = product._id as Types.ObjectId;
      }
    }

    const ticketNumber = this.generateTicketNumber();

    const ticket = await SupportTicket.create({
      ticketNumber,
      user: userId,
      subject,
      category,
      message,
      priority,
      status: 'OPEN',
      relatedOrder: orderObjectId,
      relatedProduct: productObjectId,
      responses: [],
    });

    // Notify user of ticket creation
    await NotificationService.createNotification({
      userId,
      type: 'SUPPORT_TICKET_CREATED',
      title: `Support Ticket Received: #${ticketNumber}`,
      message: `Your ticket regarding "${subject}" has been received. Our team will review it shortly.`,
      actionUrl: `/support/tickets/${ticketNumber}`,
      priority: 'MEDIUM',
      channel: 'ALL',
      idempotencyKey: `TICKET_CREATE_${ticketNumber}`,
    });

    logger.info(`Support ticket created: ${ticketNumber} by user ${userId}`);
    return ticket;
  }

  /**
   * Gets tickets belonging strictly to the authenticated user.
   */
  static async getUserTickets(
    userId: string,
    query: {
      page?: number;
      limit?: number;
      status?: string;
      category?: string;
    }
  ): Promise<{
    tickets: ISupportTicket[];
    total: number;
    page: number;
    pages: number;
  }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { user: userId };
    if (query.status) {
      filter.status = query.status;
    }
    if (query.category) {
      filter.category = query.category;
    }

    const [tickets, total] = await Promise.all([
      SupportTicket.find(filter)
        .populate('relatedOrder', 'orderNumber status total')
        .populate('relatedProduct', 'name slug images')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SupportTicket.countDocuments(filter),
    ]);

    return {
      tickets: tickets as unknown as ISupportTicket[],
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Customer views a specific ticket by ticketNumber or _id with strict ownership validation.
   */
  static async getTicketById(userId: string, ticketIdentifier: string): Promise<ISupportTicket> {
    const filter: Record<string, any> = {
      user: userId,
      $or: [
        { ticketNumber: ticketIdentifier },
        { _id: Types.ObjectId.isValid(ticketIdentifier) ? ticketIdentifier : undefined },
      ].filter(Boolean),
    };

    const ticket = await SupportTicket.findOne(filter)
      .populate('user', 'name email')
      .populate('relatedOrder', 'orderNumber status total items')
      .populate('relatedProduct', 'name slug images')
      .populate('responses.sender', 'name role profileImage');

    if (!ticket) {
      throw new AppError('Support ticket not found or unauthorized', 404, 'NOT_FOUND');
    }

    return ticket;
  }

  /**
   * Customer replies to an open ticket.
   */
  static async addCustomerReply(
    userId: string,
    ticketIdentifier: string,
    message: string,
    attachments: string[] = []
  ): Promise<ISupportTicket> {
    const filter: Record<string, any> = {
      user: userId,
      $or: [
        { ticketNumber: ticketIdentifier },
        { _id: Types.ObjectId.isValid(ticketIdentifier) ? ticketIdentifier : undefined },
      ].filter(Boolean),
    };

    const ticket = await SupportTicket.findOne(filter);
    if (!ticket) {
      throw new AppError('Support ticket not found or unauthorized', 404, 'NOT_FOUND');
    }

    if (ticket.status === 'CLOSED') {
      throw new AppError('Cannot reply to a closed ticket. Please create a new ticket.', 400, 'TICKET_CLOSED');
    }

    ticket.responses.push({
      sender: new Types.ObjectId(userId),
      senderRole: 'CUSTOMER',
      message,
      attachments,
      createdAt: new Date(),
    } as any);

    // If waiting for customer or resolved, reopen back to IN_PROGRESS
    if (ticket.status === 'WAITING_FOR_CUSTOMER' || ticket.status === 'RESOLVED') {
      ticket.status = 'IN_PROGRESS';
    }

    await ticket.save();
    return ticket;
  }

  /**
   * Customer closes their ticket voluntarily.
   */
  static async closeTicket(userId: string, ticketIdentifier: string): Promise<ISupportTicket> {
    const filter: Record<string, any> = {
      user: userId,
      $or: [
        { ticketNumber: ticketIdentifier },
        { _id: Types.ObjectId.isValid(ticketIdentifier) ? ticketIdentifier : undefined },
      ].filter(Boolean),
    };

    const ticket = await SupportTicket.findOne(filter);
    if (!ticket) {
      throw new AppError('Support ticket not found or unauthorized', 404, 'NOT_FOUND');
    }

    ticket.status = 'CLOSED';
    ticket.closedAt = new Date();
    await ticket.save();

    return ticket;
  }
}
