import { IPaymentProvider } from './payment.types.js';
import { RazorpayProvider } from './razorpay.provider.js';
import { CodProvider } from './cod.provider.js';
import { AppError } from '../../utils/errors.js';

export class PaymentService {
  private providers: Map<string, IPaymentProvider> = new Map();

  constructor() {
    this.registerProvider(new RazorpayProvider());
    this.registerProvider(new CodProvider());
  }

  public registerProvider(provider: IPaymentProvider): void {
    this.providers.set(provider.name.toUpperCase(), provider);
  }

  public getProvider(method: string): IPaymentProvider {
    const normalized = method.toUpperCase();
    if (normalized === 'COD') {
      const provider = this.providers.get('COD');
      if (!provider) throw new AppError('COD provider not found', 500, 'PROVIDER_NOT_FOUND');
      return provider;
    }

    if (['CARD', 'UPI', 'NETBANKING', 'RAZORPAY'].includes(normalized)) {
      const provider = this.providers.get('RAZORPAY');
      if (!provider) throw new AppError('Razorpay provider not found', 500, 'PROVIDER_NOT_FOUND');
      return provider;
    }

    throw new AppError(`Payment method "${method}" is not supported`, 400, 'UNSUPPORTED_PAYMENT_METHOD');
  }
}

export const paymentService = new PaymentService();