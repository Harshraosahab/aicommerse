import { apiClient } from './apiClient';

export interface CartItemDetail {
  _id: string;
  productId: string;
  name: string;
  slug: string;
  image: string;
  variantSku?: string;
  variantName?: string;
  quantity: number;
  currentPrice: number;
  priceAtAddition: number;
  priceChanged: boolean;
  lineTotal: number;
  stockAvailable: number;
  isAvailable: boolean;
  stockIssue?: string;
}

export interface CartCalculationResult {
  cartId: string;
  items: CartItemDetail[];
  itemCount: number;
  subtotal: number;
  hasUnavailableItems: boolean;
  hasPriceChanges: boolean;
}

export interface WishlistItemDetail {
  _id: string;
  productId: string;
  name: string;
  slug: string;
  image: string;
  variantSku?: string;
  variantName?: string;
  currentPrice: number;
  stockAvailable: number;
  isAvailable: boolean;
  addedAt: string;
}

export interface WishlistResult {
  wishlistId: string;
  items: WishlistItemDetail[];
  itemCount: number;
}

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

export const cartApi = {
  // Cart API endpoints
  getCart: () =>
    apiClient.get<{ success: boolean; data: CartCalculationResult }>('/cart'),

  addToCart: (productId: string, variantSku?: string, quantity: number = 1) =>
    apiClient.post<{ success: boolean; data: CartCalculationResult }>('/cart/items', {
      productId,
      variantSku,
      quantity,
    }),

  updateCartItem: (itemId: string, quantity: number) =>
    apiClient.patch<{ success: boolean; data: CartCalculationResult }>('/cart/items/' + itemId, {
      quantity,
    }),

  removeCartItem: (itemId: string) =>
    apiClient.delete<{ success: boolean; data: CartCalculationResult }>('/cart/items/' + itemId),

  clearCart: () =>
    apiClient.delete<{ success: boolean; data: CartCalculationResult }>('/cart'),

  moveCartItemToWishlist: (itemId: string) =>
    apiClient.post<{ success: boolean; data: CartCalculationResult }>('/cart/items/' + itemId + '/wishlist'),

  // Wishlist API endpoints
  getWishlist: () =>
    apiClient.get<{ success: boolean; data: WishlistResult }>('/wishlist'),

  addToWishlist: (productId: string, variantSku?: string) =>
    apiClient.post<{ success: boolean; data: WishlistResult }>('/wishlist/items', {
      productId,
      variantSku,
    }),

  removeFromWishlist: (productId: string, variantSku?: string) =>
    apiClient.delete<{ success: boolean; data: WishlistResult }>('/wishlist/items/' + productId, {
      params: variantSku ? { variantSku } : undefined,
    }),

  clearWishlist: () =>
    apiClient.delete<{ success: boolean; data: WishlistResult }>('/wishlist'),

  moveWishlistItemToCart: (productId: string, variantSku?: string) =>
    apiClient.post<{ success: boolean; data: { cart: CartCalculationResult; wishlist: WishlistResult } }>(
      '/wishlist/items/' + productId + '/cart',
      {},
      { params: variantSku ? { variantSku } : undefined }
    ),

  // Checkout API endpoints
  getCheckoutSummary: (addressId?: string) =>
    apiClient.get<{ success: boolean; data: CheckoutSummaryResult }>('/checkout/summary', {
      params: addressId ? { addressId } : undefined,
    }),
};
