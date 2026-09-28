import { apiClient } from './apiClient';

export interface DashboardMetrics {
  period: string;
  dateRange: { startDate: string; endDate: string };
  users: { total: number; active: number; new: number };
  products: { total: number; active: number; lowStock: number; outOfStock: number };
  orders: {
    total: number;
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    returnRequested: number;
    returned: number;
  };
  financials: {
    netRevenue: number;
    grossRevenue: number;
    refundedAmount: number;
    paidOrdersCount: number;
    averageOrderValue: number;
  };
  payments: { paid: number; pending: number; failed: number; refunded: number };
  abandonedCarts: number;
  recentOrders: Array<{
    _id: string;
    orderNumber: string;
    totalAmount: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
    shippingAddress?: { name?: string };
  }>;
}

export interface SalesAnalyticsPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface AdminProduct {
  _id: string;
  name: string;
  slug: string;
  SKU: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  discount: number;
  isActive: boolean;
  category?: { _id: string; name: string };
  brand?: { _id: string; name: string };
  images: Array<{ url: string; alt?: string; isPrimary?: boolean }>;
  variants: Array<{ name: string; sku: string; price: number; stock: number }>;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  price: number;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  isActive: boolean;
  variants: Array<{
    name: string;
    sku: string;
    stock: number;
    price: number;
    stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  }>;
}

