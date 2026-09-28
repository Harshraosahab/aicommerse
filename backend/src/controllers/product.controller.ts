import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/product.service.js';
import {
  productQuerySchema,
  createProductSchema,
  updateProductSchema,
} from '../validators/catalog.validator.js';
import { AppError } from '../utils/errors.js';

export class ProductController {
  /**
   * GET /api/v1/products
   */
  async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = productQuerySchema.safeParse(req.query);
      if (!validation.success) {
        throw new AppError(
          validation.error.issues[0]?.message || 'Invalid product query parameters',
          400,
          'VALIDATION_ERROR'
        );
      }

      const result = await productService.getProducts(validation.data);

      res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/products/suggestions
   */
  async getSuggestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q : '';
      const suggestions = await productService.getSearchSuggestions(q);

      res.status(200).json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/products/:slug
   */
  async getProductBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
      if (!slug) {
        throw new AppError('Product slug is required.', 400, 'SLUG_REQUIRED');
      }

      const product = await productService.getProductBySlug(slug);

      res.status(200).json({
        success: true,
        data: {
          product,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/products/:slug/related
   */
  async getRelatedProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
      if (!slug) {
        throw new AppError('Product slug is required.', 400, 'SLUG_REQUIRED');
      }

      const related = await productService.getRelatedProducts(slug);

      res.status(200).json({
        success: true,
        data: {
          products: related,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/products (Admin Only)
   */
  async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = createProductSchema.safeParse(req.body);
      if (!validation.success) {
        throw new AppError(
          validation.error.issues[0]?.message || 'Invalid product data',
          400,
          'VALIDATION_ERROR'
        );
      }

      const product = await productService.createProduct(validation.data);

      res.status(201).json({
        success: true,
        data: {
          product,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/products/:id (Admin Only)
   */
  async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validation = updateProductSchema.safeParse(req.body);
      if (!validation.success) {
        throw new AppError(
          validation.error.issues[0]?.message || 'Invalid product update data',
          400,
          'VALIDATION_ERROR'
        );
      }

      const product = await productService.updateProduct(id, validation.data);

      res.status(200).json({
        success: true,
        data: {
          product,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/products/:id (Admin Only)
   */
  async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await productService.deleteProduct(id);

      res.status(200).json({
        success: true,
        data: {
          message: 'Product deleted successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const productController = new ProductController();
