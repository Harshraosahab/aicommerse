import { Brand, IBrand } from '../models/brand.model.js';
import { slugify } from './product.service.js';
import { AppError } from '../utils/errors.js';
import { appCache } from '../utils/cache.js';

class BrandService {
  /**
   * Get all active brands (cached for 5 minutes)
   */
  async getBrands(): Promise<IBrand[]> {
    const cacheKey = 'brands:all';
    const cached = appCache.get<IBrand[]>(cacheKey);
    if (cached) return cached;

    const brands = (await Brand.find({ isActive: true }).sort({ name: 1 }).lean()) as any;
    appCache.set(cacheKey, brands, 300);
    return brands;
  }

  /**
   * Get brand by slug (cached for 5 minutes)
   */
  async getBrandBySlug(slug: string): Promise<IBrand> {
    const cacheKey = `brands:slug:${slug.toLowerCase()}`;
    const cached = appCache.get<IBrand>(cacheKey);
    if (cached) return cached;

    const brand = await Brand.findOne({ slug: slug.toLowerCase(), isActive: true }).lean();
    if (!brand) {
      throw new AppError('Brand not found.', 404, 'BRAND_NOT_FOUND');
    }

    appCache.set(cacheKey, brand as any, 300);
    return brand as any;
  }

  /**
   * Admin write: Create Brand (invalidates brand cache)
   */
  async createBrand(data: any): Promise<IBrand> {
    const slug = data.slug ? slugify(data.slug) : slugify(data.name);

    const existing = await Brand.findOne({ slug });
    if (existing) {
      throw new AppError('A brand with this slug already exists.', 409, 'SLUG_EXISTS');
    }

    const brand = new Brand({ ...data, slug });
    await brand.save();

    appCache.deletePrefix('brands');
    return brand;
  }

  /**
   * Admin write: Update Brand (invalidates brand cache)
   */
  async updateBrand(id: string, data: any): Promise<IBrand> {
    if (data.slug) {
      data.slug = slugify(data.slug);
      const existing = await Brand.findOne({ slug: data.slug, _id: { $ne: id } });
      if (existing) {
        throw new AppError('A brand with this slug already exists.', 409, 'SLUG_EXISTS');
      }
    }

    const brand = await Brand.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!brand) {
      throw new AppError('Brand not found.', 404, 'BRAND_NOT_FOUND');
    }

    appCache.deletePrefix('brands');
    return brand;
  }

  /**
   * Admin write: Delete Brand (invalidates brand cache)
   */
  async deleteBrand(id: string): Promise<void> {
    const brand = await Brand.findByIdAndDelete(id);
    if (!brand) {
      throw new AppError('Brand not found.', 404, 'BRAND_NOT_FOUND');
    }

    appCache.deletePrefix('brands');
  }
}

export const brandService = new BrandService();
