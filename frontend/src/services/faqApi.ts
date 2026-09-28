import { apiClient } from './apiClient';

export interface FAQItem {
  _id: string;
  question: string;
  answer: string;
  category: string;
  slug: string;
  order: number;
  isPublished: boolean;
  createdAt: string;
}

export const faqApi = {
  getPublishedFAQs: async (params?: { category?: string; search?: string }) => {
    const res = await apiClient.get<{
      status: string;
      data: { faqs: FAQItem[] };
    }>('/faqs', { params: params as any });
    return res.data.faqs;
  },

  getFAQBySlug: async (slug: string) => {
    const res = await apiClient.get<{
      status: string;
      data: { faq: FAQItem };
    }>(`/faqs/${slug}`);
    return res.data.faq;
  },

  // Admin endpoints
  adminGetAllFAQs: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    isPublished?: boolean;
    search?: string;
  }) => {
    const res = await apiClient.get<{
      status: string;
      data: {
        faqs: FAQItem[];
        total: number;
        page: number;
        pages: number;
      };
    }>('/admin/faqs', { params: params as any });
    return res.data;
  },

  adminCreateFAQ: async (data: {
    question: string;
    answer: string;
    category: string;
    slug?: string;
    order?: number;
    isPublished?: boolean;
  }) => {
    const res = await apiClient.post<{
      status: string;
      message: string;
      data: { faq: FAQItem };
    }>('/admin/faqs', data);
    return res.data.faq;
  },

  adminUpdateFAQ: async (id: string, data: Partial<FAQItem>) => {
    const res = await apiClient.patch<{
      status: string;
      message: string;
      data: { faq: FAQItem };
    }>(`/admin/faqs/${id}`, data);
    return res.data.faq;
  },

  adminDeleteFAQ: async (id: string) => {
    const res = await apiClient.delete<{
      status: string;
      message: string;
    }>(`/admin/faqs/${id}`);
    return res;
  },

  adminSeedFAQs: async () => {
    const res = await apiClient.post<{
      status: string;
      message: string;
      data: { count: number };
    }>('/admin/faqs/seed');
    return { message: res.message, count: res.data.count };
  },
};
