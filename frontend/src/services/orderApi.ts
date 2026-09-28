import { apiClient } from './apiClient';

export type PaymentStatus =
  | 'PENDING'
  | 'AUTHORIZED'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'REFUNDED';

export interface OrderItem {
  _id?: string;
  product: string;
  name: string;
  sku?: string;
  variantSku?: string;
  price: number;
  quantity: number;
  lineTotal: number;
  image?: string;
  returnedQuantity?: number;
}

export interface OrderAddress {
  name?: string;
  phone?: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface OrderStatusHistory {
  status: OrderStatus;
  timestamp: string;
  comment?: string;
}

export interface OrderTracking {
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
}

export interface OrderCancellation {
  cancelledAt?: string;
  reason?: string;
  cancelledBy?: string;
}

export interface ReturnItem {
  product: string;
  sku?: string;
  quantity: number;
  refundAmount: number;
}

export interface OrderReturnRequest {
  requestedAt?: string;
  reason?: string;
  details?: string;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'RECEIVED' | 'REFUNDED';
  items: ReturnItem[];
}

export interface OrderRefund {
  amount?: number;
  refundId?: string;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
  processedAt?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: string;
  items: OrderItem[];
  shippingAddress: OrderAddress;
  billingAddress?: OrderAddress;
  subtotal: number;
  discount: number;
  tax: number;
  shippingFee: number;
  totalAmount: number;
  currency: string;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  paymentProvider?: string;
  paymentOrderId?: string;
  paymentTransactionId?: string;
  orderStatus: OrderStatus;
  statusHistory: OrderStatusHistory[];
  tracking?: OrderTracking;
  cancellation?: OrderCancellation;
  returnRequest?: OrderReturnRequest;
  refund?: OrderRefund;
  invoiceNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InitiateOrderInput {
  addressId: string;
  paymentMethod: 'CARD' | 'UPI' | 'NETBANKING' | 'COD';
  billingAddressId?: string;
  notes?: string;
  idempotencyKey?: string;
}

export interface InitiateOrderResult {
  order: Order;
  paymentPayload?: {
    providerOrderId: string;
    amount: number;
    currency: string;
    keyId?: string;
    notes?: Record<string, string>;
  };
}

export interface VerifyPaymentInput {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface CancelOrderInput {
  reason: string;
}

export interface ReturnOrderInput {
  reason: string;
  details?: string;
  items: Array<{
    productId: string;
    variantSku?: string;
    quantity: number;
  }>;
}

export interface OrderInvoice {
  invoiceNumber: string;
  orderNumber: string;
  invoiceDate: string;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  customer: {
    name: string;
    phone?: string;
  };
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;
  items: Array<{
    name: string;
    sku?: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  financials: {
    subtotal: number;
    discount: number;
    shippingFee: number;
    tax: number;
    totalAmount: number;
  };
}

export const orderApi = {
  async initiateOrder(input: InitiateOrderInput) {
    return apiClient.post<{ success: boolean; data: InitiateOrderResult }>('/orders', input);
  },

  async verifyPayment(input: VerifyPaymentInput) {
    return apiClient.post<{ success: boolean; data: { order: Order } }>('/payments/verify', input);
  },

  async getMyOrders(params?: { page?: number; limit?: number; status?: string; paymentStatus?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.status) query.append('status', params.status);
    if (params?.paymentStatus) query.append('paymentStatus', params.paymentStatus);

    const queryString = query.toString();
    const endpoint = queryString ? `/orders?${queryString}` : '/orders';
    return apiClient.get<{
      success: boolean;
      data: {
        orders: Order[];
        pagination: { total: number; page: number; limit: number; totalPages: number };
      };
    }>(endpoint);
  },

  async getOrderDetails(orderId: string) {
    return apiClient.get<{ success: boolean; data: { order: Order } }>(`/orders/${orderId}`);
  },

  async cancelOrder(orderId: string, input: CancelOrderInput) {
    return apiClient.post<{ success: boolean; data: { order: Order } }>(`/orders/${orderId}/cancel`, input);
  },

  async requestReturn(orderId: string, input: ReturnOrderInput) {
    return apiClient.post<{ success: boolean; data: { order: Order } }>(`/orders/${orderId}/return`, input);
  },

  async getInvoice(orderId: string) {
    return apiClient.get<{ success: boolean; data: { invoice: OrderInvoice } }>(`/orders/${orderId}/invoice`);
  },
};