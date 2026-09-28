import { Category, ICategory } from '../models/category.model.js';
import { slugify } from './product.service.js';
import { AppError } from '../utils/errors.js';
import { appCache } from '../utils/cache.js';

class CategoryService {
  /**
   * Get all active categories with optional hierarchy nesting (cached for 5 minutes)
   */
  async getCategories(): Promise<ICategory[]> {
    const cacheKey = 'categories:all';
    const cached = appCache.get<ICategory[]>(cacheKey);
    if (cached) return cached;

    const categories = (await Category.find({ isActive: true })
      .populate('parentCategory', 'name slug')
      .sort({ name: 1 })
      .lean()) as any;

    appCache.set(cacheKey, categories, 300);
    return categories;
  }

  /**
   * Get single category by slug and its immediate subcategories (cached for 5 minutes)
   */
  async getCategoryBySlug(slug: string): Promise<{ category: ICategory; subcategories: ICategory[] }> {
    const cacheKey = `categories:slug:${slug.toLowerCase()}`;
    const cached = appCache.get<{ category: ICategory; subcategories: ICategory[] }>(cacheKey);
    if (cached) return cached;

    const category = await Category.findOne({ slug: slug.toLowerCase(), isActive: true });
    if (!category) {
      throw new AppError('Category not found.', 404, 'CATEGORY_NOT_FOUND');
    }

    const subcategories = await Category.find({ parentCategory: category._id, isActive: true })
      .sort({ name: 1 })
      .lean();

    const result = { category, subcategories: subcategories as any };
    appCache.set(cacheKey, result, 300);
    return result;
  }

  /**
   * Admin write: Create Category (invalidates category cache)
   */
  async createCategory(data: any): Promise<ICategory> {
    const slug = data.slug ? slugify(data.slug) : slugify(data.name);

    const existing = await Category.findOne({ slug });
    if (existing) {
      throw new AppError('A category with this slug already exists.', 409, 'SLUG_EXISTS');
    }

    const category = new Category({ ...data, slug });
    await category.save();

    appCache.deletePrefix('categories');
    return category;
  }

  /**
   * Admin write: Update Category (invalidates category cache)
   */
  async updateCategory(id: string, data: any): Promise<ICategory> {
    if (data.slug) {
      data.slug = slugify(data.slug);
      const existing = await Category.findOne({ slug: data.slug, _id: { $ne: id } });
      if (existing) {
        throw new AppError('A category with this slug already exists.', 409, 'SLUG_EXISTS');
      }
    }

    const category = await Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!category) {
      throw new AppError('Category not found.', 404, 'CATEGORY_NOT_FOUND');
    }

    appCache.deletePrefix('categories');
    return category;
  }

  /**
   * Admin write: Delete Category (invalidates category cache)
   */
  async deleteCategory(id: string): Promise<void> {
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      throw new AppError('Category not found.', 404, 'CATEGORY_NOT_FOUND');
    }

    appCache.deletePrefix('categories');
  }
}

export const categoryService = new CategoryService();
