import { Types } from 'mongoose';
import { Product } from '../../models/product.model.js';
import { Category } from '../../models/category.model.js';
import { Brand } from '../../models/brand.model.js';
import { Order } from '../../models/order.model.js';
import { AppError } from '../../utils/errors.js';
import { logAdminAction } from '../../utils/auditLogger.js';

export class ProductAdminService {
  /**
   * List products with admin filters, sorting, and pagination
   */
  async getProducts(params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    brand?: string;
    isActive?: boolean;
    stockStatus?: 'low_stock' | 'out_of_stock';
    sort?: string;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (params.search) {
      const sanitized = params.search.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      filter.$or = [
        { name: { $regex: sanitized, $options: 'i' } },
        { SKU: { $regex: sanitized, $options: 'i' } },
      ];
    }

    if (params.category) {
      filter.category = new Types.ObjectId(params.category);
    }

    if (params.brand) {
      filter.brand = new Types.ObjectId(params.brand);
    }

    if (typeof params.isActive === 'boolean') {
      filter.isActive = params.isActive;
    }

    if (params.stockStatus === 'out_of_stock') {
      filter.stock = { $lte: 0 };
    } else if (params.stockStatus === 'low_stock') {
      filter.stock = { $gt: 0, $lte: 10 };
    }

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    if (params.sort === 'price_asc') sortOption = { price: 1 };
    else if (params.sort === 'price_desc') sortOption = { price: -1 };
    else if (params.sort === 'stock_asc') sortOption = { stock: 1 };
    else if (params.sort === 'stock_desc') sortOption = { stock: -1 };
    else if (params.sort === 'name_asc') sortOption = { name: 1 };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .populate('brand', 'name slug')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getProductById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid product ID', 400, 'INVALID_ID');
    }
    const product = await Product.findById(id)
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .lean();

    if (!product) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }
    return product;
  }

  async createProduct(data: any, adminId: string, ip?: string, ua?: string) {
    // 1. SKU uniqueness check
    const existingSku = await Product.findOne({ SKU: data.SKU.toUpperCase() });
    if (existingSku) {
      throw new AppError(`SKU "${data.SKU}" is already in use`, 409, 'DUPLICATE_SKU');
    }

    // 2. Generate and verify slug
    let slug = data.slug;
    if (!slug) {
      slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }
    const existingSlug = await Product.findOne({ slug });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    // 3. Verify category
    const categoryExists = await Category.findById(data.category);
    if (!categoryExists) {
      throw new AppError('Specified category does not exist', 400, 'INVALID_CATEGORY');
    }

    // 4. Verify brand if provided
    if (data.brand) {
      const brandExists = await Brand.findById(data.brand);
      if (!brandExists) {
        throw new AppError('Specified brand does not exist', 400, 'INVALID_BRAND');
      }
    }

    const newProduct = await Product.create({
      ...data,
      slug,
      SKU: data.SKU.toUpperCase(),
    });

    await logAdminAction({
      adminId,
      action: 'CREATE_PRODUCT',
      resource: 'Product',
      resourceId: newProduct._id.toString(),
      newState: newProduct.toObject(),
      reason: 'Created new catalog product',
      ipAddress: ip,
      userAgent: ua,
    });

    return newProduct;
  }

  async updateProduct(id: string, data: any, adminId: string, ip?: string, ua?: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid product ID', 400, 'INVALID_ID');
    }

    const product = await Product.findById(id);
    if (!product) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }

    // Check SKU if modified
    if (data.SKU && data.SKU.toUpperCase() !== product.SKU) {
      const existing = await Product.findOne({
        _id: { $ne: product._id },
        SKU: data.SKU.toUpperCase(),
      });
      if (existing) {
        throw new AppError(`SKU "${data.SKU}" is already in use`, 409, 'DUPLICATE_SKU');
      }
      data.SKU = data.SKU.toUpperCase();
    }

    // Check category if modified
    if (data.category && data.category !== product.category?.toString()) {
      const categoryExists = await Category.findById(data.category);
      if (!categoryExists) {
        throw new AppError('Specified category does not exist', 400, 'INVALID_CATEGORY');
      }
    }

    const previousState = product.toObject();

    // Allowlisted explicit fields update
    const allowedFields = [
      'name', 'slug', 'description', 'shortDescription', 'brand', 'category',
      'subcategory', 'price', 'compareAtPrice', 'discount', 'stock', 'SKU',
      'tags', 'images', 'specifications', 'attributes', 'variants',
      'isActive', 'isFeatured', 'isBestseller', 'isNewArrival'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        (product as any)[field] = data[field];
      }
    }

    await product.save();

    await logAdminAction({
      adminId,
      action: 'UPDATE_PRODUCT',
      resource: 'Product',
      resourceId: product._id.toString(),
      previousState,
      newState: product.toObject(),
      reason: 'Admin product details update',
      ipAddress: ip,
      userAgent: ua,
    });

    return product;
  }

  async deleteOrDeactivateProduct(id: string, adminId: string, ip?: string, ua?: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid product ID', 400, 'INVALID_ID');
    }

    const product = await Product.findById(id);
    if (!product) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }

    // Check if product is referenced in any historic orders
    const hasOrderReferences = await Order.exists({ 'items.product': product._id });

    if (hasOrderReferences) {
      // Deactivate rather than delete to preserve historical financial records
      product.isActive = false;
      await product.save();

      await logAdminAction({
        adminId,
        action: 'DEACTIVATE_PRODUCT',
        resource: 'Product',
        resourceId: product._id.toString(),
        reason: 'Deactivated due to historical order dependencies',
        ipAddress: ip,
        userAgent: ua,
      });

      return {
        action: 'DEACTIVATED',
        message: 'Product has historical order references and was deactivated to preserve order history and accounting integrity.',
        product,
      };
    }

    // Safe to permanently remove if zero orders reference it
    await Product.findByIdAndDelete(id);

    await logAdminAction({
      adminId,
      action: 'DELETE_PRODUCT',
      resource: 'Product',
      resourceId: id,
      previousState: product.toObject(),
      reason: 'Permanently deleted unreferenced product',
      ipAddress: ip,
      userAgent: ua,
    });

    return {
      action: 'DELETED',
      message: 'Product deleted permanently.',
    };
  }
}

export const productAdminService = new ProductAdminService();
