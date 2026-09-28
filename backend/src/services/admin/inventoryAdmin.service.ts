import { Types } from 'mongoose';
import { Product } from '../../models/product.model.js';
import { AppError } from '../../utils/errors.js';
import { logAdminAction } from '../../utils/auditLogger.js';

export const LOW_STOCK_THRESHOLD = 10;

export class InventoryAdminService {
  async getInventory(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'low_stock' | 'out_of_stock' | 'in_stock';
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
        { 'variants.sku': { $regex: sanitized, $options: 'i' } },
      ];
    }

    if (params.status === 'out_of_stock') {
      filter.stock = { $lte: 0 };
    } else if (params.status === 'low_stock') {
      filter.stock = { $gt: 0, $lte: LOW_STOCK_THRESHOLD };
    } else if (params.status === 'in_stock') {
      filter.stock = { $gt: LOW_STOCK_THRESHOLD };
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .select('name SKU stock price variants isActive')
        .sort({ stock: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    const formatted = products.map((p: any) => {
      const stockStatus =
        p.stock <= 0
          ? 'OUT_OF_STOCK'
          : p.stock <= LOW_STOCK_THRESHOLD
          ? 'LOW_STOCK'
          : 'IN_STOCK';

      return {
        id: p._id,
        name: p.name,
        sku: p.SKU,
        stock: p.stock,
        price: p.price,
        stockStatus,
        isActive: p.isActive,
        variants: (p.variants || []).map((v: any) => ({
          name: v.name,
          sku: v.sku,
          stock: v.stock,
          price: v.price,
          stockStatus:
            v.stock <= 0
              ? 'OUT_OF_STOCK'
              : v.stock <= LOW_STOCK_THRESHOLD
              ? 'LOW_STOCK'
              : 'IN_STOCK',
        })),
      };
    });

    return {
      inventory: formatted,
      threshold: LOW_STOCK_THRESHOLD,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async adjustStock(params: {
    productId: string;
    variantSku?: string;
    adjustment: number;
    reason: string;
    adminId: string;
    ip?: string;
    ua?: string;
  }) {
    if (!Types.ObjectId.isValid(params.productId)) {
      throw new AppError('Invalid product ID', 400, 'INVALID_ID');
    }

    const product = await Product.findById(params.productId);
    if (!product) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }

    let oldStock = product.stock;
    let newStock = oldStock;
    let targetSku = product.SKU;

    if (params.variantSku) {
      const variant = product.variants.find(
        (v) => v.sku.toUpperCase() === params.variantSku!.toUpperCase()
      );
      if (!variant) {
        throw new AppError(`Variant with SKU "${params.variantSku}" not found`, 404, 'NOT_FOUND');
      }
      oldStock = variant.stock;
      newStock = oldStock + params.adjustment;
      targetSku = variant.sku;

      if (newStock < 0) {
        throw new AppError(
          `Cannot adjust stock below zero. Current stock is ${oldStock}, attempted adjustment: ${params.adjustment}`,
          400,
          'NEGATIVE_STOCK'
        );
      }

      variant.stock = newStock;
      // Recompute parent product total stock from variants
      product.stock = product.variants.reduce((sum, v) => sum + v.stock, 0);
    } else {
      newStock = oldStock + params.adjustment;
      if (newStock < 0) {
        throw new AppError(
          `Cannot adjust stock below zero. Current stock is ${oldStock}, attempted adjustment: ${params.adjustment}`,
          400,
          'NEGATIVE_STOCK'
        );
      }
      product.stock = newStock;
    }

    await product.save();

    await logAdminAction({
      adminId: params.adminId,
      action: 'STOCK_ADJUSTMENT',
      resource: 'Inventory',
      resourceId: product._id.toString(),
      previousState: { sku: targetSku, stock: oldStock },
      newState: { sku: targetSku, stock: newStock, adjustment: params.adjustment },
      reason: params.reason,
      ipAddress: params.ip,
      userAgent: params.ua,
    });

    return {
      productId: product._id,
      sku: targetSku,
      oldStock,
      adjustment: params.adjustment,
      newStock,
      reason: params.reason,
    };
  }
}

export const inventoryAdminService = new InventoryAdminService();
