import { Request, Response, NextFunction } from 'express';
import { SupportService } from '../services/support.service.js';

export class SupportController {
  static async createTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id.toString();
      const ticket = await SupportService.createTicket({
        userId,
        ...req.body,
      });

      res.status(201).json({
        status: 'success',
        message: 'Support ticket created successfully',
        data: { ticket },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id.toString();
      const { page, limit, status, category } = req.query as any;

      const result = await SupportService.getUserTickets(userId, {
        page,
        limit,
        status,
        category,
      });

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTicketById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id.toString();
      const ticket = await SupportService.getTicketById(userId, String(req.params.ticketId));

      res.status(200).json({
        status: 'success',
        data: { ticket },
      });
    } catch (error) {
      next(error);
    }
  }

  static async addReply(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id.toString();
      const { message, attachments } = req.body;
      const ticket = await SupportService.addCustomerReply(
        userId,
        String(req.params.ticketId),
        message,
        attachments
      );

      res.status(200).json({
        status: 'success',
        message: 'Reply posted successfully',
        data: { ticket },
      });
    } catch (error) {
      next(error);
    }
  }

  static async closeTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id.toString();
      const ticket = await SupportService.closeTicket(userId, String(req.params.ticketId));

      res.status(200).json({
        status: 'success',
        message: 'Support ticket closed successfully',
        data: { ticket },
      });
    } catch (error) {
      next(error);
    }
  }
}
