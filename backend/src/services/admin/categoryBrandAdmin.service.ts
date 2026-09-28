import { Types } from 'mongoose';
import { Category } from '../../models/category.model.js';
import { Brand } from '../../models/brand.model.js';
import { Product } from '../../models/product.model.js';
import { AppError } from '../../utils/errors.js';
import { logAdminAction } from '../../utils/auditLogger.js';

export class CategoryBrandAdminService {
  // --- Category CRUD ---
  async getCategories() {
    return Category.find()
      .populate('parentCategory', 'name slug')
      .sort({ name: 1 })
      .lean();
  }

  async createCategory(data: any, adminId: string, ip?: string, ua?: string) {
    let slug = data.slug;
    if (!slug) {
      slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    const existing = await Category.findOne({ slug });
    if (existing) {
      throw new AppError(`Category with slug "${slug}" already exists`, 409, 'DUPLICATE_SLUG');
    }

    if (data.parentCategory) {
      const parent = await Category.findById(data.parentCategory);
      if (!parent) {
        throw new AppError('Parent category not found', 404, 'NOT_FOUND');
      }
    }

    const category = await Category.create({ ...data, slug });

    await logAdminAction({
      adminId,
      action: 'CREATE_CATEGORY',
      resource: 'Category',
      resourceId: category._id.toString(),
      newState: category.toObject(),
      reason: 'Created new category',
      ipAddress: ip,
      userAgent: ua,
    });

    return category;
  }

  async updateCategory(id: string, data: any, adminId: string, ip?: string, ua?: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid category ID', 400, 'INVALID_ID');
    }

    const category = await Category.findById(id);
    if (!category) {
      throw new AppError('Category not found', 404, 'NOT_FOUND');
    }

    // Prevent circular hierarchy
    if (data.parentCategory && data.parentCategory.toString() === id) {
      throw new AppError('A category cannot be its own parent', 400, 'CIRCULAR_HIERARCHY');
    }

    const previousState = category.toObject();
    Object.assign(category, data);
    await category.save();

    await logAdminAction({
      adminId,
      action: 'UPDATE_CATEGORY',
      resource: 'Category',
      resourceId: category._id.toString(),
      previousState,
      newState: category.toObject(),
      reason: 'Updated category',
      ipAddress: ip,
      userAgent: ua,
    });

    return category;
  }

  async deleteCategory(id: string, adminId: string, ip?: string, ua?: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid category ID', 400, 'INVALID_ID');
    }

    const hasProducts = await Product.exists({ category: id });
    if (hasProducts) {
      throw new AppError(
        'Cannot delete category because active products are assigned to it. Reassign or deactivate those products first.',
        400,
        'CATEGORY_IN_USE'
      );
    }

    const hasChildren = await Category.exists({ parentCategory: id });
    if (hasChildren) {
      throw new AppError(
        'Cannot delete category because it has subcategories. Reassign child categories first.',
        400,
        'HAS_CHILDREN'
      );
    }

    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      throw new AppError('Category not found', 404, 'NOT_FOUND');
    }

    await logAdminAction({
      adminId,
      action: 'DELETE_CATEGORY',
      resource: 'Category',
      resourceId: id,
      previousState: category.toObject(),
      reason: 'Deleted unreferenced category',
      ipAddress: ip,
      userAgent: ua,
    });

    return { message: 'Category deleted successfully' };
  }

  // --- Brand CRUD ---
  async getBrands() {
    return Brand.find().sort({ name: 1 }).lean();
  }

  async createBrand(data: any, adminId: string, ip?: string, ua?: string) {
    let slug = data.slug;
    if (!slug) {
      slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    const existing = await Brand.findOne({ slug });
    if (existing) {
      throw new AppError(`Brand with slug "${slug}" already exists`, 409, 'DUPLICATE_SLUG');
    }

    const brand = await Brand.create({ ...data, slug });

    await logAdminAction({
      adminId,
      action: 'CREATE_BRAND',
      resource: 'Brand',
      resourceId: brand._id.toString(),
      newState: brand.toObject(),
      reason: 'Created new brand',
      ipAddress: ip,
      userAgent: ua,
    });

    return brand;
  }

  async updateBrand(id: string, data: any, adminId: string, ip?: string, ua?: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid brand ID', 400, 'INVALID_ID');
    }

    const brand = await Brand.findById(id);
    if (!brand) {
      throw new AppError('Brand not found', 404, 'NOT_FOUND');
    }

    const previousState = brand.toObject();
    Object.assign(brand, data);
    await brand.save();

    await logAdminAction({
      adminId,
      action: 'UPDATE_BRAND',
      resource: 'Brand',
      resourceId: brand._id.toString(),
      previousState,
      newState: brand.toObject(),
      reason: 'Updated brand',
      ipAddress: ip,
      userAgent: ua,
    });

    return brand;
  }

  async deleteBrand(id: string, adminId: string, ip?: string, ua?: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid brand ID', 400, 'INVALID_ID');
    }

    const hasProducts = await Product.exists({ brand: id });
    if (hasProducts) {
      throw new AppError(
        'Cannot delete brand because active products are assigned to it. Reassign or remove those products first.',
        400,
        'BRAND_IN_USE'
      );
    }

    const brand = await Brand.findByIdAndDelete(id);
    if (!brand) {
      throw new AppError('Brand not found', 404, 'NOT_FOUND');
    }

    await logAdminAction({
      adminId,
      action: 'DELETE_BRAND',
      resource: 'Brand',
      resourceId: id,
      previousState: brand.toObject(),
      reason: 'Deleted unreferenced brand',
      ipAddress: ip,
      userAgent: ua,
    });

    return { message: 'Brand deleted successfully' };
  }
}

export const categoryBrandAdminService = new CategoryBrandAdminService();
