import { Router } from 'express';
import { cartController } from '../../../controllers/cart.controller.js';
import { authenticate } from '../../../middleware/auth.js';

const router = Router();

// All cart operations require user authentication
router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/items', cartController.addItem);
router.patch('/items/:itemId', cartController.updateItemQuantity);
router.delete('/items/:itemId', cartController.removeItem);
router.delete('/', cartController.clearCart);
router.post('/items/:itemId/wishlist', cartController.moveToWishlist);

export default router;
