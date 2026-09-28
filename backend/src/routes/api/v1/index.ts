import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import productRoutes from './product.routes.js';
import categoryRoutes from './category.routes.js';
import brandRoutes from './brand.routes.js';
import cartRoutes from './cart.routes.js';
import wishlistRoutes from './wishlist.routes.js';
import checkoutRoutes from './checkout.routes.js';
import orderRoutes from './order.routes.js';
import paymentRoutes from './payment.routes.js';
import adminRoutes from './admin.routes.js';
import interactionRoutes from './interaction.routes.js';
import recommendationRoutes from './recommendation.routes.js';
import aiRoutes from './ai.routes.js';
import adminAIRoutes from './adminAI.routes.js';
import notificationRoutes from './notification.routes.js';
import supportRoutes from './support.routes.js';
import faqRoutes from './faq.routes.js';
import seoRoutes from './seo.routes.js';

const router = Router();

// Mount active endpoints
router.use('/', healthRoutes);
router.use('/', seoRoutes);
router.use('/seo', seoRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/brands', brandRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/support', supportRoutes);
router.use('/faqs', faqRoutes);
router.use('/admin/ai', adminAIRoutes);
router.use('/admin', adminRoutes);
router.use('/interactions', interactionRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/ai', aiRoutes);

export default router;


