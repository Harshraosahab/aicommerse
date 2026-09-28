import crypto from 'crypto';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/errors.js';
import {
  IPaymentOrderInput,
  IPaymentOrderResult,
  IPaymentProvider,
  IPaymentVerificationInput,
  IRefundInput,
  IRefundResult,
} from './payment.types.js';

export class RazorpayProvider implements IPaymentProvider {
  public readonly name = 'RAZORPAY';
  private readonly keyId = env.RAZORPAY_KEY_ID;
  private readonly keySecret = env.RAZORPAY_KEY_SECRET;
  private readonly webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;

  public isConfigured(): boolean {
    return Boolean(this.keyId && this.keySecret);
  }

  public async createOrder(input: IPaymentOrderInput): Promise<IPaymentOrderResult> {
    if (!this.isConfigured()) {
      throw new AppError(
        'Payment gateway credentials (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) not configured on backend. Please configure provider keys or use Cash on Delivery.',
        503,
        'CONFIGURATION_REQUIRED'
      );
    }

    // Amount in subunits (paise for INR, cents for USD)
    const amountInSubunits = Math.round(input.amount * 100);

    const authHeader = 'Basic ' + Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        amount: amountInSubunits,
        currency: input.currency,
        receipt: input.receipt,
        notes: input.notes,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new AppError(
        `Razorpay order creation failed: ${(errorData as any)?.error?.description || response.statusText}`,
        502,
        'PAYMENT_PROVIDER_ERROR'
      );
    }

    const data: any = await response.json();
    return {
      providerOrderId: data.id,
      amount: data.amount,
      currency: data.currency,
      keyId: this.keyId,
      notes: data.notes,
    };
  }

  public verifySignature(input: IPaymentVerificationInput): boolean {
    if (!this.keySecret) {
      throw new AppError(
        'RAZORPAY_KEY_SECRET is not configured for signature verification.',
        503,
        'CONFIGURATION_REQUIRED'
      );
    }

    try {
      const body = `${input.orderId}|${input.paymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', this.keySecret)
        .update(body)
        .digest('hex');

      const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
      const receivedBuffer = Buffer.from(input.signature, 'utf8');

      if (expectedBuffer.length !== receivedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
    } catch {
      return false;
    }
  }

  public verifyWebhookSignature(payload: string | Buffer, signature: string): boolean {
    if (!this.webhookSecret) {
      throw new AppError(
        'RAZORPAY_WEBHOOK_SECRET is not configured for webhook verification.',
        503,
        'CONFIGURATION_REQUIRED'
      );
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('hex');

      const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
      const receivedBuffer = Buffer.from(signature, 'utf8');

      if (expectedBuffer.length !== receivedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
    } catch {
      return false;
    }
  }

  public async refund(input: IRefundInput): Promise<IRefundResult> {
    if (!this.isConfigured()) {
      throw new AppError(
        'RAZORPAY credentials not configured for refund processing.',
        503,
        'CONFIGURATION_REQUIRED'
      );
    }

    const amountInSubunits = Math.round(input.amount * 100);
    const authHeader = 'Basic ' + Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');

    const response = await fetch(`https://api.razorpay.com/v1/payments/${input.paymentId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        amount: amountInSubunits,
        notes: input.notes,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new AppError(
        `Razorpay refund failed: ${(errorData as any)?.error?.description || response.statusText}`,
        502,
        'REFUND_PROVIDER_ERROR'
      );
    }

    const data: any = await response.json();
    return {
      refundId: data.id,
      amount: (data.amount || amountInSubunits) / 100,
      status: data.status,
      currency: data.currency || 'INR',
    };
  }
}