import { Request, Response, NextFunction } from 'express';
import { FAQService } from '../services/faq.service.js';

export class FAQController {
  static async getPublishedFAQs(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, search } = req.query as any;
      const faqs = await FAQService.getPublishedFAQs({ category, search });

      res.status(200).json({
        status: 'success',
        data: { faqs },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getFAQBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const slug = String(req.params.slug);
      const faq = await FAQService.getFAQBySlug(slug);

      res.status(200).json({
        status: 'success',
        data: { faq },
      });
    } catch (error) {
      next(error);
    }
  }

  static async adminGetAllFAQs(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await FAQService.getAllFAQs(req.query as any);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async adminCreateFAQ(req: Request, res: Response, next: NextFunction) {
    try {
      const faq = await FAQService.createFAQ(req.body);

      res.status(201).json({
        status: 'success',
        message: 'FAQ created successfully',
        data: { faq },
      });
    } catch (error) {
      next(error);
    }
  }

  static async adminUpdateFAQ(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const faq = await FAQService.updateFAQ(id, req.body);

      res.status(200).json({
        status: 'success',
        message: 'FAQ updated successfully',
        data: { faq },
      });
    } catch (error) {
      next(error);
    }
  }

  static async adminDeleteFAQ(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      await FAQService.deleteFAQ(id);

      res.status(200).json({
        status: 'success',
        message: 'FAQ deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async adminSeedFAQs(_req: Request, res: Response, next: NextFunction) {
    try {
      const seeded = await FAQService.seedDefaultFAQs();

      res.status(200).json({
        status: 'success',
        message: seeded > 0 ? `Seeded ${seeded} default FAQs` : 'FAQs already exist',
        data: { count: seeded },
      });
    } catch (error) {
      next(error);
    }
  }
}
