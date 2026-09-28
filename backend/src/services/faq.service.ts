import { FAQ, IFAQ, FAQCategory } from '../models/faq.model.js';
import { AppError } from '../utils/errors.js';
import { appCache } from '../utils/cache.js';

export interface CreateFAQInput {
  question: string;
  answer: string;
  category: FAQCategory;
  slug?: string;
  order?: number;
  isPublished?: boolean;
}

export class FAQService {
  /**
   * Helper to slugify question
   */
  private static generateSlug(question: string): string {
    return question
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Get all published FAQs, optionally filtered by category or search query (cached for 5 minutes when unfiltered)
   */
  static async getPublishedFAQs(params: {
    category?: string;
    search?: string;
  }): Promise<IFAQ[]> {
    const isUnfiltered = (!params.category || params.category === 'All') && !params.search;
    const cacheKey = 'faqs:published:all';

    if (isUnfiltered) {
      const cached = appCache.get<IFAQ[]>(cacheKey);
      if (cached) return cached;
    }

    const filter: Record<string, any> = { isPublished: true };

    if (params.category && params.category !== 'All') {
      filter.category = params.category;
    }

    if (params.search) {
      const sanitized = params.search.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      filter.$or = [
        { question: { $regex: sanitized, $options: 'i' } },
        { answer: { $regex: sanitized, $options: 'i' } },
      ];
    }

    const results = (await FAQ.find(filter).sort({ category: 1, order: 1, createdAt: 1 }).lean()) as unknown as IFAQ[];
    if (isUnfiltered) {
      appCache.set(cacheKey, results, 300);
    }
    return results;
  }

  /**
   * Get single published FAQ by slug (cached for 5 minutes)
   */
  static async getFAQBySlug(slug: string): Promise<IFAQ> {
    const cacheKey = `faqs:slug:${slug.toLowerCase()}`;
    const cached = appCache.get<IFAQ>(cacheKey);
    if (cached) return cached;

    const faq = await FAQ.findOne({ slug, isPublished: true }).lean();
    if (!faq) {
      throw new AppError('FAQ not found', 404, 'NOT_FOUND');
    }

    appCache.set(cacheKey, faq as unknown as IFAQ, 300);
    return faq as unknown as IFAQ;
  }

  /**
   * Admin: List all FAQs (including unpublished) with pagination
   */
  static async getAllFAQs(query: {
    page?: number;
    limit?: number;
    category?: string;
    isPublished?: boolean;
    search?: string;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (query.category) {
      filter.category = query.category;
    }
    if (query.isPublished !== undefined) {
      filter.isPublished = query.isPublished;
    }
    if (query.search) {
      const sanitized = query.search.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      filter.$or = [
        { question: { $regex: sanitized, $options: 'i' } },
        { answer: { $regex: sanitized, $options: 'i' } },
      ];
    }

    const [faqs, total] = await Promise.all([
      FAQ.find(filter).sort({ order: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      FAQ.countDocuments(filter),
    ]);

    return {
      faqs,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Admin: Create a new FAQ
   */
  static async createFAQ(input: CreateFAQInput): Promise<IFAQ> {
    const slug = input.slug?.trim() || this.generateSlug(input.question);

    const existing = await FAQ.findOne({ slug });
    if (existing) {
      throw new AppError('An FAQ with this slug already exists. Please choose a unique question or slug.', 409, 'CONFLICT');
    }

    const faq = await FAQ.create({
      ...input,
      slug,
      order: input.order ?? 0,
      isPublished: input.isPublished ?? true,
    });

    appCache.deletePrefix('faqs');
    return faq;
  }

  /**
   * Admin: Update an existing FAQ
   */
  static async updateFAQ(id: string, update: Partial<CreateFAQInput>): Promise<IFAQ> {
    const faq = await FAQ.findById(id);
    if (!faq) {
      throw new AppError('FAQ not found', 404, 'NOT_FOUND');
    }

    if (update.slug && update.slug !== faq.slug) {
      const existing = await FAQ.findOne({ slug: update.slug, _id: { $ne: id } });
      if (existing) {
        throw new AppError('Another FAQ with this slug already exists', 409, 'CONFLICT');
      }
      faq.slug = update.slug;
    } else if (update.question && !update.slug && update.question !== faq.question) {
      // Re-generate slug if question changed and slug wasn't explicitly fixed
      const newSlug = this.generateSlug(update.question);
      const existing = await FAQ.findOne({ slug: newSlug, _id: { $ne: id } });
      if (!existing) {
        faq.slug = newSlug;
      }
    }

    if (update.question !== undefined) faq.question = update.question;
    if (update.answer !== undefined) faq.answer = update.answer;
    if (update.category !== undefined) faq.category = update.category;
    if (update.order !== undefined) faq.order = update.order;
    if (update.isPublished !== undefined) faq.isPublished = update.isPublished;

    await faq.save();
    appCache.deletePrefix('faqs');
    return faq;
  }

  /**
   * Admin: Delete an FAQ
   */
  static async deleteFAQ(id: string): Promise<void> {
    const result = await FAQ.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      throw new AppError('FAQ not found', 404, 'NOT_FOUND');
    }
    appCache.deletePrefix('faqs');
  }

  /**
   * Seed default realistic FAQs if empty
   */
  static async seedDefaultFAQs(): Promise<number> {
    const count = await FAQ.countDocuments();
    if (count > 0) return 0;

    const defaults: Array<CreateFAQInput & { slug: string }> = [
      {
        question: 'How do I track my order status?',
        answer: 'You can track your order in real-time by visiting the Orders section under your profile, or by clicking the tracking link provided in your shipping confirmation email.',
        category: 'Shipping & Delivery',
        slug: 'how-do-i-track-my-order-status',
        order: 1,
        isPublished: true,
      },
      {
        question: 'What payment methods are supported?',
        answer: 'We accept all major credit and debit cards (Visa, MasterCard, American Express), digital wallets, and Cash on Delivery (COD) for eligible delivery locations.',
        category: 'Payments',
        slug: 'what-payment-methods-are-supported',
        order: 2,
        isPublished: true,
      },
      {
        question: 'What is your return policy?',
        answer: 'Items can be returned within 14 days of delivery if they are unused, in original packaging, and include all tags. Go to your Orders page and select "Request Return" to begin.',
        category: 'Returns & Refunds',
        slug: 'what-is-your-return-policy',
        order: 3,
        isPublished: true,
      },
      {
        question: 'How long do refunds take to process?',
        answer: 'Once our warehouse inspects and approves your returned item, refunds are processed within 3-5 business days to your original payment method.',
        category: 'Returns & Refunds',
        slug: 'how-long-do-refunds-take-to-process',
        order: 4,
        isPublished: true,
      },
      {
        question: 'How do I reset my password?',
        answer: 'Click "Forgot Password" on the login page and enter your registered email address. We will immediately dispatch a secure password reset link valid for 1 hour.',
        category: 'Account & Security',
        slug: 'how-do-i-reset-my-password',
        order: 5,
        isPublished: true,
      },
      {
        question: 'Can I cancel an order after placing it?',
        answer: 'You may cancel any order before it enters the SHIPPED state directly from your Order Details page. Once shipped, please use our Returns process after arrival.',
        category: 'Ordering',
        slug: 'can-i-cancel-an-order-after-placing-it',
        order: 6,
        isPublished: true,
      },
    ];

    await FAQ.insertMany(defaults);
    return defaults.length;
  }
}
