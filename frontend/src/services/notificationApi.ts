import { apiClient } from './apiClient';

export interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  actionUrl?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  channel: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationPreferences {
  email: {
    orderUpdates?: boolean;
    paymentUpdates?: boolean;
    shippingUpdates?: boolean;
    supportUpdates?: boolean;
    promotional?: boolean;
    priceDrop?: boolean;
    backInStock?: boolean;
  };
  inApp: {
    orderUpdates?: boolean;
    paymentUpdates?: boolean;
    shippingUpdates?: boolean;
    supportUpdates?: boolean;
    promotional?: boolean;
    priceDrop?: boolean;
    backInStock?: boolean;
  };
}

export const notificationApi = {
  getNotifications: async (params?: { page?: number; limit?: number; isRead?: boolean; type?: string }) => {
    const res = await apiClient.get<{
      status: string;
      data: {
        notifications: NotificationItem[];
        total: number;
        unreadCount: number;
        page: number;
        pages: number;
      };
    }>('/notifications', { params: params as any });
    return res.data;
  },

  getUnreadCount: async () => {
    const res = await apiClient.get<{
      status: string;
      data: { unreadCount: number };
    }>('/notifications/unread-count');
    return res.data.unreadCount;
  },

  markAsRead: async (notificationId: string) => {
    const res = await apiClient.patch<{
      status: string;
      data: { notification: NotificationItem };
    }>(`/notifications/${notificationId}/read`);
    return res.data.notification;
  },

  markAllAsRead: async () => {
    const res = await apiClient.patch<{
      status: string;
      message: string;
      data: { modifiedCount: number };
    }>('/notifications/mark-all-read');
    return res.data;
  },

  deleteNotification: async (notificationId: string) => {
    const res = await apiClient.delete<{
      status: string;
      message: string;
    }>(`/notifications/${notificationId}`);
    return res;
  },

  clearRead: async () => {
    const res = await apiClient.delete<{
      status: string;
      message: string;
      data: { deletedCount: number };
    }>('/notifications/clear-read');
    return res.data;
  },

  getPreferences: async () => {
    const res = await apiClient.get<{
      status: string;
      data: { notificationPreferences: NotificationPreferences };
    }>('/users/me/notification-preferences');
    return res.data.notificationPreferences;
  },

  updatePreferences: async (preferences: Partial<NotificationPreferences>) => {
    const res = await apiClient.put<{
      status: string;
      message: string;
      data: { notificationPreferences: NotificationPreferences };
    }>('/users/me/notification-preferences', preferences);
    return res.data.notificationPreferences;
  },

  broadcastNotification: async (data: {
    title: string;
    message: string;
    type: string;
    priority?: string;
    actionUrl?: string;
    targetRole?: string;
  }) => {
    const res = await apiClient.post<{
      status: string;
      message: string;
      data: { sentCount: number };
    }>('/admin/notifications/broadcast', data);
    return res.data;
  },
};
