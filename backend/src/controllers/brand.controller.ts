import { Request, Response, NextFunction } from 'express';
import { brandService } from '../services/brand.service.js';
import { createBrandSchema, updateBrandSchema } from '../validators/catalog.validator.js';
import { AppError } from '../utils/errors.js';

export class BrandController {
  /**
   * GET /api/v1/brands
   */
  async getBrands(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const brands = await brandService.getBrands();
      res.status(200).json({
        success: true,
        data: {
          brands,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/brands/:slug
   */
  async getBrandBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
      if (!slug) {
        throw new AppError('Brand slug is required.', 400, 'SLUG_REQUIRED');
      }

      const brand = await brandService.getBrandBySlug(slug);

      res.status(200).json({
        success: true,
        data: {
          brand,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/brands (Admin Only)
   */
  async createBrand(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = createBrandSchema.safeParse(req.body);
      if (!validation.success) {
        throw new AppError(
          validation.error.issues[0]?.message || 'Invalid brand data',
          400,
          'VALIDATION_ERROR'
        );
      }

      const brand = await brandService.createBrand(validation.data);

      res.status(201).json({
        success: true,
        data: {
          brand,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/brands/:id (Admin Only)
   */
  async updateBrand(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validation = updateBrandSchema.safeParse(req.body);
      if (!validation.success) {
        throw new AppError(
          validation.error.issues[0]?.message || 'Invalid brand update data',
          400,
          'VALIDATION_ERROR'
        );
      }

      const brand = await brandService.updateBrand(id, validation.data);

      res.status(200).json({
        success: true,
        data: {
          brand,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/brands/:id (Admin Only)
   */
  async deleteBrand(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await brandService.deleteBrand(id);

      res.status(200).json({
        success: true,
        data: {
          message: 'Brand deleted successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const brandController = new BrandController();