export interface AdminOrder {
  _id: string;
  orderNumber: string;
  user?: { _id: string; name: string; email: string; phone?: string };
  items: Array<{
    product: string;
    name: string;
    sku?: string;
    variantSku?: string;
    price: number;
    quantity: number;
    lineTotal: number;
    image?: string;
  }>;
  shippingAddress: {
    name?: string;
    phone?: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  subtotal: number;
  discount: number;
  tax: number;
  shippingFee: number;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  orderStatus: string;
  status: string;
  tracking?: {
    carrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
  };
  cancellation?: { cancelledAt?: string; reason?: string };
  returnRequest?: { status: string; reason?: string; requestedAt?: string };
  refund?: { amount?: number; status?: string };
  createdAt: string;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AdminAuditLog {
  _id: string;
  adminId?: string;
  admin?: { _id: string; name?: string; email?: string; role?: string; firstName?: string; lastName?: string };
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
  previousState?: any;
  newState?: any;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: string;
  createdAt?: string;
}

export const adminApi = {
  // --- Dashboard ---
  getMetrics: (period: string = '30d') =>
    apiClient.request<{ success: boolean; data: DashboardMetrics }>(
      `/admin/dashboard/metrics?period=${encodeURIComponent(period)}`
    ),

  getSalesAnalytics: (period: string = '30d') =>
    apiClient.request<{ success: boolean; data: SalesAnalyticsPoint[] }>(
      `/admin/dashboard/sales-analytics?period=${encodeURIComponent(period)}`
    ),

  getTopProducts: (limit: number = 5) =>
    apiClient.request<{ success: boolean; data: any[] }>(
      `/admin/dashboard/top-products?limit=${limit}`
    ),

  getCategoryPerformance: () =>
    apiClient.request<{ success: boolean; data: any[] }>('/admin/dashboard/category-performance'),

  getAbandonedCarts: (page: number = 1, limit: number = 20) =>
    apiClient.request<{ success: boolean; data: any[]; meta: any }>(
      `/admin/dashboard/abandoned-carts?page=${page}&limit=${limit}`
    ),

  // --- Products ---
  getProducts: (params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    brand?: string;
    isActive?: boolean;
    stockStatus?: string;
    sort?: string;
  } = {}) => {
    const sp = new URLSearchParams();
    if (params.page) sp.append('page', params.page.toString());
    if (params.limit) sp.append('limit', params.limit.toString());
    if (params.search) sp.append('search', params.search);
    if (params.category) sp.append('category', params.category);
    if (params.brand) sp.append('brand', params.brand);
    if (params.isActive !== undefined) sp.append('isActive', params.isActive.toString());
    if (params.stockStatus) sp.append('stockStatus', params.stockStatus);
    if (params.sort) sp.append('sort', params.sort);
    return apiClient.request<{ success: boolean; data: AdminProduct[]; meta: any }>(
      `/admin/products?${sp.toString()}`
    );
  },

  getProductById: (id: string) =>
    apiClient.request<{ success: boolean; data: AdminProduct }>(`/admin/products/${id}`),

  createProduct: (data: any) =>
    apiClient.request<{ success: boolean; data: AdminProduct }>('/admin/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProduct: (id: string, data: any) =>
    apiClient.request<{ success: boolean; data: AdminProduct }>(`/admin/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteProduct: (id: string) =>
    apiClient.request<{ success: boolean; data: any }>(`/admin/products/${id}`, {
      method: 'DELETE',
    }),

  // --- Categories & Brands ---
  getCategories: () =>
    apiClient.request<{ success: boolean; data: any[] }>('/admin/categories'),

  createCategory: (data: any) =>
    apiClient.request<{ success: boolean; data: any }>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCategory: (id: string, data: any) =>
    apiClient.request<{ success: boolean; data: any }>(`/admin/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteCategory: (id: string) =>
    apiClient.request<{ success: boolean; data: any }>(`/admin/categories/${id}`, {
      method: 'DELETE',
    }),

  getBrands: () =>
    apiClient.request<{ success: boolean; data: any[] }>('/admin/brands'),

  createBrand: (data: any) =>
    apiClient.request<{ success: boolean; data: any }>('/admin/brands', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateBrand: (id: string, data: any) =>
    apiClient.request<{ success: boolean; data: any }>(`/admin/brands/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteBrand: (id: string) =>
    apiClient.request<{ success: boolean; data: any }>(`/admin/brands/${id}`, {
      method: 'DELETE',
    }),

  // --- Inventory ---
  getInventory: (params: { page?: number; limit?: number; search?: string; status?: string } = {}) => {
    const sp = new URLSearchParams();
    if (params.page) sp.append('page', params.page.toString());
    if (params.limit) sp.append('limit', params.limit.toString());
    if (params.search) sp.append('search', params.search);
    if (params.status) sp.append('status', params.status);
    return apiClient.request<{
      success: boolean;
      data: InventoryItem[];
      meta: any;
    }>(`/admin/inventory?${sp.toString()}`);
  },

  adjustStock: (data: { productId: string; variantSku?: string; adjustment: number; reason: string }) =>
    apiClient.request<{ success: boolean; data: any }>('/admin/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // --- Orders ---
  getOrders: (params: {
    page?: number;
    limit?: number;
    status?: string;
    paymentStatus?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    sort?: string;
  } = {}) => {
    const sp = new URLSearchParams();
    if (params.page) sp.append('page', params.page.toString());
    if (params.limit) sp.append('limit', params.limit.toString());
    if (params.status) sp.append('status', params.status);
    if (params.paymentStatus) sp.append('paymentStatus', params.paymentStatus);
    if (params.search) sp.append('search', params.search);
    if (params.startDate) sp.append('startDate', params.startDate);
    if (params.endDate) sp.append('endDate', params.endDate);
    if (params.sort) sp.append('sort', params.sort);
    return apiClient.request<{ success: boolean; data: AdminOrder[]; meta: any }>(
      `/admin/orders?${sp.toString()}`
    );
  },

  getOrderById: (id: string) =>
    apiClient.request<{ success: boolean; data: AdminOrder }>(`/admin/orders/${id}`),

  updateOrderStatus: (id: string, data: { status: string; comment?: string; carrier?: string; trackingNumber?: string; trackingUrl?: string }) =>
    apiClient.request<{ success: boolean; data: AdminOrder }>(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  cancelOrder: (id: string, reason: string) =>
    apiClient.request<{ success: boolean; data: AdminOrder }>(`/admin/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  // --- Payments, Returns & Refunds ---
  getPayments: (params: { page?: number; limit?: number; status?: string; method?: string } = {}) => {
    const sp = new URLSearchParams();
    if (params.page) sp.append('page', params.page.toString());
    if (params.limit) sp.append('limit', params.limit.toString());
    if (params.status) sp.append('status', params.status);
    if (params.method) sp.append('method', params.method);
    return apiClient.request<{ success: boolean; data: any[]; meta: any }>(
      `/admin/payments?${sp.toString()}`
    );
  },

  getReturns: (params: { page?: number; limit?: number; status?: string } = {}) => {
    const sp = new URLSearchParams();
    if (params.page) sp.append('page', params.page.toString());
    if (params.limit) sp.append('limit', params.limit.toString());
    if (params.status) sp.append('status', params.status);
    return apiClient.request<{ success: boolean; data: any[]; meta: any }>(
      `/admin/returns?${sp.toString()}`
    );
  },

  decideReturn: (id: string, decision: 'APPROVED' | 'REJECTED', reason: string) =>
    apiClient.request<{ success: boolean; data: any }>(`/admin/returns/${id}/decision`, {
      method: 'POST',
      body: JSON.stringify({ decision, reason }),
    }),

  getRefunds: (page: number = 1, limit: number = 20) =>
    apiClient.request<{ success: boolean; data: any[]; meta: any }>(
      `/admin/refunds?page=${page}&limit=${limit}`
    ),

  processRefund: (id: string, amount: number, reason: string) =>
    apiClient.request<{ success: boolean; data: any }>(`/admin/refunds/${id}/process`, {
      method: 'POST',
      body: JSON.stringify({ amount, reason }),
    }),

  // --- Users ---
  getUsers: (params: { page?: number; limit?: number; search?: string; role?: string; isActive?: boolean } = {}) => {
    const sp = new URLSearchParams();
    if (params.page) sp.append('page', params.page.toString());
    if (params.limit) sp.append('limit', params.limit.toString());
    if (params.search) sp.append('search', params.search);
    if (params.role) sp.append('role', params.role);
    if (params.isActive !== undefined) sp.append('isActive', params.isActive.toString());
    return apiClient.request<{ success: boolean; data: AdminUser[]; meta: any }>(
      `/admin/users?${sp.toString()}`
    );
  },

  getUserById: (id: string) =>
    apiClient.request<{ success: boolean; data: { user: AdminUser; orderSummary: any } }>(
      `/admin/users/${id}`
    ),

  updateUserStatus: (id: string, isActive: boolean, reason?: string) =>
    apiClient.request<{ success: boolean; data: any }>(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive, reason }),
    }),

  updateUserRole: (id: string, role: string) =>
    apiClient.request<{ success: boolean; data: any }>(`/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),

  // --- Marketing: Coupons & Banners ---
  getCoupons: (params: { page?: number; limit?: number; search?: string } = {}) => {
    const sp = new URLSearchParams();
    if (params.page) sp.append('page', params.page.toString());
    if (params.limit) sp.append('limit', params.limit.toString());
    if (params.search) sp.append('search', params.search);
    return apiClient.request<{ success: boolean; data: any[]; meta: any }>(
      `/admin/coupons?${sp.toString()}`
    );
  },

  createCoupon: (data: any) =>
    apiClient.request<{ success: boolean; data: any }>('/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCoupon: (id: string, data: any) =>
    apiClient.request<{ success: boolean; data: any }>(`/admin/coupons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteCoupon: (id: string) =>
    apiClient.request<{ success: boolean; data: any }>(`/admin/coupons/${id}`, {
      method: 'DELETE',
    }),

  getBanners: () =>
    apiClient.request<{ success: boolean; data: any[] }>('/admin/banners'),

  createBanner: (data: any) =>
    apiClient.request<{ success: boolean; data: any }>('/admin/banners', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateBanner: (id: string, data: any) =>
    apiClient.request<{ success: boolean; data: any }>(`/admin/banners/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteBanner: (id: string) =>
    apiClient.request<{ success: boolean; data: any }>(`/admin/banners/${id}`, {
      method: 'DELETE',
    }),

  // --- Reviews & Support ---
  getReviews: (params: { page?: number; limit?: number; isApproved?: boolean; rating?: number; search?: string } = {}) => {
    const sp = new URLSearchParams();
    if (params.page) sp.append('page', params.page.toString());
    if (params.limit) sp.append('limit', params.limit.toString());
    if (params.isApproved !== undefined) sp.append('isApproved', params.isApproved.toString());
    if (params.rating) sp.append('rating', params.rating.toString());
    if (params.search) sp.append('search', params.search);
    return apiClient.request<{ success: boolean; data: any[]; meta: any }>(
      `/admin/reviews?${sp.toString()}`
    );
  },

  moderateReview: (id: string, action: 'APPROVE' | 'REJECT' | 'DELETE', reason?: string) =>
    apiClient.request<{ success: boolean; data: any }>(`/admin/reviews/${id}/moderate`, {
      method: 'PATCH',
      body: JSON.stringify({ action, reason }),
    }),

  getTickets: (params: { page?: number; limit?: number; status?: string; priority?: string; search?: string } = {}) => {
    const sp = new URLSearchParams();
    if (params.page) sp.append('page', params.page.toString());
    if (params.limit) sp.append('limit', params.limit.toString());
    if (params.status) sp.append('status', params.status);
    if (params.priority) sp.append('priority', params.priority);
    if (params.search) sp.append('search', params.search);
    return apiClient.request<{ success: boolean; data: any[]; meta: any }>(
      `/admin/support?${sp.toString()}`
    );
  },

  getTicketById: (id: string) =>
    apiClient.request<{ success: boolean; data: any }>(`/admin/support/${id}`),

  respondToTicket: (id: string, message: string, status?: string) =>
    apiClient.request<{ success: boolean; data: any }>(`/admin/support/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify({ message, status }),
    }),

  updateTicketStatus: (id: string, data: { status: string; priority?: string; assignedTo?: string }) =>
    apiClient.request<{ success: boolean; data: any }>(`/admin/support/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // --- Audit Logs & Settings ---
  getAuditLogs: (params: { page?: number; limit?: number; action?: string; resource?: string; adminId?: string; startDate?: string; endDate?: string } = {}) => {
    const sp = new URLSearchParams();
    if (params.page) sp.append('page', params.page.toString());
    if (params.limit) sp.append('limit', params.limit.toString());
    if (params.action) sp.append('action', params.action);
    if (params.resource) sp.append('resource', params.resource);
    if (params.adminId) sp.append('adminId', params.adminId);
    if (params.startDate) sp.append('startDate', params.startDate);
    if (params.endDate) sp.append('endDate', params.endDate);
    return apiClient.request<{ success: boolean; data: AdminAuditLog[]; meta: any }>(
      `/admin/audit-logs?${sp.toString()}`
    );
  },

  getSettings: () =>
    apiClient.request<{ success: boolean; data: any }>('/admin/settings'),
};
