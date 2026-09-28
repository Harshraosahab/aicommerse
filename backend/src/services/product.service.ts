import mongoose from 'mongoose';
import { Product, IProduct } from '../models/product.model.js';
import { Category } from '../models/category.model.js';
import { Brand } from '../models/brand.model.js';
import { ProductQueryInput } from '../validators/catalog.validator.js';
import { paginateQuery, PaginatedResponse } from '../utils/pagination.js';
import { AppError } from '../utils/errors.js';
import { appCache } from '../utils/cache.js';

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-'); // Replace multiple - with single -
}

class ProductService {
  /**
   * Dynamic catalog querying with server-side filtering, sorting, and pagination
   */
  async getProducts(params: ProductQueryInput): Promise<PaginatedResponse<IProduct>> {
    const filter: Record<string, any> = { isActive: true };

    // 1. Search (Sanitized text or regex matching)
    if (params.search) {
      const sanitized = params.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: sanitized, $options: 'i' } },
        { tags: { $in: [new RegExp(`^${sanitized}`, 'i')] } },
        { SKU: { $regex: sanitized, $options: 'i' } },
      ];
    }

    // 2. Category / Subcategory Filter (Resolve slug or ObjectId)
    if (params.category) {
      if (mongoose.Types.ObjectId.isValid(params.category)) {
        filter.category = params.category;
      } else {
        const cat = await Category.findOne({ slug: params.category.toLowerCase() }).select('_id');
        if (cat) {
          filter.category = cat._id;
        } else {
          // Category specified does not exist -> return empty set safely
          filter.category = new mongoose.Types.ObjectId();
        }
      }
    }

    if (params.subcategory) {
      if (mongoose.Types.ObjectId.isValid(params.subcategory)) {
        filter.subcategory = params.subcategory;
      } else {
        const subcat = await Category.findOne({ slug: params.subcategory.toLowerCase() }).select('_id');
        if (subcat) {
          filter.subcategory = subcat._id;
        } else {
          filter.subcategory = new mongoose.Types.ObjectId();
        }
      }
    }

    // 3. Brand Filter (Resolve slug or ObjectId)
    if (params.brand) {
      if (mongoose.Types.ObjectId.isValid(params.brand)) {
        filter.brand = params.brand;
      } else {
        const b = await Brand.findOne({ slug: params.brand.toLowerCase() }).select('_id');
        if (b) {
          filter.brand = b._id;
        } else {
          filter.brand = new mongoose.Types.ObjectId();
        }
      }
    }

    // 4. Price range filter
    if (params.minPrice !== undefined || params.maxPrice !== undefined) {
      filter.price = {};
      if (params.minPrice !== undefined) filter.price.$gte = params.minPrice;
      if (params.maxPrice !== undefined) filter.price.$lte = params.maxPrice;
    }

    // 5. Rating filter
    if (params.minRating !== undefined) {
      filter.rating = { $gte: params.minRating };
    }

    // 6. Discount filter
    if (params.minDiscount !== undefined) {
      filter.discount = { $gte: params.minDiscount };
    }

    // 7. Stock availability filter
    if (params.inStock === true) {
      filter.stock = { $gt: 0 };
    }

    // 8. Discovery flags
    if (params.isFeatured !== undefined) filter.isFeatured = params.isFeatured;
    if (params.isNewArrival !== undefined) filter.isNewArrival = params.isNewArrival;
    if (params.isBestseller !== undefined) filter.isBestseller = params.isBestseller;

    // 9. Sorting allowlist
    const sortMap: Record<string, any> = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      newest: { createdAt: -1 },
      rating: { rating: -1, reviewCount: -1 },
      reviews: { reviewCount: -1 },
      discount: { discount: -1 },
    };
    const sort = sortMap[params.sort] || { createdAt: -1 };

    // 10. Listing projection (lean data for catalog grids)
    const query = Product.find(filter)
      .select('name slug images price compareAtPrice discount rating reviewCount stock isFeatured isNewArrival isBestseller brand category SKU')
      .populate('brand', 'name slug logo')
      .populate('category', 'name slug')
      .sort(sort)
      .lean();

    return paginateQuery(query as any, {
      page: params.page,
      limit: params.limit,
      maxLimit: 100,
    });
  }

  /**
   * Get single product by SEO slug (cached for 60s)
   */
  async getProductBySlug(slug: string): Promise<IProduct> {
    const cacheKey = `product:slug:${slug.toLowerCase()}`;
    const cached = appCache.get<IProduct>(cacheKey);
    if (cached) return cached;

    const product = await Product.findOne({ slug: slug.toLowerCase(), isActive: true })
      .populate('brand', 'name slug logo description website')
      .populate('category', 'name slug description')
      .populate('subcategory', 'name slug description');

    if (!product) {
      throw new AppError('Product not found or currently unavailable.', 404, 'PRODUCT_NOT_FOUND');
    }

    appCache.set(cacheKey, product, 60);
    return product;
  }

  /**
   * Autocomplete search suggestions (real database values only)
   */
  async getSearchSuggestions(queryText: string): Promise<{
    products: { name: string; slug: string }[];
    categories: { name: string; slug: string }[];
    brands: { name: string; slug: string }[];
  }> {
    if (!queryText || queryText.trim().length === 0) {
      return { products: [], categories: [], brands: [] };
    }

    const sanitized = queryText.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${sanitized}`, 'i');

    const [products, categories, brands] = await Promise.all([
      Product.find({ isActive: true, name: { $regex: regex } })
        .select('name slug -_id')
        .limit(5)
        .lean(),
      Category.find({ isActive: true, name: { $regex: regex } })
        .select('name slug -_id')
        .limit(3)
        .lean(),
      Brand.find({ isActive: true, name: { $regex: regex } })
        .select('name slug -_id')
        .limit(3)
        .lean(),
    ]);

    return {
      products: products as any,
      categories: categories as any,
      brands: brands as any,
    };
  }

  /**
   * Database-backed related products (same category or brand, excluding current product)
   */
  async getRelatedProducts(slug: string, limit: number = 4): Promise<IProduct[]> {
    const product = await Product.findOne({ slug: slug.toLowerCase() }).select('_id category brand tags');
    if (!product) {
      return [];
    }

    const related = await Product.find({
      _id: { $ne: product._id },
      isActive: true,
      $or: [
        { category: product.category },
        { brand: product.brand },
        { tags: { $in: product.tags } },
      ],
    })
      .select('name slug images price compareAtPrice discount rating reviewCount stock brand category')
      .populate('brand', 'name slug')
      .populate('category', 'name slug')
      .limit(limit)
      .lean();

    return related as any;
  }

  /**
   * Admin write: Create Product
   */
  async createProduct(data: any): Promise<IProduct> {
    const slug = data.slug ? slugify(data.slug) : slugify(data.name);

    const existingSlug = await Product.findOne({ slug });
    if (existingSlug) {
      throw new AppError('A product with this slug already exists.', 409, 'SLUG_EXISTS');
    }

    const existingSKU = await Product.findOne({ SKU: data.SKU.toUpperCase() });
    if (existingSKU) {
      throw new AppError('A product with this SKU already exists.', 409, 'SKU_EXISTS');
    }

    const product = new Product({
      ...data,
      slug,
      SKU: data.SKU.toUpperCase(),
    });

    await product.save();
    appCache.deletePrefix('product');
    return product;
  }

  /**
   * Admin write: Update Product
   */
  async updateProduct(id: string, data: any): Promise<IProduct> {
    if (data.slug) {
      data.slug = slugify(data.slug);
      const existingSlug = await Product.findOne({ slug: data.slug, _id: { $ne: id } });
      if (existingSlug) {
        throw new AppError('A product with this slug already exists.', 409, 'SLUG_EXISTS');
      }
    }

    if (data.SKU) {
      data.SKU = data.SKU.toUpperCase();
      const existingSKU = await Product.findOne({ SKU: data.SKU, _id: { $ne: id } });
      if (existingSKU) {
        throw new AppError('A product with this SKU already exists.', 409, 'SKU_EXISTS');
      }
    }

    const product = await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!product) {
      throw new AppError('Product not found.', 404, 'PRODUCT_NOT_FOUND');
    }

    appCache.deletePrefix('product');
    return product;
  }

  /**
   * Admin write: Delete Product
   */
  async deleteProduct(id: string): Promise<void> {
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      throw new AppError('Product not found.', 404, 'PRODUCT_NOT_FOUND');
    }

    appCache.deletePrefix('product');
  }
}

export const productService = new ProductService();
