import mongoose from 'mongoose';
import { cartService, CartItemDetail } from './cart.service.js';
import { User } from '../models/user.model.js';
import { AppError } from '../utils/errors.js';

export interface CheckoutSummaryResult {
  items: CartItemDetail[];
  itemCount: number;
  subtotal: number;
  shippingFee: number;
  tax: number;
  total: number;
  isReady: boolean;
  issues: string[];
  selectedAddress?: {
    _id: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault: boolean;
  };
}

export class CheckoutService {
  private roundMoney(amount: number): number {
    return Math.round(amount * 100) / 100;
  }

  /**
   * Compute authoritative checkout summary strictly from MongoDB data.
   */
  async getCheckoutSummary(userId: string, addressId?: string): Promise<CheckoutSummaryResult> {
    // 1. Fetch current cart with live prices and stock
    const cart = await cartService.getCart(userId);
    const issues: string[] = [];

    if (cart.items.length === 0) {
      issues.push('Your cart is empty. Add products to proceed to checkout.');
    }

    if (cart.hasUnavailableItems) {
      issues.push('One or more items in your cart are currently out of stock or unavailable.');
    }

    if (cart.hasPriceChanges) {
      issues.push('Prices for one or more items in your cart have changed since they were added.');
    }

    // 2. Validate delivery address if provided or fetch default address
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    let selectedAddress: any;

    if (addressId) {
      if (!mongoose.Types.ObjectId.isValid(addressId)) {
        throw new AppError('Invalid address ID format.', 400, 'INVALID_ADDRESS_ID');
      }
      // Guarantee ownership: address must belong to user's saved addresses
      const addr = user.addresses.id(addressId);
      if (!addr) {
        throw new AppError('Specified address was not found in your saved addresses.', 404, 'ADDRESS_NOT_FOUND');
      }
      selectedAddress = addr;
    } else {
      // Pick default address if available
      selectedAddress = user.addresses.find((a) => a.isDefault) || user.addresses[0];
    }

    if (!selectedAddress) {
      issues.push('Please select or add a delivery address to complete checkout.');
    }

    // 3. Clear transparent business rules for shipping and tax
    // Shipping rule: Free shipping on orders over , otherwise  flat rate.
    let shippingFee = 0;
    if (cart.subtotal > 0 && cart.subtotal < 100) {
      shippingFee = 10.0;
    }

    // Tax rule: 0.00 until regional tax nexus is configured in Phase 6
    const tax = 0.0;
    const total = this.roundMoney(cart.subtotal + shippingFee + tax);

    const isReady = issues.length === 0 && cart.items.length > 0 && !cart.hasUnavailableItems;

    return {
      items: cart.items,
      itemCount: cart.itemCount,
      subtotal: cart.subtotal,
      shippingFee: this.roundMoney(shippingFee),
      tax: this.roundMoney(tax),
      total,
      isReady,
      issues,
      selectedAddress: selectedAddress
        ? {
            _id: selectedAddress._id.toString(),
            street: selectedAddress.street,
            city: selectedAddress.city,
            state: selectedAddress.state,
            zipCode: selectedAddress.zipCode,
            country: selectedAddress.country,
            isDefault: selectedAddress.isDefault,
          }
        : undefined,
    };
  }
}

export const checkoutService = new CheckoutService();
