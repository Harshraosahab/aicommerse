import {
  IPaymentOrderInput,
  IPaymentOrderResult,
  IPaymentProvider,
  IPaymentVerificationInput,
  IRefundInput,
  IRefundResult,
} from './payment.types.js';

export class CodProvider implements IPaymentProvider {
  public readonly name = 'COD';

  public async createOrder(input: IPaymentOrderInput): Promise<IPaymentOrderResult> {
    return {
      providerOrderId: `cod_${input.receipt}`,
      amount: Math.round(input.amount * 100),
      currency: input.currency,
      notes: input.notes,
    };
  }

  public verifySignature(_input: IPaymentVerificationInput): boolean {
    // COD is paid upon physical delivery, not via digital signature
    return true;
  }

  public verifyWebhookSignature(_payload: string | Buffer, _signature: string): boolean {
    return true;
  }

  public async refund(input: IRefundInput): Promise<IRefundResult> {
    return {
      refundId: `cod_refund_${Date.now()}`,
      amount: input.amount,
      status: 'PROCESSED',
      currency: 'INR',
    };
  }
}