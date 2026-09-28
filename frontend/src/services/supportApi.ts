import { apiClient } from './apiClient';

export interface TicketResponse {
  _id: string;
  sender: {
    _id: string;
    name: string;
    role: string;
    profileImage?: string;
  };
  senderRole: 'CUSTOMER' | 'ADMIN' | 'SUPPORT_MANAGER';
  message: string;
  attachments?: string[];
  createdAt: string;
}

export interface SupportTicket {
  _id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_CUSTOMER' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  relatedOrder?: {
    _id: string;
    orderNumber: string;
    status: string;
    total: number;
    items?: Array<{ name: string; quantity: number }>;
  };
  relatedProduct?: {
    _id: string;
    name: string;
    slug: string;
    images?: Array<{ url: string }>;
  };
  responses: TicketResponse[];
  resolvedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const supportApi = {
  createTicket: async (data: {
    subject: string;
    category: string;
    message: string;
    priority?: string;
    relatedOrder?: string;
    relatedProduct?: string;
  }) => {
    const res = await apiClient.post<{
      status: string;
      message: string;
      data: { ticket: SupportTicket };
    }>('/support', data);
    return res.data.ticket;
  },

  getMyTickets: async (params?: { page?: number; limit?: number; status?: string; category?: string }) => {
    const res = await apiClient.get<{
      status: string;
      data: {
        tickets: SupportTicket[];
        total: number;
        page: number;
        pages: number;
      };
    }>('/support', { params: params as any });
    return res.data;
  },

  getTicketById: async (ticketId: string) => {
    const res = await apiClient.get<{
      status: string;
      data: { ticket: SupportTicket };
    }>(`/support/${ticketId}`);
    return res.data.ticket;
  },

  addReply: async (ticketId: string, message: string, attachments: string[] = []) => {
    const res = await apiClient.post<{
      status: string;
      message: string;
      data: { ticket: SupportTicket };
    }>(`/support/${ticketId}/reply`, { message, attachments });
    return res.data.ticket;
  },

  closeTicket: async (ticketId: string) => {
    const res = await apiClient.patch<{
      status: string;
      message: string;
      data: { ticket: SupportTicket };
    }>(`/support/${ticketId}/close`);
    return res.data.ticket;
  },
};
