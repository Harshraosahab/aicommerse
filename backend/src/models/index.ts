// Database Models Module
// Phase 2 Production Data Layer Foundation
// Centralized registry for all domain Mongoose models and type definitions.

export * from './user.model.js';
export * from './category.model.js';
export * from './brand.model.js';
export * from './product.model.js';
export * from './cart.model.js';
export * from './wishlist.model.js';
export * from './order.model.js';
export * from './review.model.js';
export * from './coupon.model.js';
export * from './interaction.model.js';
export * from './notification.model.js';
export * from './auditLog.model.js';
export * from './supportTicket.model.js';
export * from './banner.model.js';
export * from './faq.model.js';
export * from './communicationLog.model.js';

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
