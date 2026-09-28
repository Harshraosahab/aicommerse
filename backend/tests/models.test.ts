import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import {
  User,
  Category,
  Brand,
  Product,
  Cart,
  Wishlist,
  Order,
  Review,
  Coupon,
  Interaction,
  Notification,
} from '../src/models/index.js';

describe('Phase 2 Domain Models Schema Validation', () => {
  describe('User Model', () => {
    it('validates a valid user document', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'SecurePassword123!',
        role: 'USER',
      });
      const err = await user.validate();
      expect(err).toBeUndefined();
    });

    it('fails validation when email is invalid', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'invalid-email-format',
        password: 'SecurePassword123!',
      });
      await expect(user.validate()).rejects.toThrow(/email/i);
    });

    it('fails validation when required fields are missing', async () => {
      const user = new User({});
      await expect(user.validate()).rejects.toThrow();
    });
  });

  describe('Product Model', () => {
    it('validates a valid product document', async () => {
      const product = new Product({
        name: 'Wireless Noise-Canceling Headphones',
        slug: 'wireless-noise-canceling-headphones',
        description: 'Premium over-ear headphones with ANC.',
        category: new mongoose.Types.ObjectId(),
        price: 299.99,
        stock: 50,
        SKU: 'AUDIO-ANC-001',
      });
      const err = await product.validate();
      expect(err).toBeUndefined();
    });

    it('fails validation when price is negative', async () => {
      const product = new Product({
        name: 'Invalid Product',
        slug: 'invalid-product',
        description: 'Test description',
        category: new mongoose.Types.ObjectId(),
        price: -10,
        stock: 5,
        SKU: 'INVALID-001',
      });
      await expect(product.validate()).rejects.toThrow(/price cannot be negative/i);
    });

    it('fails validation when stock is negative', async () => {
      const product = new Product({
        name: 'Invalid Stock Product',
        slug: 'invalid-stock-product',
        description: 'Test description',
        category: new mongoose.Types.ObjectId(),
        price: 50,
        stock: -1,
        SKU: 'STOCK-001',
      });
      await expect(product.validate()).rejects.toThrow(/stock cannot be negative/i);
    });
  });

  describe('Category & Brand Models', () => {
    it('validates Category with hierarchy reference', async () => {
      const parentId = new mongoose.Types.ObjectId();
      const category = new Category({
        name: 'Smartphones',
        slug: 'smartphones',
        parentCategory: parentId,
      });
      const err = await category.validate();
      expect(err).toBeUndefined();
      expect(category.parentCategory).toEqual(parentId);
    });

    it('validates Brand document', async () => {
      const brand = new Brand({
        name: 'Acme Corp',
        slug: 'acme-corp',
        website: 'https://acme.example.com',
      });
      const err = await brand.validate();
      expect(err).toBeUndefined();
    });
  });

  describe('Order Model', () => {
    it('validates a complete valid order', async () => {
      const order = new Order({
        orderNumber: 'ORD-20260909-0001',
        user: new mongoose.Types.ObjectId(),
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            name: 'Mechanical Keyboard',
            price: 120.0,
            quantity: 1,
          },
        ],
        shippingAddress: {
          street: '123 Tech Lane',
          city: 'San Francisco',
          state: 'CA',
          postalCode: '94105',
          country: 'USA',
        },
        subtotal: 120.0,
        totalAmount: 120.0,
        paymentMethod: 'CREDIT_CARD',
        orderStatus: 'PENDING',
        paymentStatus: 'PENDING',
      });
      const err = await order.validate();
      expect(err).toBeUndefined();
    });

    it('fails validation when items array is empty', async () => {
      const order = new Order({
        orderNumber: 'ORD-20260909-EMPTY',
        user: new mongoose.Types.ObjectId(),
        items: [],
        shippingAddress: {
          street: '123 Tech Lane',
          city: 'San Francisco',
          state: 'CA',
          postalCode: '94105',
          country: 'USA',
        },
        subtotal: 0,
        totalAmount: 0,
        paymentMethod: 'CREDIT_CARD',
      });
      await expect(order.validate()).rejects.toThrow(/at least one item/i);
    });

    it('fails validation when order status is invalid enum', async () => {
      const order = new Order({
        orderNumber: 'ORD-20260909-INVALID',
        user: new mongoose.Types.ObjectId(),
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            name: 'Item',
            price: 10,
            quantity: 1,
          },
        ],
        shippingAddress: {
          street: 'Street',
          city: 'City',
          state: 'State',
          postalCode: '12345',
          country: 'Country',
        },
        subtotal: 10,
        totalAmount: 10,
        paymentMethod: 'CREDIT_CARD',
        orderStatus: 'INVALID_STATUS',
      });
      await expect(order.validate()).rejects.toThrow(/valid order status/i);
    });
  });

  describe('Review Model', () => {
    it('fails validation when rating is outside 1-5 range', async () => {
      const reviewLow = new Review({
        user: new mongoose.Types.ObjectId(),
        product: new mongoose.Types.ObjectId(),
        rating: 0,
        comment: 'Too low',
      });
      await expect(reviewLow.validate()).rejects.toThrow(/at least 1 star/i);

      const reviewHigh = new Review({
        user: new mongoose.Types.ObjectId(),
        product: new mongoose.Types.ObjectId(),
        rating: 6,
        comment: 'Too high',
      });
      await expect(reviewHigh.validate()).rejects.toThrow(/cannot exceed 5 stars/i);
    });
  });

  describe('Coupon Model', () => {
    it('converts coupon code to uppercase and validates dates', async () => {
      const coupon = new Coupon({
        code: 'save20',
        type: 'PERCENTAGE',
        value: 20,
        startDate: new Date('2026-01-01'),
        expiryDate: new Date('2026-12-31'),
      });
      const err = await coupon.validate();
      expect(err).toBeUndefined();
      expect(coupon.code).toBe('SAVE20');
    });
  });

  describe('Interaction & Notification Models', () => {
    it('validates Interaction action enum', async () => {
      const interaction = new Interaction({
        action: 'ADD_TO_CART',
        metadata: { source: 'search_results' },
      });
      const err = await interaction.validate();
      expect(err).toBeUndefined();
    });

    it('rejects invalid Interaction action', async () => {
      const interaction = new Interaction({
        action: 'INVALID_ACTION',
      });
      await expect(interaction.validate()).rejects.toThrow(/valid interaction action/i);
    });

    it('validates Notification model', async () => {
      const notification = new Notification({
        user: new mongoose.Types.ObjectId(),
        type: 'ORDER_UPDATE',
        title: 'Order Shipped',
        message: 'Your order is on its way.',
      });
      const err = await notification.validate();
      expect(err).toBeUndefined();
      expect(notification.isRead).toBe(false);
    });
  });

  describe('Cart & Wishlist Models', () => {
    it('validates Cart with valid user and items', async () => {
      const cart = new Cart({
        user: new mongoose.Types.ObjectId(),
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            quantity: 2,
            priceAtAddition: 49.99,
          },
        ],
      });
      const err = await cart.validate();
      expect(err).toBeUndefined();
    });

    it('validates Wishlist with valid user', async () => {
      const wishlist = new Wishlist({
        user: new mongoose.Types.ObjectId(),
        items: [],
      });
      const err = await wishlist.validate();
      expect(err).toBeUndefined();
    });
  });
});
