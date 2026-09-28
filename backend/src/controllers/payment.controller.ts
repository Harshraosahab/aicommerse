import { Request, Response, NextFunction } from 'express';
import { orderService } from '../services/order.service.js';
import { paymentService } from '../services/payment/payment.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { verifyPaymentSchema } from '../validators/order.validator.js';
import { Order } from '../models/order.model.js';

export class PaymentController {
  public async verifyPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = verifyPaymentSchema.parse(req.body);
      const order = await orderService.verifyPayment(req.user!._id.toString(), input);
      sendSuccess(res, { order }, 200);
    } catch (err) {
      next(err);
    }
  }

  public async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      if (!signature) {
        sendError(res, 400, 'MISSING_SIGNATURE', 'Webhook signature header missing');
        return;
      }

      const provider = paymentService.getProvider('RAZORPAY');
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);

      const isValid = provider.verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        sendError(res, 400, 'INVALID_SIGNATURE', 'Webhook signature verification failed');
        return;
      }

      const event = req.body.event;
      const payload = req.body.payload;

      // Handle order.paid or payment.captured
      if (event === 'order.paid' || event === 'payment.captured') {
        const paymentEntity = payload.payment?.entity;
        const razorpayOrderId = paymentEntity?.order_id || payload.order?.entity?.id;
        const paymentId = paymentEntity?.id;

        if (razorpayOrderId) {
          const order = await Order.findOne({ paymentOrderId: razorpayOrderId });
          if (order && order.paymentStatus !== 'PAID') {
            await orderService.verifyPayment(order.user.toString(), {
              orderId: order._id.toString(),
              paymentId: paymentId || order.paymentOrderId || '',
              signature: signature,
            });
          }
        }
      }

      // Always return 200 to acknowledge webhook receipt
      sendSuccess(res, { received: true }, 200);
    } catch (err) {
      next(err);
    }
  }
}

export const paymentController = new PaymentController();