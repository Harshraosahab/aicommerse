import { Router } from 'express';
import { wishlistController } from '../../../controllers/wishlist.controller.js';
import { authenticate } from '../../../middleware/auth.js';

const router = Router();

// All wishlist operations require user authentication
router.use(authenticate);

router.get('/', wishlistController.getWishlist);
router.post('/items', wishlistController.addItem);
router.delete('/items/:productId', wishlistController.removeItem);
router.delete('/', wishlistController.clearWishlist);
router.post('/items/:productId/cart', wishlistController.moveToCart);

export default router;
