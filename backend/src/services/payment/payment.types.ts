export interface IPaymentOrderInput {
  amount: number; // in standard currency units (e.g., INR)
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface IPaymentOrderResult {
  providerOrderId: string;
  amount: number; // in subunits (e.g., paise)
  currency: string;
  keyId?: string;
  notes?: Record<string, string>;
}

export interface IPaymentVerificationInput {
  orderId: string; // Razorpay order_id
  paymentId: string; // Razorpay payment_id
  signature: string; // Razorpay signature
}

export interface IRefundInput {
  paymentId: string;
  amount: number; // in standard currency units
  reason?: string;
  notes?: Record<string, string>;
}

export interface IRefundResult {
  refundId: string;
  amount: number;
  status: string;
  currency: string;
}

export interface IPaymentProvider {
  name: string;
  createOrder(input: IPaymentOrderInput): Promise<IPaymentOrderResult>;
  verifySignature(input: IPaymentVerificationInput): boolean;
  verifyWebhookSignature(payload: string | Buffer, signature: string): boolean;
  refund(input: IRefundInput): Promise<IRefundResult>;
}