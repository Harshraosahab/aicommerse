import { Request, Response, NextFunction } from 'express';
import { orderService } from '../services/order.service.js';
import { sendSuccess } from '../utils/response.js';
import {
  initiateOrderSchema,
  cancelOrderSchema,
  returnOrderSchema,
  orderQuerySchema,
} from '../validators/order.validator.js';

export class OrderController {
  public async initiateOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = initiateOrderSchema.parse(req.body);
      const result = await orderService.initiateOrder(req.user!._id.toString(), input);
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  public async getMyOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = orderQuerySchema.parse(req.query);
      const result = await orderService.getUserOrders(req.user!._id.toString(), query);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  }

  public async getOrderDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
      const order = await orderService.getOrderById(req.user!._id.toString(), orderId);
      sendSuccess(res, { order }, 200);
    } catch (err) {
      next(err);
    }
  }

  public async cancelOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = cancelOrderSchema.parse(req.body);
      const orderId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
      const order = await orderService.cancelOrder(
        req.user!._id.toString(),
        orderId,
        input.reason
      );
      sendSuccess(res, { order }, 200);
    } catch (err) {
      next(err);
    }
  }

  public async requestReturn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = returnOrderSchema.parse(req.body);
      const orderId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
      const order = await orderService.requestReturn(
        req.user!._id.toString(),
        orderId,
        input
      );
      sendSuccess(res, { order }, 200);
    } catch (err) {
      next(err);
    }
  }

  public async getInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
      const invoice = await orderService.getOrderInvoice(
        req.user!._id.toString(),
        orderId
      );
      sendSuccess(res, { invoice }, 200);
    } catch (err) {
      next(err);
    }
  }
}

export const orderController = new OrderController();