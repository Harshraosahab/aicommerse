import { Request, Response, NextFunction } from 'express';
import { categoryService } from '../services/category.service.js';
import { createCategorySchema, updateCategorySchema } from '../validators/catalog.validator.js';
import { AppError } from '../utils/errors.js';

export class CategoryController {
  /**
   * GET /api/v1/categories
   */
  async getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await categoryService.getCategories();
      res.status(200).json({
        success: true,
        data: {
          categories,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/categories/:slug
   */
  async getCategoryBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
      if (!slug) {
        throw new AppError('Category slug is required.', 400, 'SLUG_REQUIRED');
      }

      const result = await categoryService.getCategoryBySlug(slug);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/categories (Admin Only)
   */
  async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = createCategorySchema.safeParse(req.body);
      if (!validation.success) {
        throw new AppError(
          validation.error.issues[0]?.message || 'Invalid category data',
          400,
          'VALIDATION_ERROR'
        );
      }

      const category = await categoryService.createCategory(validation.data);

      res.status(201).json({
        success: true,
        data: {
          category,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/categories/:id (Admin Only)
   */
  async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validation = updateCategorySchema.safeParse(req.body);
      if (!validation.success) {
        throw new AppError(
          validation.error.issues[0]?.message || 'Invalid category update data',
          400,
          'VALIDATION_ERROR'
        );
      }

      const category = await categoryService.updateCategory(id, validation.data);

      res.status(200).json({
        success: true,
        data: {
          category,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/categories/:id (Admin Only)
   */
  async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await categoryService.deleteCategory(id);

      res.status(200).json({
        success: true,
        data: {
          message: 'Category deleted successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const categoryController = new CategoryController();
